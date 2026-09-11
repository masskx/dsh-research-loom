import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ReviewLoopPanel } from '../src/review-loop-panel.js';

const issue = { id: 'R1', comment: 'Clarify question', kind: 'text', priority: 'high', status: 'open', location: 'Introduction', action: 'Clarify', evidence: '' };
const result = (phase, changes = {}) => ({ version: 1, phase, outcome: 'ready', summary: 'summary', manuscript: './paper.md', revised: phase === 'plan' ? '' : './new.md', issues: [{ ...issue }], blockers: [], ...changes });
const raw = (value) => '```research-loom-result\n' + JSON.stringify(value) + '\n```';
const base = { version: 1, id: 'loop', sessionId: 'one', requestId: 'request', baselineSeq: 3, phase: 'plan', status: 'awaiting', round: 0, manuscript: 'paper.md', history: [] };
const user = { kind: 'user', seq: 4, content: [{ type: 'text', text: '[Research Loom review request]' }] };
const assistant = (phase = 'plan') => ({ kind: 'assistant', seq: 5, turn: 2, messageId: 'final', blocks: [{ kind: 'text', text: raw(result(phase)) }] });
const waiting = { nodes: [user], running: true, turnEnds: new Map(), lastAgentError: null };
const completed = { nodes: [user, assistant()], running: false, turnEnds: new Map([[2, 6]]), lastAgentError: null };
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };

async function mount({ loop = base, conversation = waiting, save, validateFiles, onSubmit } = {}) {
  let renderer;
  let draft = '';
  let saves = 0;
  const submitted = [];
  const fixture = {
    props: {
      project: { tasks: [], reviewLoop: JSON.stringify(loop) }, conversation,
      input: { draft: '', phase: 'plain' }, cwd: '/workspace', sessionId: 'one', writable: true, enabled: true,
      validateFiles: validateFiles ?? (async (request) => ({ manuscript: request.manuscript.replace(/^\.\//, ''), revised: request.revised.replace(/^\.\//, '') })),
      saveConfig: async (patch) => {
        saves++;
        if (save && await save(saves) === false) return false;
        const changes = patch(fixture.props.project);
        fixture.update({ project: { ...fixture.props.project, ...changes } });
        return true;
      },
      inputActions: {
        setDraft: (value) => { draft = value; },
        submit: () => { submitted.push(draft); onSubmit?.(draft, fixture); draft = ''; },
      },
    },
    update(changes) { this.props = { ...this.props, ...changes }; renderer?.update(React.createElement(ReviewLoopPanel, this.props)); },
    get loop() { return JSON.parse(this.props.project.reviewLoop); },
    get saves() { return saves; },
    get root() { return renderer.root; },
    submitted,
    unmount() { renderer.unmount(); },
  };
  await act(async () => { renderer = TestRenderer.create(React.createElement(ReviewLoopPanel, fixture.props)); });
  return fixture;
}

test('a completed reply arriving during a delayed binding save is adopted without another host event', async () => {
  const gate = deferred();
  const fixture = await mount({ save: (count) => count === 1 ? gate.promise : true });
  assert.equal(fixture.saves, 1);
  await act(async () => { fixture.update({ conversation: completed }); });
  assert.equal(fixture.loop.status, 'awaiting');
  await act(async () => { gate.resolve(true); });
  assert.equal(fixture.loop.status, 'ready');
  assert.equal(fixture.loop.history.length, 1);
  assert.equal(fixture.loop.manuscript, 'paper.md');
  assert.equal(fixture.loop.history[0].result.manuscript, 'paper.md');
  assert.equal(fixture.saves, 2);
  await act(async () => fixture.unmount());
});

test('a failed save does not create a retry loop against an unchanged snapshot', async () => {
  const fixture = await mount({ save: () => false });
  await act(async () => {});
  assert.equal(fixture.saves, 1);
  assert.equal(fixture.loop.status, 'awaiting');
  assert.ok(fixture.root.findAllByProps({ role: 'alert' }).length);
  await act(async () => fixture.unmount());
});

test('switching workspace during host file validation discards the stale result', async () => {
  const gate = deferred();
  const fixture = await mount({ conversation: completed, validateFiles: () => gate.promise });
  await act(async () => { fixture.update({ cwd: '/other', sessionId: 'two', project: { tasks: [], reviewLoop: '' }, conversation: { nodes: [], running: false } }); });
  await act(async () => { gate.resolve({ manuscript: 'paper.md', revised: '' }); });
  assert.equal(fixture.props.project.reviewLoop, '');
  assert.equal(fixture.saves, 0);
  assert.equal(fixture.submitted.length, 0);
  await act(async () => fixture.unmount());
});

test('a later human message during validation prevents adopting the older result', async () => {
  const gate = deferred();
  const fixture = await mount({ conversation: completed, validateFiles: () => gate.promise });
  await act(async () => { fixture.update({ conversation: { ...completed, nodes: [...completed.nodes, { kind: 'user', seq: 7, content: [{ type: 'text', text: 'Stop this task' }] }] } }); });
  await act(async () => { gate.resolve({ manuscript: 'paper.md', revised: '' }); });
  assert.equal(fixture.loop.status, 'blocked');
  assert.equal(fixture.loop.history.length, 0);
  assert.equal(fixture.submitted.length, 0);
  await act(async () => fixture.unmount());
});

test('ready results fail closed when file validation rejects the specified manuscript', async () => {
  const fixture = await mount({ conversation: completed, validateFiles: async (request) => {
    assert.equal(request.expectedManuscript, 'paper.md');
    throw new Error('Original manuscript mismatch');
  } });
  assert.equal(fixture.loop.status, 'blocked');
  assert.equal(fixture.loop.history.length, 0);
  assert.match(fixture.loop.message, /mismatch/);
  assert.equal(fixture.submitted.length, 0);
  await act(async () => fixture.unmount());
});

const planned = { ...base, status: 'ready', manuscript: 'paper.md', history: [{ phase: 'plan', requestId: 'request', userSeq: 4, assistantSeq: 5, turn: 2, raw: raw(result('plan')), result: result('plan', { manuscript: 'paper.md' }) }] };
async function authorize(fixture) {
  await act(async () => { fixture.root.findByProps({ 'aria-label': '本轮授权范围' }).props.onChange({ target: { value: 'Only clarify R1' } }); });
  await act(async () => { fixture.root.findAllByType('button').find((node) => node.props.children === '授权本轮修改并执行').props.onClick(); });
}

test('one explicit authorization processes immediate replies and launches only one automatic verification', async () => {
  const fixture = await mount({ loop: planned, conversation: completed, onSubmit: (prompt, fixture) => {
    const requestId = prompt.match(/\[Research Loom review ([^\]]+)\]/)[1];
    const phase = fixture.loop.phase;
    const seq = 10 + fixture.submitted.length * 10;
    const turn = fixture.submitted.length + 2;
    fixture.update({ conversation: { running: false, nodes: [
      { kind: 'user', seq, content: [{ type: 'text', text: `[Research Loom review ${requestId}]` }] },
      { kind: 'assistant', seq: seq + 1, turn, messageId: `final-${turn}`, blocks: [{ kind: 'text', text: raw(result(phase)) }] },
    ], turnEnds: new Map([[turn, seq + 2]]) } });
  } });
  await authorize(fixture);
  assert.equal(fixture.submitted.length, 2);
  assert.equal(fixture.loop.phase, 'verify');
  assert.equal(fixture.loop.status, 'done');
  assert.equal(fixture.loop.round, 1);
  assert.deepEqual(fixture.loop.history.map((entry) => entry.phase), ['plan', 'revise', 'verify']);
  assert.ok(fixture.submitted[0].includes('Only clarify R1'));
  await act(async () => fixture.unmount());
});

test('pausing while a revision result is being validated revokes automatic verification', async () => {
  const gate = deferred();
  const fixture = await mount({ loop: planned, conversation: completed,
    validateFiles: (request) => request.phase === 'revise' ? gate.promise : Promise.resolve({ manuscript: 'paper.md', revised: request.revised }),
    onSubmit: (prompt, fixture) => {
      const requestId = prompt.match(/\[Research Loom review ([^\]]+)\]/)[1];
      fixture.update({ conversation: { running: false, nodes: [
        { kind: 'user', seq: 10, content: [{ type: 'text', text: `[Research Loom review ${requestId}]` }] },
        { ...assistant('revise'), seq: 11, turn: 3 },
      ], turnEnds: new Map([[3, 12]]) } });
    },
  });
  await authorize(fixture);
  assert.equal(fixture.submitted.length, 1);
  await act(async () => { fixture.root.findAllByType('button').find((node) => node.props.children === '暂停后续自动执行').props.onClick(); });
  await act(async () => { gate.resolve({ manuscript: 'paper.md', revised: 'new.md' }); });
  assert.equal(fixture.loop.status, 'paused');
  assert.equal(fixture.loop.phase, 'revise');
  assert.equal(fixture.submitted.length, 1);
  await act(async () => fixture.unmount());
});
