import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PAPER_STAGES,
  analyzePaperArtifacts,
  buildEvaluationPrompt,
  buildModulePrompt,
  buildResearchKickoffPrompt,
  currentStageForWorkflow,
  isResearchKickoffRecommended,
  normalizeProjectState,
  normalizeWorkspaceKey,
  recommendWorkflow,
  resolveWorkflow,
  scorePaperMaterials,
  suggestModulePrompt,
  updateProjectConfig,
  updateProjectStage,
  workspaceName,
  nextResearchStage, collectTaskOutputs, taskExecutionStatus, projectHandoff,
  exportProjectSnapshot, importProjectSnapshot,
} from '../src/paper-state.js';

test('scan scope aliases normalize to the same paths returned by the host', () => {
  const project = normalizeProjectState({ scanRoot: './papers//./chapter/', excludedFolders: ['papers/./chapter//ignored'] });
  assert.equal(project.scanRoot, 'papers/chapter');
  assert.deepEqual(project.excludedFolders, ['papers/chapter/ignored']);
  const report = analyzePaperArtifacts(['papers/chapter/main.md', 'papers/chapter/ignored/old.md'], '', project);
  assert.deepEqual(report.sourceFiles, ['papers/chapter/main.md']);
});

test('paper stages keep academic order while workflows remain configurable', () => {
  assert.deepEqual(PAPER_STAGES.map((stage) => stage.id), [
    'topic', 'literature', 'design', 'data', 'analysis', 'draft', 'revision', 'submission', 'review', 'archive',
  ]);
  const report = analyzePaperArtifacts([
    'paper/main.tex',
    'references/library.bib',
    'reviews/reviewer-comments.docx',
  ]);
  assert.deepEqual(recommendWorkflow(report), ['topic', 'literature', 'design', 'draft', 'submission', 'review', 'archive']);
  assert.deepEqual(resolveWorkflow({ workflowMode: 'theoretical' }, report), ['topic', 'literature', 'design', 'draft', 'submission', 'review', 'archive']);
  assert.deepEqual(resolveWorkflow({ workflowMode: 'custom', workflow: ['review', 'topic', 'data'] }, report), ['topic', 'data', 'review']);
});

test('workspace settings persist independently and normalize new configuration', () => {
  assert.equal(normalizeWorkspaceKey('D:\\papers\\my-study\\'), 'D:/papers/my-study');
  assert.equal(workspaceName('/srv/papers/my-study/'), 'my-study');
  const first = updateProjectStage({}, 'D:\\papers\\one', 'draft', '2026-09-08T00:00:00.000Z');
  const configured = updateProjectConfig(first, 'D:\\papers\\one', { workflowMode: 'custom', workflow: ['draft', 'topic'], standard: 'sci' });
  const second = updateProjectStage(configured, 'D:\\papers\\two', 'submission', '2026-09-08T01:00:00.000Z');
  assert.equal(second['D:/papers/one'].stage, 'draft');
  assert.deepEqual(normalizeProjectState(second['D:/papers/one']).workflow, ['topic', 'draft']);
  assert.equal(normalizeProjectState(second['D:/papers/one']).standard, 'sci');
  assert.equal(second['D:/papers/two'].stage, 'submission');
});

test('invalid persisted values use safe defaults', () => {
  assert.deepEqual(normalizeProjectState({ stage: 'unknown', workflowMode: 'x', standard: 'predatory', workflow: ['bad'] }), {
    entryScenario: '', entryStep: 0,
    stage: 'topic', updatedAt: '', source: 'manual', lastScannedAt: '', workflowMode: 'auto', workflow: [], standard: 'general',
    kickoffMode: 'auto', researchTopic: '', researchBrief: '', searchWindow: 'recent5',
    researchMemory: '', reviewLoop: '', venue: '', venueGuidelines: '', scanRoot: '', excludedFolders: [], assignments: {}, stageStates: {}, tasks: [],
  });
  assert.throws(() => updateProjectStage({}, '/paper', 'unknown', ''), /Unknown paper stage/);
});

