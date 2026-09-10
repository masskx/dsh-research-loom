import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rename, unlink, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanMaterialFiles, registerMaterialScanner } from '../lib/material-scan.js';
import { analyzePaperArtifacts } from '../src/paper-state.js';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'research-loom-scan-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
const paths = result => result.files.map(file => file.path);

test('same session scanner sees files added, renamed and removed after an empty scan', async t => {
  const root = await fixture(t);
  let service;
  let enabled = true;
  let dispose;
  registerMaterialScanner({
    provide(name, value) { assert.equal(name, 'researchLoom'); service = value; },
    typert: { register(contribution) { assert.equal(contribution.invocations[0].scope.wire, 'agentId'); return () => {}; } },
    effect(setup) { dispose = setup(); },
  }, { get: () => ({ enabled }) });
  t.after(() => dispose());
  const agent = { session: { header: { cwd: root } } };
  const scan = () => service.scan(agent, new AbortController().signal);
  assert.deepEqual(paths(await scan()), []);
  await mkdir(join(root, 'literature'));
  await writeFile(join(root, 'literature', 'research-gap.md'), 'test placeholder');
  const added = await scan();
  assert.deepEqual(paths(added), ['literature/research-gap.md']);
  assert.equal(added.incomplete, false);
  assert.equal(analyzePaperArtifacts(added.files).modules.literature.materialChecks.find(c => c.id === 'matrix').status, 'found');
  await rename(join(root, 'literature', 'research-gap.md'), join(root, 'literature', 'matrix.md'));
  assert.deepEqual(paths(await scan()), ['literature/matrix.md']);
  await unlink(join(root, 'literature', 'matrix.md'));
  assert.deepEqual(paths(await scan()), []);
  enabled = false;
  await assert.rejects(scan, /disabled/);
  await assert.rejects(() => service.scan({ session: { header: {} } }), /disabled/);
  enabled = true;
  await assert.rejects(() => service.scan({ session: { header: {} } }), /workspace/);
});

test('enumerates more than the host completion limit, including nested and unicode paths', async t => {
  const root = await fixture(t);
  await mkdir(join(root, '资料 空间', '深层'), { recursive: true });
  for (let i = 0; i < 35; i++) await writeFile(join(root, `paper-${i}.pdf`), 'test');
  await writeFile(join(root, '资料 空间', '深层', '文献矩阵.md'), 'test');
  await mkdir(join(root, 'node_modules'));
  await writeFile(join(root, 'node_modules', 'ignored.md'), 'test');
  const result = await scanMaterialFiles(root);
  assert.equal(result.files.length, 36);
  assert(paths(result).includes('资料 空间/深层/文献矩阵.md'));
  assert.equal(result.incomplete, false);
});

test('bounds large scans and marks the returned list incomplete', async t => {
  const root = await fixture(t);
  for (let i = 0; i < 3; i++) await writeFile(join(root, `p${i}.md`), 'test');
  const cut = await scanMaterialFiles(root, { maxFiles: 2 });
  assert.equal(cut.files.length, 2);
  assert(cut.incomplete && cut.warnings.includes('file-limit'));
  assert.equal((await scanMaterialFiles(root, { maxFiles: 3 })).incomplete, false);
  assert((await scanMaterialFiles(root, { maxEntries: 1 })).warnings.includes('entry-limit'));
  await mkdir(join(root, 'nested', 'deeper'), { recursive: true });
  assert((await scanMaterialFiles(root, { maxDirectories: 1 })).warnings.includes('directory-limit'));
  assert((await scanMaterialFiles(root, { maxDepth: 1 })).warnings.includes('depth-limit'));
});

test('does not follow directory symlinks or escape the workspace', async t => {
  const root = await fixture(t);
  const outside = await fixture(t);
  await writeFile(join(outside, 'private.md'), 'not in project');
  await symlink(outside, join(root, 'external'), process.platform === 'win32' ? 'junction' : 'dir');
  const result = await scanMaterialFiles(root);
  assert.deepEqual(result.files, []);
  assert.equal(result.incomplete, true);
});

test('aborted and unavailable scans reject instead of appearing empty and complete', async t => {
  const root = await fixture(t);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() => scanMaterialFiles(root, { signal: controller.signal }), { name: 'AbortError' });
  await assert.rejects(() => scanMaterialFiles(join(root, 'missing')));
  await assert.rejects(() => scanMaterialFiles('relative/project'), /workspace/);
});
