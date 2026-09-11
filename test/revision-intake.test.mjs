import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { normalizeRevisionIntake, inspectRevisionIntake, revisionIntakeCandidates, buildRevisionIntakeContext } from '../src/revision-intake.js';
import { normalizeProjectState, analyzePaperArtifacts, updateProjectConfig, exportProjectSnapshot, importProjectSnapshot } from '../src/paper-state.js';
import { buildEntryPrompt } from '../src/getting-started.js';
import { GettingStartedPanel } from '../src/getting-started-panel.js';
import { Config } from '../lib/startup.js';

const selected = { manuscript: 'paper/main.tex', reviewFiles: ['reviews/review1.txt'], round: '', relationship: 'unknown', confirmed: true };

test('revision intake stores an explicit author baseline without converting unknowns into verified facts', () => {
  const state = normalizeProjectState({ revisionIntake: { ...selected, manuscript: '.\\paper\\main.tex', reviewFiles: ['reviews/review1.txt', 'reviews/review1.txt'] } });
  assert.deepEqual(state.revisionIntake, selected);
  assert.deepEqual(importProjectSnapshot(exportProjectSnapshot(state)).revisionIntake, selected);
  assert.deepEqual(Config({ projects: { '/paper': state } }).projects['/paper'].revisionIntake, selected);
  assert.equal(normalizeRevisionIntake({ ...selected, manuscript: '../other/main.tex' }).confirmed, false);
  assert.equal(normalizeRevisionIntake({ ...selected, reviewFiles: ['D:\\private\\reviews.txt'] }).confirmed, false);
  assert.equal(normalizeRevisionIntake({ ...selected, reviewFiles: ['paper/MAIN.tex'] }).confirmed, false);
  assert.equal(normalizeRevisionIntake({ ...selected, reviewFiles: ['reviews/review1.txt', '../other.txt'] }).confirmed, false);
  assert.equal(normalizeProjectState({ revisionIntake: selected, excludedFolders: 'malformed' }).revisionIntake.confirmed, true);
});

test('editing sources or scope invalidates confirmation while a separate confirmation persists', () => {
  let projects = { '/one': { revisionIntake: selected }, '/two': { researchTopic: 'Unrelated' } };
  const changed = { ...selected, manuscript: 'paper/new.tex', confirmed: true };
  projects = updateProjectConfig(projects, '/one', { revisionIntake: changed });
  assert.equal(projects['/one'].revisionIntake.confirmed, false, 'cannot change sources and silently retain confirmation');
  projects = updateProjectConfig(projects, '/one', { revisionIntake: changed });
  assert.equal(projects['/one'].revisionIntake.confirmed, true, 'explicit confirmation after sources are saved');
  projects = updateProjectConfig(projects, '/one', { excludedFolders: ['reviews'] });
  assert.equal(projects['/one'].revisionIntake.confirmed, false);
  projects = updateProjectConfig(projects, '/one', { excludedFolders: [] });
  assert.equal(projects['/one'].revisionIntake.confirmed, false, 'restoring scope must not silently re-confirm the baseline');
  assert.deepEqual(projects['/two'], { researchTopic: 'Unrelated' });
  assert.equal(normalizeProjectState({ revisionIntake: selected, assignments: { 'paper/main.tex': 'ignore' } }).revisionIntake.confirmed, false);
});

test('review source navigation obeys exclusions and manual paths remain explicitly unverified', () => {
  const paths = ['paper/main.tex', 'paper/old.tex', 'reviews/review1.txt', 'reviews/old/reviewer-comments.txt', 'reviewer-ignore.txt', 'node_modules/reviewer.txt'];
  const report = analyzePaperArtifacts(paths);
  const project = { excludedFolders: ['reviews/old'], assignments: { 'reviewer-ignore.txt': 'ignore' } };
  const candidates = revisionIntakeCandidates(project, report);
  assert.ok(candidates.manuscripts.includes('paper/main.tex'));
  assert.deepEqual(candidates.reviews, ['reviews/review1.txt']);
  const intake = { ...selected, manuscript: 'unscanned/current.tex', relationship: 'historical' };
  const inspection = inspectRevisionIntake(intake, project, report);
  assert.equal(inspection.confirmed, true);
  assert.deepEqual(inspection.unscanned, ['unscanned/current.tex']);
  for (const language of ['zh', 'en']) {
    const prompt = buildEntryPrompt({ ...project, entryScenario: 'revision', revisionIntake: intake }, report, { language });
    assert.ok(prompt.includes('unscanned/current.tex'));
    assert.ok(!prompt.includes('reviews/old/reviewer-comments.txt'));
    assert.ok(!prompt.includes('reviewer-ignore.txt'));
    assert.match(prompt, language === 'zh' ? /历史意见；不得当作/ : /Historical reviews; do not present/);
    assert.match(prompt, language === 'zh' ? /先核验是否存在且可读/ : /verify existence and readability/);
    assert.match(prompt, language === 'zh' ? /不代表已读全文/ : /does not mean full text has been read/);
  }
  const blocked = buildRevisionIntakeContext(selected, { project: { excludedFolders: ['reviews'] }, report });
  assert.ok(!blocked.includes('reviews/review1.txt'));
  assert.match(blocked, /不得读取或默默换成其他版本/);
});