test('scan scopes, exclusions and manual corrections avoid unrelated reviewer files', () => {
  const files = ['node_modules/lib/reviewer.md', 'plugins/code-reviewer.yml', 'notes/reading.pdf', 'study/source.pdf', 'study/old/reviewer-comments.docx'];
  const automatic = analyzePaperArtifacts(files);
  assert.equal(automatic.excludedCount, 2);
  const config = { scanRoot: 'study', excludedFolders: ['study/old'], assignments: { 'study/source.pdf': 'literature:references' } };
  const scoped = analyzePaperArtifacts(files, '', config);
  assert.equal(scoped.candidateCount, 1);
  assert.equal(scoped.modules.review.status, 'missing');
  assert.equal(scoped.modules.literature.materialChecks[0].status, 'found');
  assert.equal(analyzePaperArtifacts(files, '', { assignments: { 'study/source.pdf': 'ignore' } }).sourceFiles.includes('study/source.pdf'), false);
  assert.equal(analyzePaperArtifacts(['study/source.pdf'], '', { scanRoot: 'study2' }).candidateCount, 0);
  assert.equal(analyzePaperArtifacts(['论文项目交接/data/code/train.py']).modules.draft.status, 'missing');
  assert.equal(analyzePaperArtifacts(['论文项目交接/code/notes.md']).modules.draft.status, 'missing');
});

test('confirmation survives scans and missing empirical materials stay in workflow', () => {
  const report = analyzePaperArtifacts(['paper/main.tex', 'reviews/reviewer-comments.docx']);
  const project = { workflowMode: 'empirical', stageStates: { topic: 'confirmed', literature: 'working', revision: 'na' } };
  const workflow = resolveWorkflow(project, report);
  assert(workflow.includes('data'));
  assert(!workflow.includes('revision'));
  assert.equal(nextResearchStage(report, workflow, project), 'literature');
  assert.equal(nextResearchStage(analyzePaperArtifacts([]), workflow, project), 'literature');
  assert(resolveWorkflow({ stageStates: Object.fromEntries(PAPER_STAGES.map((s) => [s.id, 'na'])) }, report).length > 0);
});

test('task execution is observed and new files never imply academic confirmation', () => {
  const task = { status: 'awaiting', endSeq: 10, baseline: ['paper/main.tex'], outputs: [] };
  assert.equal(taskExecutionStatus(task, { running: false, endSeq: 10 }), 'awaiting');
  assert.equal(taskExecutionStatus(task, { running: true }), 'running');
  assert.equal(taskExecutionStatus(task, { running: false, endSeq: 12 }), 'checking');
  assert.equal(taskExecutionStatus(task, { promptFailed: true }), 'failed');
  assert.equal(taskExecutionStatus({ ...task, status: 'running' }, { running: false, lastAgentError: 'network' }), 'failed');
  assert.equal(taskExecutionStatus({ ...task, status: 'review' }, { running: true }), 'review');
  assert.deepEqual(collectTaskOutputs(task, analyzePaperArtifacts(['paper/main.tex', 'research-plan.md'])), ['research-plan.md']);
});

test('portable memory strips session tasks and feeds later prompts', () => {
  const project = { researchTopic: '少样本分类', researchMemory: '选定跨医院外部验证', venue: 'Example Conference', stageStates: { topic: 'confirmed' }, assignments: { 'sources/a.pdf': 'literature:references' }, tasks: [{ id: 'task', sessionId: 'old', stageId: 'topic', status: 'review' }] };
  const imported = importProjectSnapshot(JSON.parse(JSON.stringify(exportProjectSnapshot(project))));
  assert.equal(imported.researchMemory, project.researchMemory);
  assert.equal(imported.assignments['sources/a.pdf'], 'literature:references');
  assert.deepEqual(imported.tasks, []);
  assert.match(projectHandoff(imported), /选定跨医院外部验证/);
  assert.match(projectHandoff(imported), /Example Conference/);
  assert.throws(() => importProjectSnapshot({ format: 'other', version: 1, project: {} }));
  assert.match(buildResearchKickoffPrompt('hybrid', { topic: 'few shot' }), /缺口补充联网检索/);
});

