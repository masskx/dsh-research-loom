import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { apply } from '../src/client.js';
import { GettingStartedPanel } from '../src/getting-started-panel.js';
import { MaterialsPanel } from '../src/workbench-panels.js';

function store(initial) {
  let value = initial;
  const listeners = new Set();
  const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
  const getSnapshot = () => value;
  return { subscribe, getSnapshot, update(patch) { value = { ...value, ...patch }; listeners.forEach(fn => fn()); },
    use(selector) { return selector(React.useSyncExternalStore(subscribe, getSnapshot)); } };
}
const settle = async () => { await act(async () => { await new Promise(resolve => setImmediate(resolve)); }); };
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

async function fixture(t, tasks = []) {
  const settings = store({ status: 'ready', writable: true, value: { enabled: true, projects: { '/paper': { tasks } } } });
  const state = store({ sessionId: 'one', cwd: '/paper', running: tasks.length > 0, turnEnds: new Map([[1, 10]]), nodes: [] });
  const input = store({ draft: '', phase: 'plain' });
  let saveGate, scanGate, scanError = false, scans = 0, files = ['sources/old.pdf'];
  const scope = { ...settings, async set(key, value) {
    const gate = saveGate; saveGate = null;
    if (gate) await gate.promise;
    settings.update({ value: { ...settings.getSnapshot().value, [key]: value } });
  } };
  const slots = {};
  const ctx = {
    settingsScope: { bind: () => scope }, inject: (_, setup) => setup(ctx), emit() {},
    slots: { inject: (_, setup) => setup(), register: (description, render) => { slots[description.name] = render; } },
    layout: { openDetails() {}, closeDetails() {}, toggleSidebar() {} },
    remote: { $mount: async () => () => {}, researchLoom: { async scan() {
      scans++;
      const gate = scanGate; scanGate = null;
      if (gate) await gate.promise;
      return scanError ? { ok: false, error: { message: 'offline' } } : { ok: true, value: { files: files.map(path => ({ path, kind: 'file' })), incomplete: false } };
    } } },
  };
  await apply(ctx);
  const inputActions = { setDraft: draft => input.update({ draft }), submit() {} };
  function App() {
    const session = state.use(s => s);
    return slots['conversation.session.header.actions']({ session, sessionId: session.sessionId,
      useSession: state.use, useSessions: selector => state.use(s => selector({ byId: { [s.sessionId]: { cwd: s.cwd } } })), useInput: input.use, inputActions });
  }
  let renderer;
  await act(async () => { renderer = create(React.createElement(App)); });
  t.after(async () => { await act(async () => renderer.unmount()); });
  await act(async () => { renderer.root.findByProps({ 'data-testid': 'academic-paper-status-trigger' }).props.onClick(); });
  return { renderer, state, settings,
    get scans() { return scans; },
    delaySave() { saveGate = deferred(); return saveGate; },
    delayScan() { scanGate = deferred(); return scanGate; },
    setFiles(value) { files = value; }, failScan() { scanError = true; },
    project() { return settings.getSnapshot().value.projects['/paper']; },
    async materials() {
      await act(async () => renderer.root.findAllByType('nav')[0].findAllByType('button')[1].props.onClick());
      return () => renderer.root.findByType(MaterialsPanel).props;
    },
  };
}

test('completed task waits for persistence then records files even when scanning is faster', async t => {
  const task = { id: 'task', sessionId: 'one', stageId: 'literature', status: 'running', startedAt: '', endSeq: 10, baseline: ['sources/old.pdf'], outputs: [] };
  const app = await fixture(t, [task]);
  const gate = app.delaySave();
  app.setFiles(['sources/old.pdf', 'literature/new.md']);
  const scansBefore = app.scans;
  await act(async () => app.state.update({ running: false, turnEnds: new Map([[1, 20]]) }));
  assert.equal(app.project().tasks[0].status, 'running');
  assert.equal(app.scans, scansBefore, 'completion scan must wait until checking is persisted');
  await act(async () => gate.resolve());
  await settle();
  assert.equal(app.project().tasks[0].status, 'review');
  assert.deepEqual(app.project().tasks[0].outputs, ['literature/new.md']);
});

test('rescan retains cached materials while waiting and after failure', async t => {
  const app = await fixture(t);
  const materials = await app.materials();
  assert.equal(materials().report.candidateCount, 1);
  const gate = app.delayScan();
  await act(async () => materials().rescan());
  assert.equal(materials().scanning, true);
  assert.equal(materials().report.candidateCount, 1);
  app.failScan();
  t.mock.method(console, 'warn', () => {});
  await act(async () => gate.resolve());
  assert.equal(materials().scanning, false);
  assert.deepEqual(materials().report.sourceFiles, ['sources/old.pdf']);
  assert.equal(app.renderer.root.findAllByProps({ role: 'alert' }).length, 1);
});

test('scope changes trigger a host scan and another workspace cannot display the old cache', async t => {
  const app = await fixture(t);
  const materials = await app.materials();
  const initialScans = app.scans;
  await act(async () => materials().saveConfig({ scanRoot: 'papers' }));
  assert.equal(app.scans, initialScans + 1);
  await act(async () => materials().saveConfig({ excludedFolders: ['papers/excluded'] }));
  assert.equal(app.scans, initialScans + 2);
  app.failScan();
  t.mock.method(console, 'warn', () => {});
  await act(async () => app.state.update({ cwd: '/second', sessionId: 'two' }));
  assert.equal(app.renderer.root.findByType(GettingStartedPanel).props.report.candidateCount, 0);
});
