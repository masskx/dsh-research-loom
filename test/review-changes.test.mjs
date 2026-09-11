import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, symlink, link, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectReviewChanges } from '../lib/review-changes.js';
import { registerMaterialScanner } from '../lib/material-scan.js';
import { scanRemote, scanHost } from '../lib/material-scan-contract.js';

async function fixture(t, original = 'Title\nSix methods.\nConclusion\n', revised = 'Title\nTen methods.\nConclusion\n') {
  const root = await mkdtemp(join(tmpdir(), 'loom-changes-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'main.tex'), original);
  await writeFile(join(root, 'revised.tex'), revised);
  return root;
}
const request = { manuscript: 'main.tex', revised: 'revised.tex' };

test('compares actual text with line locations and fingerprints without modifying either file', async t => {
  const root = await fixture(t);
  const filesBefore = await Promise.all(['main.tex', 'revised.tex'].map(path => readFile(join(root, path))));
  const result = await inspectReviewChanges(root, request);
  assert.equal(result.status, 'available');
  assert.equal(result.same, false);
  assert.deepEqual(result.before, { startLine: 2, endLine: 2, text: 'Six methods.', truncated: false });
  assert.equal(result.after.text, 'Ten methods.');
  assert.notEqual(result.originalHash, result.revisedHash);
  assert.deepEqual(await Promise.all(['main.tex', 'revised.tex'].map(path => readFile(join(root, path)))), filesBefore);
});

test('identical copies and pure insertions/deletions are represented honestly', async t => {
  const root = await fixture(t, 'same', 'same');
  assert.equal((await inspectReviewChanges(root, request)).same, true);
  await writeFile(join(root, 'revised.tex'), 'same\nadded');
  const inserted = await inspectReviewChanges(root, request);
  assert.equal(inserted.before.text, '');
  assert.equal(inserted.before.endLine < inserted.before.startLine, true);
  assert.equal(inserted.after.text, 'added');
  const deleted = await inspectReviewChanges(root, { manuscript: 'revised.tex', revised: 'main.tex' });
  assert.equal(deleted.before.text, 'added');
  assert.equal(deleted.after.text, '');
});

test('large, binary and unsupported document formats never pretend to have text differences', async t => {
  const root = await fixture(t);
  for (const content of [Buffer.alloc(512 * 1024 + 1, 65), Buffer.from([0xff, 0xfe, 0x41]), Buffer.from('text\0binary')]) {
    await writeFile(join(root, 'revised.tex'), content);
    const result = await inspectReviewChanges(root, request);
    assert.equal(result.status, 'unsupported');
    assert.equal(result.originalHash, '');
  }
  await writeFile(join(root, 'revision.docx'), 'not parsed as plain text');
  assert.equal((await inspectReviewChanges(root, { ...request, revised: 'revision.docx' })).status, 'unsupported');
});

test('preview truncation is explicit and long unchanged context is not mistaken for multiple edits', async t => {
  const root = await fixture(t, 'before\n' + 'a'.repeat(9000) + '\nend', 'after\n' + 'a'.repeat(9000) + '\nnew end');
  const result = await inspectReviewChanges(root, request);
  assert.equal(result.before.truncated, true);
  assert.equal(result.before.text.length, 8000);
  assert.equal(result.before.endLine, 3);
  assert.match(result.notice, /未变行/);
});

test('comparison rejects hardlink originals, missing files and paths outside the session workspace', async t => {
  const root = await fixture(t);
  const outside = await fixture(t);
  await link(join(root, 'main.tex'), join(root, 'alias.tex'));
  await symlink(outside, join(root, 'external'), process.platform === 'win32' ? 'junction' : 'dir');
  for (const revised of ['alias.tex', 'missing.tex', join(outside, 'revised.tex'), 'external/revised.tex']) {
    await assert.rejects(() => inspectReviewChanges(root, { ...request, revised }));
  }
  const controller = new AbortController(); controller.abort();
  await assert.rejects(() => inspectReviewChanges(root, request, controller.signal), { name: 'AbortError' });
});

test('host comparison is enabled-only, session-bound and uses matching remote schemas', async t => {
  const root = await fixture(t);
  let enabled = true;
  let service;
  registerMaterialScanner({ provide(_key, value) { service = value; }, typert: { register() {} }, effect(fn) { fn(); } }, { get: () => ({ enabled }) });
  const result = await service.inspectReviewChanges({ session: { header: { cwd: root } } }, request);
  const descriptor = scanRemote.descriptors.find(item => item.method === 'inspectReviewChanges');
  assert.ok(scanHost.invocations.includes(descriptor));
  assert.deepEqual(descriptor.result.schema.parse(result), result);
  assert.throws(() => descriptor.parameters[1].codec.schema.parse({ ...request, root }));
  await assert.rejects(() => service.inspectReviewChanges({ session: { header: {} } }, request), /workspace/);
  enabled = false;
  await assert.rejects(() => service.inspectReviewChanges({ session: { header: { cwd: root } } }, request), /disabled/);
});
