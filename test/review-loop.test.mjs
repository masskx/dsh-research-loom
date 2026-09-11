import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReviewLoop, completedReplies, observeLoop, parseLoopResult, loopPrompt, loopErrorIdentity, validateLoopFiles, validateLoopLaunch } from '../src/review-loop.js';
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
test('schema is strict about evidence, phase, missing IDs and required output paths', () => {
  assert.equal(parseLoopResult(raw(result('plan')), base).issues[0].id, 'R1');
  assert.throws(() => parseLoopResult('plain text', base));
  assert.throws(() => parseLoopResult(raw(result('plan')) + raw(result('plan')), base));
  assert.throws(() => parseLoopResult(raw(result('verify')), base));
  assert.throws(() => parseLoopResult(raw(result('plan', { issues: [{ ...issue, status: 'resolved' }] })), base));
  assert.throws(() => parseLoopResult(raw(result('plan', { issues: [issue, issue] })), base));
  assert.throws(() => parseLoopResult(raw(result('plan', { blockers: ['missing paper'] })), base));
  const revise = { ...base, phase: 'revise', history: [{ result: result('plan') }] };
  assert.throws(() => parseLoopResult(raw(result('revise', { issues: [] })), revise));
  assert.throws(() => parseLoopResult(raw(result('revise', { revised: '' })), revise));
  assert.throws(() => parseLoopResult(raw(result('revise', { issues: [{ ...issue, kind: 'experiment' }] })), revise));
  const experiment = { ...issue, kind: 'experiment' };
  assert.throws(() => parseLoopResult(raw(result('revise', { issues: [{ ...experiment, status: 'resolved', evidence: 'claimed' }] })), { ...revise, history: [{ result: result('plan', { issues: [experiment] }) }] }));
});

test('execution failure before the first assistant is terminal, but an old error is not', () => {
  const snapshot = { nodes: nodes.slice(0, 2), running: false, lastAgentError: 'model unavailable' };
  assert.equal(observeLoop(base, snapshot).kind, 'blocked');
  const withOldError = { ...base, baselineAgentError: 'model unavailable' };
  assert.equal(observeLoop(withOldError, snapshot).kind, 'waiting');
  const cleared = observeLoop(withOldError, { ...snapshot, running: true, lastAgentError: null });
  assert.equal(cleared.agentErrorCleared, true);
  assert.equal(observeLoop({ ...withOldError, agentErrorCleared: cleared.agentErrorCleared }, snapshot).kind, 'blocked');
  assert.equal(observeLoop(withOldError, { ...snapshot, nodes, turnEnds: new Map([[2, 6]]) }).kind, 'result');
  const promptError = { op: 'send', message: 'network' };
  assert.equal(observeLoop({ ...base, baselinePromptError: loopErrorIdentity(promptError) }, { nodes: [], promptError }).kind, 'waiting');
  assert.equal(observeLoop(base, { nodes: [], promptError }).kind, 'blocked');
});

test('ready reports require host validation with the user baseline and canonical paths', async () => {
  const specified = { ...base, manuscript: 'paper/main.md' };
  const parsed = parseLoopResult(raw(result('plan', { manuscript: './paper/main.md' })), specified);
  const checked = await validateLoopFiles(parsed, specified, async (request) => {
    assert.deepEqual(request, { phase: 'plan', manuscript: './paper/main.md', expectedManuscript: 'paper/main.md', revised: '', previousRevised: '' });
    return { manuscript: 'paper/main.md', revised: '' };
  });
  assert.equal(checked.manuscript, 'paper/main.md');
  await assert.rejects(validateLoopFiles(parsed, specified), /宿主/);
  await assert.rejects(validateLoopFiles(parsed, specified, async () => null), /核验结果/);
  await assert.rejects(validateLoopFiles(result('plan', { manuscript: 'other.md' }), specified, async () => { throw new Error('Original manuscript does not match'); }), /does not match/);
  const verify = { ...specified, phase: 'verify', history: [{ result: result('revise', { manuscript: 'paper/main.md', revised: 'new.md' }) }] };
  await validateLoopFiles(parseLoopResult(raw(result('verify', { manuscript: './paper/main.md', revised: './new.md' })), verify), verify, async (request) => {
    assert.equal(request.previousRevised, 'new.md');
    assert.equal(request.expectedManuscript, 'paper/main.md');
    return { manuscript: 'paper/main.md', revised: 'new.md' };
  });
});

test('blocked reports remain readable without a missing manuscript or full issue list', async () => {
  const revise = { ...base, phase: 'revise', history: [{ result: result('plan') }] };
  const parsed = parseLoopResult(raw(result('revise', { outcome: 'blocked', manuscript: '', revised: '', issues: [], blockers: ['Cannot read original'] })), revise);
  assert.equal((await validateLoopFiles(parsed, revise)).outcome, 'blocked');
  await assert.rejects(validateLoopLaunch({ ...revise, history: [{ result: parsed }] }, 'verify'), /尚未就绪/);
});

test('every revision and verification launch rechecks previously accepted files', async () => {
  const plan = { ...base, manuscript: '', status: 'ready', history: [{ result: result('plan') }] };
  const launched = await validateLoopLaunch(plan, 'revise', async (request) => {
    assert.deepEqual(request, { phase: 'plan', manuscript: 'paper.md', expectedManuscript: 'paper.md', revised: '', previousRevised: '' });
    return { manuscript: 'paper.md', revised: '' };
  });
  assert.equal(launched.manuscript, 'paper.md');
  const revised = { ...launched, phase: 'revise', history: [{ result: result('revise') }] };
  for (const phase of ['verify', 'revise']) {
    await assert.rejects(validateLoopLaunch(revised, phase, async (request) => {
      assert.equal(request.phase, 'verify');
      assert.equal(request.revised, 'new.md');
      assert.equal(request.previousRevised, 'new.md');
      throw new Error('Revision file was removed');
    }), /removed/);
  }
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
