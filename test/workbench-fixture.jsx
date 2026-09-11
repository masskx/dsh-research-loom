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
let failValidation = false;
let saveDelay = 0;
const scope = {
  ...settings,
  set: async (key, value) => {
    if (saveDelay) await new Promise(resolve => setTimeout(resolve, saveDelay));
    if (failSave) throw new Error('Fixture: settings failure');
    settings.update({ value: { ...settings.getSnapshot().value, [key]: value } });
  },
};
const ctx = {
  inject: (_dependencies, setup) => setup(ctx),
  settingsScope: { bind: () => scope },
  slots: { inject: (_name, setup) => setup(), register: (descriptor, render) => { registrations[descriptor.name] = render; } },
  layout: { openDetails() {}, closeDetails() {}, toggleSidebar() {} }, emit() {},
  remote: { $mount: async () => () => {}, researchLoom: { scan: async () => {
    if (failScan) return { ok: false, error: { message: 'Fixture: offline' } };
    return { ok: true, value: { files: sources[state.getSnapshot().cwd].map((path) => ({ kind: 'file', path })), incomplete: false, warnings: [] } };
  }, validateReviewFiles: async (_sessionId, request) => failValidation
    ? { ok: false, error: { message: 'Fixture: manuscript identity mismatch' } }
    : { ok: true, value: { manuscript: request.manuscript, revised: request.revised } },
    inspectReviewChanges: async (_sessionId, request) => ({ ok: true, value: { ...request, status: 'available', same: false,
      originalHash: 'fixture-original', revisedHash: 'fixture-revised', before: { startLine: 2, endLine: 2, text: 'Six comparison methods.', truncated: false },
      after: { startLine: 2, endLine: 2, text: 'Ten comparison methods.', truncated: false }, notice: '隔离演示中的模拟差异；真实文件比较由宿主文件系统测试验证。' } }),
  } },
};
const inputActions = {
  setDraft: (draft) => composer.update({ draft }),
  submit: () => {
    const current = state.getSnapshot();
    const seq = Math.max(0, ...(current.nodes ?? []).map((node) => node.seq)) + 1;
    state.update({ nodes: [...(current.nodes ?? []), { kind: 'user', seq, content: [{ type: 'text', text: composer.getSnapshot().draft }] }], running: true, blank: false, lastAgentError: null });
    composer.update({ draft: '' });
  },
};
const ready = apply(ctx);

function App() {
  const session = state.use((s) => s);
  const input = composer.use((s) => s);
  const props = { sessionId: session.sessionId, session, useSession: state.use, useSessions: (selector) => state.use((s) => selector({ byId: { [s.sessionId]: { cwd: s.cwd } } })), useInput: composer.use, inputActions };
  return <main style={{ fontFamily: 'system-ui', marginRight: 360, padding: 24 }}>
    <h1>Isolated workbench fixture</h1>
    <p>Only simulated DSH state. No research service is called.</p>
    <button onClick={() => { const s = state.getSnapshot(); sources[s.cwd].push('literature/research-gap.md'); state.update({ running: false, turnEnds: new Map([[1, 100]]) }); }}>模拟完成并产出文件</button>
    <button onClick={() => state.update({ running: false, lastAgentError: 'Fixture model unavailable' })}>模拟失败</button>
    <button onClick={() => {
      state.update({ nodes: [{ kind: 'assistant', seq: 2, turn: 1, messageId: 'seed-review', blocks: [{ kind: 'text', text: 'R1.1 引言未说明贡献，请明确研究问题。R1.2 缺少外部验证，请补做实验。' }] }], turnEnds: new Map([[1, 3]]), running: false });
    }}>载入模拟审稿回复</button>
    <button onClick={() => { state.update({ sessionId: 'fixture-b', cwd: '/fixture/second', running: false, blank: true, turnEnds: new Map() }); composer.update({ draft: '' }); }}>切换第二项目</button>
    <button onClick={() => { state.update({ sessionId: 'fixture-a', cwd: '/fixture/blank', running: false, blank: false, turnEnds: new Map([[1, 100]]) }); composer.update({ draft: '' }); }}>返回第一项目</button>
    <textarea aria-label="模拟对话框" value={input.draft} onChange={(e) => composer.update({ draft: e.target.value })} style={{ display: 'block', width: '90%', minHeight: 250, marginTop: 20 }} />
    {registrations[session.blank ? 'conversation.input.dock' : 'conversation.session.header.actions'](props)}
  </main>;
}
window.fixture = {
  addFiles: paths => { const cwd = state.getSnapshot().cwd; sources[cwd] = [...new Set([...sources[cwd], ...paths])]; },
  settings: () => settings.getSnapshot().value,
  state: () => state.getSnapshot(),
  setFailSave: (value) => { failSave = value; },
  setFailScan: (value) => { failScan = value; },
  setFailValidation: (value) => { failValidation = value; },
  setSaveDelay: (value) => { saveDelay = value; },
  setWritable: (value) => settings.update({ writable: value }),
  completeReview: (options = {}) => {
    const current = state.getSnapshot();
    const loop = JSON.parse(settings.getSnapshot().value.projects[current.cwd].reviewLoop);
    const seq = Math.max(0, ...current.nodes.map((node) => node.seq)) + 1;
    const turn = Math.max(0, ...current.turnEnds.keys()) + 1;
    const result = { version: 1, phase: loop.phase, outcome: 'ready', summary: '模拟结果，不是真实学术结论', manuscript: 'paper/main.md', revised: loop.phase === 'plan' ? '' : `paper/revised-${loop.round}.md`, issues: [
      { id: 'R1.1', comment: '引言未说明贡献', source: { path: loop.sourceFiles?.[0] || '', reviewer: 'R1', commentId: '1', location: '第 1 段', quote: '引言未说明贡献' }, explanation: '让读者理解论文具体解决了哪个问题。', completionCheck: '对照引言与真实方法核对贡献表述。', applicability: 'applicable', kind: 'text', priority: 'high', status: loop.phase === 'plan' || options.unresolved ? 'open' : 'resolved', location: '引言第 3 段', action: '明确研究问题', evidence: loop.phase === 'plan' ? '' : '修订稿引言第 3 段说明研究问题' },
      { id: 'R1.2', comment: '缺少外部验证', source: { path: loop.sourceFiles?.[0] || '', reviewer: 'R1', commentId: '2', location: '第 2 段', quote: '缺少外部验证' }, missingEvidence: '需要真实外部数据和实验结果；暂缺时保留待办。', kind: 'experiment', priority: 'high', status: 'open', location: '结果', action: '作者需补实验', evidence: '' },
    ], blockers: [], ...options.result };
    const raw = options.malformed ? 'No structured output' : '```research-loom-result\n' + JSON.stringify(result) + '\n```';
    state.update({ running: false, nodes: [...current.nodes, { kind: 'assistant', seq, turn, messageId: `reply-${seq}`, blocks: [{ kind: 'text', text: raw }], ...(options.interrupted ? { interrupted: true } : {}) }], turnEnds: new Map([...current.turnEnds, [turn, seq + 1]]) });
  },
  addUnrelatedMessage: () => { const current = state.getSnapshot(); state.update({ nodes: [...current.nodes, { kind: 'user', seq: Math.max(...current.nodes.map((node) => node.seq)) + 1, content: [{ type: 'text', text: 'different task' }] }] }); },
};
void ready.then(() => createRoot(document.getElementById('root')).render(<App />));
