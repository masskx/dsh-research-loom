import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReviewLoop, completedReplies, observeLoop, parseLoopResult, loopPrompt } from '../src/review-loop.js';
import { Config } from '../lib/startup.js';
import { exportProjectSnapshot, importProjectSnapshot } from '../src/paper-state.js';
const issue = { id: 'R1', comment: 'Clarify question', kind: 'text', priority: 'high', status: 'open', location: 'Introduction', action: 'Clarify', evidence: '' };
const result = (phase, changes = {}) => ({ version: 1, phase, outcome: 'ready', summary: 'summary', manuscript: 'paper.md', revised: phase === 'plan' ? '' : 'new.md', issues: [{ ...issue }], blockers: [], ...changes });
const raw = (value) => '```research-loom-result\n' + JSON.stringify(value) + '\n```';
const base = { version: 1, id: 'loop', sessionId: 'one', requestId: 'request', baselineSeq: 3, phase: 'plan', status: 'awaiting', round: 0, history: [] };
const nodes = [
  { kind: 'assistant', seq: 2, turn: 1, messageId: 'old', blocks: [{ kind: 'text', text: 'old review' }] },
  { kind: 'user', seq: 4, content: [{ type: 'text', text: '[Research Loom review request]' }] },
  { kind: 'assistant', seq: 5, turn: 2, messageId: 'new', blocks: [{ kind: 'reasoning', text: 'private reasoning' }, { kind: 'text', text: raw(result('plan')) }] },
];
test('DSH result uses actual matching user and completed assistant turn, never reasoning', () => {
  const conversation = { nodes, turnEnds: new Map([[1, 3], [2, 6]]), running: false };
  const observed = observeLoop(base, conversation);
  assert.equal(observed.kind, 'result'); assert.equal(observed.userSeq, 4); assert.equal(observed.turn, 2);
  assert.ok(!observed.raw.includes('private reasoning'));
  assert.equal(completedReplies(conversation)[0].seq, 5);
  assert.equal(observeLoop(base, { ...conversation, running: true }).kind, 'waiting');
  assert.equal(observeLoop(base, { ...conversation, turnEnds: new Map([[1, 3]]) }).kind, 'waiting');
  assert.equal(observeLoop(base, { ...conversation, nodes: [nodes[0]] }).kind, 'waiting');
});
test('interruption, later human messages and missing durable identity block adoption', () => {
  const snapshot = { nodes, turnEnds: new Map([[2, 6]]), running: false };
  assert.equal(observeLoop(base, { ...snapshot, nodes: [...nodes, { kind: 'steering', seq: 7 }] }).kind, 'blocked');
  assert.equal(observeLoop(base, { ...snapshot, nodes: [...nodes.slice(0, 2), { ...nodes[2], interrupted: true }] }).kind, 'blocked');
  assert.equal(observeLoop(base, { ...snapshot, nodes: [...nodes.slice(0, 2), { ...nodes[2], messageId: undefined }] }).kind, 'blocked');
});
test('long host windows retain a previously observed request/turn binding without guessing', () => {
  const bound = { ...base, requestUserSeq: 4, requestTurn: 2 };
  const compacted = { nodes: [nodes[2]], turnEnds: new Map([[2, 6]]), running: false };
  assert.equal(observeLoop(bound, compacted).kind, 'result');
  assert.equal(observeLoop(base, compacted).kind, 'waiting');
  assert.equal(observeLoop(bound, { ...compacted, nodes: [{ ...nodes[2], turn: 3 }] }).kind, 'blocked');
  const observed = observeLoop(base, { nodes, running: true });
  assert.equal(observed.requestUserSeq, 4); assert.equal(observed.requestTurn, 2);
});
test('schema is strict about evidence, phase, missing IDs and revised version', () => {
  assert.equal(parseLoopResult(raw(result('plan')), base).issues[0].id, 'R1');
  assert.throws(() => parseLoopResult('plain text', base));
  assert.throws(() => parseLoopResult(raw(result('plan')) + raw(result('plan')), base));
  assert.throws(() => parseLoopResult(raw(result('verify')), base));
  assert.throws(() => parseLoopResult(raw(result('plan', { issues: [{ ...issue, status: 'resolved' }] })), base));
  assert.throws(() => parseLoopResult(raw(result('plan', { issues: [issue, issue] })), base));
  assert.throws(() => parseLoopResult(raw(result('plan', { blockers: ['missing paper'] })), base));
  const revise = { ...base, phase: 'revise', history: [{ result: result('plan') }] };
  assert.throws(() => parseLoopResult(raw(result('revise', { issues: [] })), revise));
  assert.throws(() => parseLoopResult(raw(result('revise', { revised: 'paper.md' })), revise));
  assert.throws(() => parseLoopResult(raw(result('revise', { issues: [{ ...issue, kind: 'experiment' }] })), revise));
  const verify = { ...base, phase: 'verify', history: [{ result: result('revise') }] };
  assert.throws(() => parseLoopResult(raw(result('verify', { revised: 'wrong.md' })), verify));
  assert.throws(() => parseLoopResult(raw(result('revise')), { ...revise, history: [{ result: result('verify') }] }));
  const experiment = { ...issue, kind: 'experiment' };
  assert.throws(() => parseLoopResult(raw(result('revise', { issues: [{ ...experiment, status: 'resolved', evidence: 'claimed' }] })), { ...revise, history: [{ result: result('plan', { issues: [experiment] }) }] }));
});
test('loop persists through host schema while project export strips live execution', () => {
  const serialized = JSON.stringify({ ...base, round: 9 });
  const project = Config({ projects: { one: { reviewLoop: serialized } } }).projects.one;
  assert.equal(normalizeReviewLoop(project.reviewLoop).round, 2);
  assert.equal(normalizeReviewLoop('broken'), null);
  assert.equal(exportProjectSnapshot(project).project.reviewLoop, '');
  assert.equal(importProjectSnapshot({ format: 'research-loom-project', version: 1, project }).reviewLoop, '');
});
test('revision and verification prompts carry previous issues, scope and bounded authority', () => {
  const prompt = loopPrompt({ ...base, phase: 'revise', round: 1, scope: 'Only introduction', history: [{ result: result('plan') }] });
  for (const expected of ['Only introduction', 'R1', '保留原稿', '最多 2 轮', '[Research Loom review request]', 'kind=text']) assert.ok(prompt.includes(expected));
  assert.ok(loopPrompt({ ...base, phase: 'verify' }).includes('只读复核，不改稿'));
});
