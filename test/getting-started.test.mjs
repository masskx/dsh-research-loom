import test from 'node:test';
import assert from 'node:assert/strict';
import { ENTRY_SCENARIOS, buildEntryPrompt } from '../src/getting-started.js';
import { analyzePaperArtifacts, normalizeProjectState, updateProjectConfig, exportProjectSnapshot, importProjectSnapshot } from '../src/paper-state.js';
import { Config } from '../lib/startup.js';

test('all nine guide steps produce contextual, bounded tasks in both languages', () => {
  const report = analyzePaperArtifacts(['paper/main.tex', 'reviews/reviewer-comments.docx']);
  for (const [entryScenario, scenario] of Object.entries(ENTRY_SCENARIOS)) {
    assert.equal(scenario.steps.length, 3);
    for (let entryStep = 0; entryStep < 3; entryStep++) {
      for (const language of ['zh', 'en']) {
        const prompt = buildEntryPrompt({ entryScenario, entryStep, researchTopic: 'Example topic' }, report, { language, cwd: '/test/paper' });
        assert.ok(prompt.length > 250);
        assert.ok(prompt.includes('Example topic'));
        assert.ok(prompt.includes('main.tex'));
      }
    }
  }
  assert.equal(buildEntryPrompt({}, report), '');
  assert.match(buildEntryPrompt({ entryScenario: 'paper' }, report), /不要猜测/);
  assert.match(buildEntryPrompt({ entryScenario: 'revision', entryStep: 2 }, report), /每个“已修改\/已完成”必须有对应证据/);
  assert.match(buildEntryPrompt({ entryScenario: 'start' }, analyzePaperArtifacts([])), /不超过 3 个/);
});

test('scenario navigation persists through host schema and snapshots without confirming stages', () => {
  const original = { entryScenario: 'paper', entryStep: 2, stageStates: { topic: 'confirmed', data: 'na' }, researchMemory: 'Keep this' };
  const projects = updateProjectConfig({ '/one': original }, '/one', { entryScenario: 'revision', entryStep: 0 });
  const parsed = Config({ projects }).projects['/one'];
  assert.equal(parsed.entryScenario, 'revision');
  assert.equal(parsed.entryStep, 0);
  assert.deepEqual(parsed.stageStates, original.stageStates);
  assert.equal(parsed.researchMemory, original.researchMemory);
  assert.equal(importProjectSnapshot(exportProjectSnapshot(parsed)).entryScenario, 'revision');
  assert.equal(normalizeProjectState({ entryScenario: 'invalid', entryStep: 9 }).entryScenario, '');
  assert.equal(normalizeProjectState({ entryStep: -1 }).entryStep, 0);
  assert.equal(normalizeProjectState({ entryStep: 1.2 }).entryStep, 0);
});

test('source preparation supports explicit local, web and hybrid modes', () => {
  const report = analyzePaperArtifacts(['sources/seed.pdf']);
  for (const kickoffMode of ['local', 'web', 'hybrid']) {
    const prompt = buildEntryPrompt({ entryScenario: 'start', entryStep: 1, kickoffMode, researchTopic: 'Topic' }, report, { currentDate: '2026-09-08' });
    assert.ok(prompt.includes('Topic'));
    assert.equal(prompt.includes('seed.pdf'), kickoffMode !== 'web');
  }
});
