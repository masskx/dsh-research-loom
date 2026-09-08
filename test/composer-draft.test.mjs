import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareComposerDraft } from '../src/composer-draft.js';

test('switching scenarios and repeated preparation replace instead of accumulating', () => {
  const first = prepareComposerDraft('', 'start prompt');
  assert.equal(first.draft, 'start prompt');
  const second = prepareComposerDraft(first.draft, 'paper prompt', 'start prompt');
  assert.deepEqual(second, { kind: 'replace', draft: 'paper prompt' });
  assert.equal(prepareComposerDraft(second.draft, 'revision prompt', 'paper prompt').draft, 'revision prompt');
  assert.equal(prepareComposerDraft(second.draft, 'paper prompt', 'paper prompt').draft, 'paper prompt');
});

test('user text outside the owned block is preserved byte for byte', () => {
  assert.equal(prepareComposerDraft('My notes\n\nold prompt\nExtra constraints', 'new prompt', 'old prompt').draft,
    'My notes\n\nnew prompt\nExtra constraints');
});

test('edited, unknown and ambiguous drafts require confirmation without mutations', () => {
  for (const current of ['my own draft', 'edited prompt', 'old prompt\nold prompt']) {
    assert.deepEqual(prepareComposerDraft(current, 'new prompt', 'old prompt'), { kind: 'confirm' });
  }
  assert.deepEqual(prepareComposerDraft('old prompt', 'new prompt'), { kind: 'confirm' });
  assert.deepEqual(prepareComposerDraft('unrelated workspace text', 'new prompt', 'other workspace prompt'), { kind: 'confirm' });
  assert.deepEqual(prepareComposerDraft('  ', 'new prompt', 'old prompt'), { kind: 'fill', draft: 'new prompt' });
});
