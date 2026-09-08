// Isolated browser fixture: no model calls, host settings or workspace writes.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { apply } from '../src/client.js';

function store(initial) {
  let value = initial;
  const listeners = new Set();
  return {
    getSnapshot: () => value,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    update: (patch) => { value = { ...value, ...patch }; listeners.forEach((fn) => fn()); },
    use: (selector) => selector(React.useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn); }, () => value)),
  };
}
const settings = store({ status: 'ready', writable: true, value: { enabled: true, projects: {} } });
const state = store({ sessionId: 'fixture-a', cwd: '/fixture/blank', running: false, blank: true, turnEnds: new Map(), promptError: null, lastAgentError: null });
const composer = store({ draft: '', phase: 'plain' });
const sources = { '/fixture/blank': [], '/fixture/second': ['sources/seed.pdf', 'plugins/code-reviewer.yml'] };
const registrations = {};
let failScan = false;
let failSave = false;
const scope = {
  ...settings,
  set: async (key, value) => {
    if (failSave) throw new Error('Fixture: settings failure');
    settings.update({ value: { ...settings.getSnapshot().value, [key]: value } });
  },
};
const ctx = {
  settingsScope: { bind: () => scope },
  slots: { inject: (_name, setup) => setup(), register: (descriptor, render) => { registrations[descriptor.name] = render; } },
  layout: { openDetails() {}, closeDetails() {}, toggleSidebar() {} }, emit() {},
  remote: { fileReferences: { list: async () => {
    if (failScan) return { ok: false, error: { message: 'Fixture: offline' } };
    return { ok: true, value: sources[state.getSnapshot().cwd].map((path) => ({ kind: 'file', path })) };
  } } },
};
const inputActions = {
  setDraft: (draft) => composer.update({ draft }),
  submit: () => { state.update({ running: true, blank: false, lastAgentError: null }); composer.update({ draft: '' }); },
};
apply(ctx);

function App() {
  const session = state.use((s) => s);
  const input = composer.use((s) => s);
  const props = { sessionId: session.sessionId, session, useSession: state.use, useSessions: (selector) => state.use((s) => selector({ byId: { [s.sessionId]: { cwd: s.cwd } } })), useInput: composer.use, inputActions };
  return <main style={{ fontFamily: 'system-ui', marginRight: 360, padding: 24 }}>
    <h1>Isolated workbench fixture</h1>
    <p>Only simulated DSH state. No research service is called.</p>
    <button onClick={() => { const s = state.getSnapshot(); sources[s.cwd].push('literature/research-gap.md'); state.update({ running: false, turnEnds: new Map([[1, 100]]) }); }}>模拟完成并产出文件</button>
    <button onClick={() => state.update({ running: false, lastAgentError: 'Fixture model unavailable' })}>模拟失败</button>
    <button onClick={() => { state.update({ sessionId: 'fixture-b', cwd: '/fixture/second', running: false, blank: true, turnEnds: new Map() }); composer.update({ draft: '' }); }}>切换第二项目</button>
    <button onClick={() => { state.update({ sessionId: 'fixture-a', cwd: '/fixture/blank', running: false, blank: false, turnEnds: new Map([[1, 100]]) }); composer.update({ draft: '' }); }}>返回第一项目</button>
    <textarea aria-label="模拟对话框" value={input.draft} onChange={(e) => composer.update({ draft: e.target.value })} style={{ display: 'block', width: '90%', minHeight: 250, marginTop: 20 }} />
    {registrations[session.blank ? 'conversation.input.dock' : 'conversation.session.header.actions'](props)}
  </main>;
}
window.fixture = {
  settings: () => settings.getSnapshot().value,
  state: () => state.getSnapshot(),
  setFailSave: (value) => { failSave = value; },
  setFailScan: (value) => { failScan = value; },
  setWritable: (value) => settings.update({ writable: value }),
};
createRoot(document.getElementById('root')).render(<App />);