test('artifact scan exposes complete, partial, and missing material checks', () => {
  const report = analyzePaperArtifacts([
    { kind: 'file', path: 'paper/main.tex' },
    { kind: 'file', path: 'paper/main.pdf' },
    { kind: 'file', path: 'paper/abstract.md' },
    { kind: 'file', path: 'references/library.bib' },
    { kind: 'file', path: 'results/tables/metrics.csv' },
    { kind: 'file', path: 'reviews/reviewer-comments.docx' },
    { kind: 'directory', path: 'accepted' },
  ], '2026-09-08T03:00:00.000Z');
  assert.equal(report.modules.draft.status, 'complete');
  assert.equal(report.modules.literature.status, 'partial');
  assert.equal(report.modules.archive.status, 'missing');
  assert.equal(report.modules.review.materialChecks.find((item) => item.id === 'comments').status, 'found');
  assert.equal(report.modules.review.materialChecks.find((item) => item.id === 'decision').status, 'missing');
  assert.equal(currentStageForWorkflow(report, recommendWorkflow(report)), 'review');
  assert.ok(report.sourceFiles.includes('paper/main.pdf'));
});

test('material scoring re-normalizes weights around the active workflow', () => {
  const report = analyzePaperArtifacts(['paper/main.tex', 'paper/main.pdf', 'paper/abstract.md']);
  const theoretical = ['topic', 'literature', 'design', 'draft', 'submission'];
  const sci = scorePaperMaterials(report, theoretical, 'sci');
  const ei = scorePaperMaterials(report, theoretical, 'ei');
  assert.ok(sci.score > 0 && sci.score < 100);
  assert.notEqual(sci.score, ei.score);
  assert.equal(sci.found, 3);
  assert.equal(sci.total, 15);
});

test('dynamic prompts react to gaps and preserve academic guardrails', () => {
  const report = analyzePaperArtifacts([{ kind: 'file', path: 'methods/protocol draft.md' }]);
  const module = report.modules.design;
  const suggestion = suggestModulePrompt('design', module, 'sci', 'zh');
  assert.match(suggestion, /样本、变量或测量说明/);
  assert.match(suggestion, /SCI 期刊/);
  const prompt = buildModulePrompt('design', {
    language: 'zh', cwd: 'D:\\papers\\trial', moduleReport: module, standardId: 'sci', userPrompt: '重点检查样本量。',
  });
  assert.match(prompt, /@"methods\/protocol draft\.md"/);
  assert.match(prompt, /重点检查样本量/);
  assert.match(prompt, /不得编造引文/);
});

test('deep assessment prompt distinguishes inventory from quality scoring', () => {
  const report = analyzePaperArtifacts(['paper/main.tex', 'references/library.bib']);
  const prompt = buildEvaluationPrompt(report, recommendWorkflow(report), 'ei', 'zh', 'D:\\papers\\trial');
  assert.match(prompt, /EI 会议/);
  assert.match(prompt, /路径级材料清单，不是质量分/);
  assert.match(prompt, /透明/);
  assert.match(prompt, /不得.*编造/);
});

test('research kickoff supports supplied literature and blank online discovery', () => {
  assert.equal(isResearchKickoffRecommended(analyzePaperArtifacts([])), true);
  assert.equal(isResearchKickoffRecommended(analyzePaperArtifacts(['methods/protocol.md'])), false);
  const local = buildResearchKickoffPrompt('local', {
    language: 'zh', cwd: 'D:\\papers\\new-topic', standardId: 'sci',
    topic: '医学影像小样本学习', sourceFiles: ['papers/source one.pdf', 'papers/source-two.pdf'],
  });
  assert.match(local, /SCI 期刊/);
  assert.match(local, /@"papers\/source one\.pdf"/);
  assert.match(local, /文献矩阵/);
  assert.match(local, /不得移动、重命名、删除或覆盖原始论文/);

  const online = buildResearchKickoffPrompt('web', {
    language: 'zh', cwd: '/papers/blank', searchWindow: 'recent2', currentDate: '2026-09-08T00:00:00.000Z',
  });
  assert.match(online, /当前日期：2026-09-08/);
  assert.match(online, /近 2 年/);
  assert.match(online, /不超过 5 个高信息量问题/);
  assert.match(online, /不得虚构检索过程/);
});
