import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink, link } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { validateReviewFiles } from '../lib/review-files.js';
import { registerMaterialScanner } from '../lib/material-scan.js';
import { scanHost, scanRemote } from '../lib/material-scan-contract.js';

const request = patch => ({ phase: 'plan', manuscript: 'paper/main.md', expectedManuscript: 'paper/main.md', revised: '', previousRevised: '', ...patch });
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'research-loom-review-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'paper'));
  for (const name of ['main.md', 'revision-1.md', 'revision-2.md']) await writeFile(join(root, 'paper', name), name);
  return root;
}

test('canonicalizes absolute, dot-segment and separator aliases without relying on path spelling', async t => {
  const root = await fixture(t);
  for (const manuscript of ['./paper/main.md', 'paper/../paper/main.md', 'paper\\main.md', join(root, 'paper', 'main.md')]) {
    assert.deepEqual(await validateReviewFiles(root, request({ manuscript })), { manuscript: 'paper/main.md', revised: '' });
  }
  await symlink(join(root, 'paper'), join(root, 'alias'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.deepEqual(await validateReviewFiles(root, request({ manuscript: 'alias/main.md' })), { manuscript: 'paper/main.md', revised: '' });
});

test('rejects a different original on the first plan and later phases', async t => {
  const root = await fixture(t);
  await assert.rejects(() => validateReviewFiles(root, request({ manuscript: 'paper/revision-1.md' })), /specified original/);
  await assert.rejects(() => validateReviewFiles(root, request({ phase: 'revise', manuscript: 'paper/revision-1.md', revised: 'paper/revision-2.md' })), /specified original/);
  assert.equal((await validateReviewFiles(root, request({ expectedManuscript: '' }))).manuscript, 'paper/main.md');
});

test('requires an independent revision, preserving the original and previous revision across aliases', async t => {
  const root = await fixture(t);
  const revision = request({ phase: 'revise', revised: 'paper/revision-2.md', previousRevised: 'paper/revision-1.md' });
  assert.equal((await validateReviewFiles(root, revision)).revised, 'paper/revision-2.md');
  for (const revised of ['./paper/main.md', join(root, 'paper', 'main.md')]) {
    await assert.rejects(() => validateReviewFiles(root, { ...revision, revised }), /separate file/);
  }
  await assert.rejects(() => validateReviewFiles(root, { ...revision, revised: './paper/revision-1.md' }), /preserve the previous/);
  await assert.rejects(() => validateReviewFiles(root, { ...revision, revised: '' }), /Missing revised/);
});

test('hard links are recognized as the same original or revised file', async t => {
  const root = await fixture(t);
  await link(join(root, 'paper', 'main.md'), join(root, 'paper', 'original-hardlink.md'));
  await link(join(root, 'paper', 'revision-1.md'), join(root, 'paper', 'revision-hardlink.md'));
  await validateReviewFiles(root, request({ manuscript: 'paper/original-hardlink.md' }));
  await assert.rejects(() => validateReviewFiles(root, request({ phase: 'revise', revised: 'paper/original-hardlink.md' })), /separate file/);
  await assert.rejects(() => validateReviewFiles(root, request({ phase: 'revise', revised: 'paper/revision-hardlink.md', previousRevised: 'paper/revision-1.md' })), /preserve the previous/);
  await validateReviewFiles(root, request({ phase: 'verify', revised: 'paper/revision-hardlink.md', previousRevised: 'paper/revision-1.md' }));
});

test('verification must address the same existing revision and accepts an in-workspace link alias', async t => {
  const root = await fixture(t);
  await symlink(join(root, 'paper'), join(root, 'alias'), process.platform === 'win32' ? 'junction' : 'dir');
  const verify = request({ phase: 'verify', revised: 'alias/revision-1.md', previousRevised: 'paper/revision-1.md' });
  assert.deepEqual(await validateReviewFiles(root, verify), { manuscript: 'paper/main.md', revised: 'paper/revision-1.md' });
  await assert.rejects(() => validateReviewFiles(root, { ...verify, revised: 'paper/revision-2.md' }), /Verification/);
  await assert.rejects(() => validateReviewFiles(root, { ...verify, previousRevised: '' }), /Missing previous/);
  await assert.rejects(() => validateReviewFiles(root, { ...verify, revised: 'alias/main.md', previousRevised: 'paper/main.md' }), /separate file/);
});

test('Windows case aliases resolve to the same file', { skip: process.platform !== 'win32' }, async t => {
  const root = await fixture(t);
  await validateReviewFiles(root, request({ manuscript: 'PAPER/MAIN.MD' }));
  await assert.rejects(() => validateReviewFiles(root, request({ phase: 'revise', revised: 'PAPER/MAIN.MD' })), /separate file/);
});

test('rejects missing files, directories, traversal and links outside the receiving workspace', async t => {
  const root = await fixture(t);
  const outside = await fixture(t);
  await symlink(outside, join(root, 'external'), process.platform === 'win32' ? 'junction' : 'dir');
  for (const manuscript of ['paper/missing.md', 'paper', join(outside, 'paper', 'main.md'), relative(root, join(outside, 'paper', 'main.md')), 'external/paper/main.md']) {
    await assert.rejects(() => validateReviewFiles(root, request({ manuscript, expectedManuscript: '' })));
  }
  await assert.rejects(() => validateReviewFiles(root, request({ phase: 'revise', revised: 'paper/not-created.md' })));
  await assert.rejects(() => validateReviewFiles('relative/project', request()), /workspace/);
});

test('validates the fixed request shape and propagates cancellation', async t => {
  const root = await fixture(t);
  for (const invalid of [null, [], {}, request({ phase: 'delete' }), request({ manuscript: 7 }), request({ revised: 'bad\0path' }), { ...request(), arbitraryRoot: root }]) {
    await assert.rejects(() => validateReviewFiles(root, invalid), /Invalid review/);
  }
  await assert.rejects(() => validateReviewFiles(root, request({ manuscript: '' })), /Missing manuscript/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() => validateReviewFiles(root, request(), controller.signal), { name: 'AbortError' });
});

test('host exposes a session-bound enabled-only validator with a matching remote contract', async t => {
  const root = await fixture(t);
  let enabled = true;
  let service;
  registerMaterialScanner({
    provide(name, value) { assert.equal(name, 'researchLoom'); service = value; },
    typert: { register(contribution) { assert.equal(contribution, scanHost); } },
    effect(setup) { setup(); },
  }, { get: () => ({ enabled }) });
  const agent = { session: { header: { cwd: root } } };
  assert.deepEqual(await service.validateReviewFiles(agent, request()), { manuscript: 'paper/main.md', revised: '' });
  await assert.rejects(() => service.validateReviewFiles({ session: { header: {} } }, request()), /workspace/);
  enabled = false;
  await assert.rejects(() => service.validateReviewFiles(agent, request()), /disabled/);
  const descriptor = scanRemote.descriptors.find(item => item.method === 'validateReviewFiles');
  assert(scanHost.invocations.includes(descriptor));
  assert.equal(descriptor.parameters[0].lookup, 'agent');
  assert.equal(descriptor.parameters[1].source, 'json');
  assert.equal(descriptor.cancellation.parameter, 'signal');
  assert.deepEqual(descriptor.parameters[1].codec.schema.parse(request()), request());
  assert.throws(() => descriptor.parameters[1].codec.schema.parse(request({ phase: 'delete' })));
  assert.throws(() => descriptor.parameters[1].codec.schema.parse({ ...request(), root }));
});