async function fixture(t, initial = {}, overrides = {}) {
  const report = analyzePaperArtifacts(['paper/main.tex', 'paper/old.tex', 'reviews/review1.txt']);
  let saved = { '/one': { entryScenario: 'revision', ...initial } }, cwd = '/one', renderer, failSave = false;
  const starts = [], prompts = [];
  const props = () => ({
    project: normalizeProjectState(saved[cwd]), report, language: 'zh', cwd, writable: true, disabled: false,
    saveConfig: async patch => {
      if (failSave) return false;
      saved = updateProjectConfig(saved, cwd, patch);
      renderer.update(React.createElement(GettingStartedPanel, props()));
      return true;
    },
    submitPrompt: async prompt => { prompts.push(prompt); return true; },
    onStartReview: async intake => { starts.push(intake); return true; },
    ...overrides,
  });
  await act(async () => { renderer = create(React.createElement(GettingStartedPanel, props())); });
  t.after(async () => { await act(async () => renderer.unmount()); });
  return {
    renderer, starts, prompts,
    get intake() { return saved[cwd]?.revisionIntake; },
    text() { return JSON.stringify(renderer.toJSON()); },
    failSaving(value) { failSave = value; },
    field(label) { return renderer.root.findByProps({ 'aria-label': label }); },
    button(label) { return renderer.root.findAllByType('button').find(button => button.children.join('') === label
      || button.findAllByType('strong').some(strong => strong.children.join('') === label)); },
    async edit(label, value) { await act(async () => this.field(label).props.onChange({ target: { value } })); },
    async click(label) { const button = this.button(label); assert.ok(button, label); assert.equal(!!button.props.disabled, false, label); await act(async () => button.props.onClick()); },
    async switchWorkspace(next) { cwd = next; await act(async () => renderer.update(React.createElement(GettingStartedPanel, props()))); },
  };
}

test('a novice selects sources, explicitly confirms unknown mapping, and starts original-review ingestion directly', async t => {
  const app = await fixture(t);
  assert.equal(app.field('本轮主稿路径').props.value, '', 'multiple candidates never choose an authoritative manuscript');
  assert.equal(app.button('确认本轮材料').props.disabled, true);
  await app.edit('主稿候选', 'paper/main.tex');
  await app.edit('原始意见候选', 'reviews/review1.txt');
  assert.equal(app.intake.confirmed, false);
  assert.equal(app.intake.relationship, 'unknown');
  await app.click('确认本轮材料');
  assert.equal(app.intake.confirmed, true);
  await app.click('读取原始意见并建立返修清单');
  assert.deepEqual(app.starts, [selected]);
  assert.equal(app.prompts.length, 0, 'direct ingestion does not require a diagnosis reply first');
  await app.edit('审稿轮次', '第二轮');
  assert.equal(app.intake.confirmed, false);
  assert.equal(app.button('读取原始意见并建立返修清单'), undefined);
  await app.click('确认本轮材料');
  assert.equal(app.intake.confirmed, true);
});

test('failed source saves do not unlock ingestion and workspace changes discard old local form state', async t => {
  const app = await fixture(t, { revisionIntake: selected });
  await app.edit('本轮主稿路径', 'paper/old.tex');
  app.failSaving(true);
  await app.click('确认本轮材料');
  assert.equal(app.button('读取原始意见并建立返修清单'), undefined);
  assert.match(app.text(), /保存失败/);
  app.failSaving(false);
  await app.click('确认本轮材料');
  assert.equal(app.intake.confirmed, true);
  await app.switchWorkspace('/two');
  await app.click('论文返修');
  assert.equal(app.field('本轮主稿路径').props.value, '');
  assert.equal(app.field('原始意见路径').props.value, '');
  assert.equal(app.button('读取原始意见并建立返修清单'), undefined);
  assert.equal(app.starts.length, 0);
});

test('hosts without direct ingestion retain the editable prompt path with the confirmed baseline', async t => {
  const app = await fixture(t, { revisionIntake: selected }, { onStartReview: undefined });
  await app.click('准备原始意见任务到对话框');
  assert.equal(app.prompts.length, 1);
  assert.match(app.prompts[0], /作者已确认选择/);
  assert.match(app.prompts[0], /reviews\/review1.txt/);
  assert.equal(app.starts.length, 0);
  assert.match(app.text(), /已放入对话框/);
});
