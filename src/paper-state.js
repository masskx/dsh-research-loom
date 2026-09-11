import { normalizeRevisionIntake, revisionIntakeIdentity, isRevisionPathAllowed } from './revision-intake.js';

export const PAPER_STAGES = Object.freeze([
  { id: 'topic', zh: '选题立项', en: 'Topic', nextZh: '明确研究问题、贡献与边界', nextEn: 'Define the question, contribution, and scope' },
  { id: 'literature', zh: '文献综述', en: 'Literature', nextZh: '建立可追溯的文献矩阵与研究缺口', nextEn: 'Build a traceable literature matrix and research gap' },
  { id: 'design', zh: '研究设计', en: 'Design', nextZh: '固定方法、样本、变量与分析计划', nextEn: 'Lock the method, sample, variables, and analysis plan' },
  { id: 'data', zh: '数据材料', en: 'Data', nextZh: '完成数据、材料或语料的收集与质控', nextEn: 'Complete collection and quality control' },
  { id: 'analysis', zh: '分析结果', en: 'Analysis', nextZh: '完成分析并区分结果、解释与局限', nextEn: 'Complete analysis and separate results, interpretation, and limitations' },
  { id: 'draft', zh: '论文初稿', en: 'Draft', nextZh: '形成结构完整、引证可核验的初稿', nextEn: 'Produce a complete draft with verifiable citations' },
  { id: 'revision', zh: '内审修订', en: 'Revision', nextZh: '完成论证、方法、语言与格式质检', nextEn: 'Audit argument, methods, language, and format' },
  { id: 'submission', zh: '投稿准备', en: 'Submission', nextZh: '核对投稿规范、投稿信、声明与附件', nextEn: 'Check venue rules, cover letter, disclosures, and files' },
  { id: 'review', zh: '外审返修', en: 'Peer review', nextZh: '逐条回应审稿意见并维护修改证据链', nextEn: 'Answer reviewers point by point with a revision trail' },
  { id: 'archive', zh: '录用归档', en: 'Archive', nextZh: '归档最终版本、数据、代码与复现材料', nextEn: 'Archive the final paper, data, code, and reproducibility materials' },
]);

const material = (id, zh, en, ...rules) => ({ id, zh, en, rules });

export const STAGE_MATERIALS = Object.freeze({
  topic: [
    material('statement', '选题说明或研究问题', 'topic statement or research questions', /proposal|research.?question|开题|选题|研究问题|项目说明|项目重启总览/iu),
    material('plan', '开题报告或项目计划', 'proposal or project plan', /proposal|protocol|计划|开题|立项/iu),
    material('contribution', '贡献与范围说明', 'contribution and scope statement', /contribution|scope|创新|贡献|研究边界/iu),
  ],
  literature: [
    material('references', '参考文献库', 'reference library', /\.bib$|\.ris$|\.enl$|bibliograph|references?|文献库|参考文献|zotero/iu),
    material('review', '综述正文', 'literature review draft', /literature.?review|related.?work|文献综述|文献回顾|综述/iu),
    material('matrix', '文献矩阵或研究缺口', 'evidence matrix or research gap', /matrix|research.?gap|evidence.?table|文献矩阵|证据矩阵|研究缺口/iu),
  ],
  design: [
    material('method', '研究方案或方法', 'protocol or methods', /method|methodology|protocol|research.?design|experiment.?plan|研究设计|实验设计|研究方案|方法/iu),
    material('variables', '样本、变量或测量说明', 'sample, variables, or measurement plan', /sample|variable|measure|participant|样本|变量|测量|受试者/iu),
    material('ethics', '伦理、预注册或偏倚控制', 'ethics, preregistration, or bias control', /ethic|prereg|bias|irb|伦理|预注册|偏倚/iu),
  ],
  data: [
    material('dataset', '原始或处理数据/语料', 'raw or processed data/corpus', /(^|\/)(data|dataset|datasets|corpus|materials?)(\/|$)|数据集|语料|原始数据|处理数据/iu, /\.(csv|tsv|xlsx?|parquet|sav|dta)$/iu),
    material('dictionary', '数据字典或材料说明', 'data dictionary or materials documentation', /dictionary|codebook|schema|数据字典|字段说明|材料说明/iu),
    material('quality', '清洗与质量控制记录', 'cleaning and quality-control log', /clean|quality.?control|qc|清洗|质控|质量控制|纳排/iu),
  ],
  analysis: [
    material('code', '分析代码或实验脚本', 'analysis code or experiment scripts', /(^|\/)(analysis|scripts?|code)(\/|$)|分析代码|实验脚本/iu, /(^|\/)(plot|analyse|analyze)[^/]*\.(py|r|ipynb|m)$/iu),
    material('tables', '结果表或统计输出', 'result tables or statistical output', /(^|\/)(results?|outputs?|tables?)(\/|$)|结果表|统计输出|实验结果/iu),
    material('figures', '图或可视化结果', 'figures or visual results', /(^|\/)(figures?|figs?|plots?|charts?)(\/|$)|(^|\/)[^/]*(figure|plot|chart|图表|插图|可视化)[^/]*$/iu),
  ],
  draft: [
    material('source', '论文主稿源文件', 'manuscript source', /(^|\/)(draft|manuscript|paper)(\/|$)|论文|初稿|源稿|当前稿/iu, /(^|\/)(main|paper|manuscript)[^/]*\.(tex|docx?)$/iu),
    material('rendered', '可阅读的渲染稿', 'rendered manuscript', /(^|\/)(main|paper|manuscript|draft)[^/]*\.pdf$/iu, /成稿|渲染稿|当前稿.*\.pdf$/iu),
    material('abstract', '摘要或完整提纲', 'abstract or complete outline', /abstract|outline|摘要|提纲|目录/iu),
  ],
  revision: [
    material('revised', '修订稿', 'revised manuscript', /revision|revised|修订稿|修改稿|返修稿|历史稿/iu),
    material('changelog', '修改记录', 'change log', /change.?log|revision.?log|修改记录|修订记录|版本说明/iu),
    material('internal', '内部评阅或质检表', 'internal review or quality checklist', /internal.?review|quality.?check|内审|内部评阅|质检|检查表/iu),
  ],
  submission: [
    material('package', '投稿包或定稿', 'submission package or final draft', /submission|submit|投稿包|提交包|当前成稿|latex.?clean/iu),
    material('template', '期刊/会议模板与规范', 'venue template and guidelines', /template|guideline|期刊模板|会议模板|投稿规范|author.?instruction/iu),
    material('letter', '投稿信、声明或补充材料', 'cover letter, disclosures, or supplements', /cover.?letter|disclosure|supplement|投稿信|声明|补充材料/iu),
  ],
  review: [
    material('comments', '审稿意见', 'reviewer comments', /reviewer|review.?report|审稿意见|外审意见|评审意见|审查意见/iu),
    material('decision', '编辑决定', 'editor decision', /editor.?decision|decision.?letter|编辑决定|决定信|decision/iu),
    material('response', '逐条回复或返修说明', 'point-by-point response', /response.?to|rebuttal|point.?by.?point|逐条回复|回复审稿|答辩/iu),
  ],
  archive: [
    material('acceptance', '录用通知', 'acceptance notice', /accepted|acceptance|录用|接收函/iu),
    material('final', '最终版或正式发表版', 'final or published version', /camera.?ready|published|publication|final.?version|最终版|正式发表/iu),
    material('repository', 'DOI、数据代码或复现归档', 'DOI, data/code, or reproducibility archive', /(^|\/)(archive|repository|reproducibility)(\/|$)|doi[^/]*\.(txt|md|json|ya?ml)$|复现包|数据归档|代码归档/iu),
  ],
});

const IDS = PAPER_STAGES.map((stage) => stage.id);
const STAGE_IDS = new Set(IDS);
const REQUIRED_WORKFLOW = ['topic', 'literature', 'design', 'draft', 'submission', 'review', 'archive'];

export const WORKFLOW_PRESETS = Object.freeze({
  auto: { zh: '智能匹配', en: 'Smart match', stages: null },
  empirical: { zh: '实证研究', en: 'Empirical', stages: IDS },
  theoretical: { zh: '理论研究', en: 'Theoretical', stages: ['topic', 'literature', 'design', 'draft', 'submission', 'review', 'archive'] },
  review: { zh: '综述论文', en: 'Review paper', stages: ['topic', 'literature', 'design', 'draft', 'revision', 'submission', 'review', 'archive'] },
  custom: { zh: '自定义', en: 'Custom', stages: null },
});

export const PUBLICATION_STANDARDS = Object.freeze({
  general: {
    zh: '通用学术规范', en: 'General academic',
    weights: { topic: 10, literature: 14, design: 14, data: 10, analysis: 12, draft: 18, revision: 7, submission: 7, review: 5, archive: 3 },
    rubricZh: ['研究问题与贡献（20）', '文献与理论定位（15）', '方法严谨性（20）', '结果与论证（20）', '报告、伦理与可复现性（15）', '表达与规范（10）'],
    rubricEn: ['Question and contribution (20)', 'Literature and positioning (15)', 'Methodological rigor (20)', 'Results and argument (20)', 'Reporting, ethics, and reproducibility (15)', 'Writing and compliance (10)'],
  },
  sci: {
    zh: 'SCI 期刊', en: 'SCI journal',
    weights: { topic: 8, literature: 12, design: 15, data: 12, analysis: 16, draft: 18, revision: 6, submission: 7, review: 4, archive: 2 },
    rubricZh: ['创新性与理论贡献（20）', '文献定位与引证质量（15）', '方法与统计严谨性（25）', '结果、讨论与局限（20）', '可复现性、伦理与数据透明（10）', '期刊规范与学术表达（10）'],
    rubricEn: ['Novelty and theoretical contribution (20)', 'Positioning and citation quality (15)', 'Methodological and statistical rigor (25)', 'Results, discussion, and limitations (20)', 'Reproducibility, ethics, and transparency (10)', 'Journal compliance and scholarly writing (10)'],
  },
  ei: {
    zh: 'EI 会议', en: 'EI conference',
    weights: { topic: 8, literature: 9, design: 15, data: 10, analysis: 20, draft: 20, revision: 5, submission: 8, review: 3, archive: 2 },
    rubricZh: ['技术贡献与问题价值（20）', '方法、算法或系统设计（25）', '实验验证与对比（25）', '可复现性与工程完整性（10）', '表达、图表与篇幅效率（10）', '会议格式与匿名规范（10）'],
    rubricEn: ['Technical contribution and problem value (20)', 'Method, algorithm, or system design (25)', 'Experimental validation and comparisons (25)', 'Reproducibility and engineering completeness (10)', 'Writing, figures, and space efficiency (10)', 'Conference formatting and anonymity (10)'],
  },
});

export const SEARCH_WINDOWS = Object.freeze({
  recent2: { zh: '近 2 年 + 奠基文献', en: 'Last 2 years + seminal work', years: 2 },
  recent5: { zh: '近 5 年 + 奠基文献', en: 'Last 5 years + seminal work', years: 5 },
  all: { zh: '不限年份，强调最新进展', en: 'All years, emphasize current work', years: 0 },
});

export function normalizeWorkspaceKey(cwd) {
  if (typeof cwd !== 'string') return '';
  return cwd.trim().replace(/\\/g, '/').replace(/\/+$/, '');
}

export function workspaceName(cwd) {
  const key = normalizeWorkspaceKey(cwd);
  if (!key) return '';
  return key.split('/').filter(Boolean).at(-1) ?? key;
}

function normalizeWorkflow(value) {
  const selected = new Set(Array.isArray(value) ? value.filter((id) => STAGE_IDS.has(id)) : []);
  return IDS.filter((id) => selected.has(id));
}

export function normalizeProjectState(value) {
  const revisionIntake = normalizeRevisionIntake(value?.revisionIntake);
  if ([revisionIntake.manuscript, ...revisionIntake.reviewFiles].filter(Boolean).some(path => !isRevisionPathAllowed(path, value))) revisionIntake.confirmed = false;
  return {
    entryScenario: ['paper', 'start', 'revision'].includes(value?.entryScenario) ? value.entryScenario : '',
    entryStep: Number.isInteger(value?.entryStep) && value.entryStep >= 0 && value.entryStep <= 2 ? value.entryStep : 0,
    revisionIntake,
    stage: STAGE_IDS.has(value?.stage) ? value.stage : 'topic',
    updatedAt: typeof value?.updatedAt === 'string' ? value.updatedAt : '',
    source: value?.source === 'auto' || value?.source === 'manual' ? value.source : 'manual',
    lastScannedAt: typeof value?.lastScannedAt === 'string' ? value.lastScannedAt : '',
    workflowMode: Object.hasOwn(WORKFLOW_PRESETS, value?.workflowMode) ? value.workflowMode : 'auto',
    workflow: normalizeWorkflow(value?.workflow),
    standard: Object.hasOwn(PUBLICATION_STANDARDS, value?.standard) ? value.standard : 'general',
    kickoffMode: ['auto', 'local', 'web', 'hybrid'].includes(value?.kickoffMode) ? value.kickoffMode : 'auto',
    researchTopic: typeof value?.researchTopic === 'string' ? value.researchTopic.slice(0, 500) : '',
    researchBrief: typeof value?.researchBrief === 'string' ? value.researchBrief.slice(0, 2000) : '',
    searchWindow: Object.hasOwn(SEARCH_WINDOWS, value?.searchWindow) ? value.searchWindow : 'recent5',
    researchMemory: typeof value?.researchMemory === 'string' ? value.researchMemory.slice(0, 8000) : '',
    reviewLoop: typeof value?.reviewLoop === 'string' && value.reviewLoop.length <= 800000 ? value.reviewLoop : '',
    venue: typeof value?.venue === 'string' ? value.venue.slice(0, 500) : '',
    venueGuidelines: typeof value?.venueGuidelines === 'string' ? value.venueGuidelines.slice(0, 2000) : '',
    scanRoot: normalizeRelativeRoot(value?.scanRoot),
    excludedFolders: Array.isArray(value?.excludedFolders) ? value.excludedFolders.map(normalizeRelativeRoot).filter(Boolean).slice(0, 50) : [],
    assignments: Object.fromEntries(Object.entries(value?.assignments ?? {}).filter(([path, id]) => typeof path === 'string' && isMaterialAssignment(id))),
    stageStates: Object.fromEntries(Object.entries(value?.stageStates ?? {}).filter(([id, state]) => STAGE_IDS.has(id) && ['not-started', 'working', 'review', 'confirmed', 'na'].includes(state))),
    tasks: Array.isArray(value?.tasks) ? value.tasks.filter((task) => task && typeof task.id === 'string' && typeof task.sessionId === 'string' && STAGE_IDS.has(task.stageId))
      .slice(0, 20).map((task) => ({
        id: task.id.slice(0, 100), sessionId: task.sessionId.slice(0, 200), stageId: task.stageId,
        status: ['awaiting', 'running', 'checking', 'review', 'failed', 'confirmed'].includes(task.status) ? task.status : 'review',
        startedAt: typeof task.startedAt === 'string' ? task.startedAt : '',
        endSeq: Number.isFinite(task.endSeq) ? task.endSeq : 0,
        baseline: Array.isArray(task.baseline) ? task.baseline.filter((p) => typeof p === 'string').slice(0, 2000) : [],
        outputs: Array.isArray(task.outputs) ? task.outputs.filter((p) => typeof p === 'string').slice(0, 2000) : [],
      })) : [],
  };
}

export function normalizeRelativeRoot(value) {
  if (typeof value !== 'string') return '';
  const path = value.trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
  if (/^(\/|[a-z]:)/i.test(path) || path.split('/').includes('..')) return '';
  return path.split('/').filter((part) => part && part !== '.').join('/');
}

export function isMaterialAssignment(id) {
  return id === 'ignore' || Object.entries(STAGE_MATERIALS).some(([stage, items]) => items.some((item) => `${stage}:${item.id}` === id));
}

export function updateProjectStage(projects, cwd, stage, updatedAt, metadata = {}) {
  if (!STAGE_IDS.has(stage)) throw new TypeError(`Unknown paper stage: ${stage}`);
  return updateProjectConfig(projects, cwd, { stage, updatedAt, ...metadata });
}

export function updateProjectConfig(projects, cwd, patch) {
  const key = normalizeWorkspaceKey(cwd);
  if (!key) throw new TypeError('A workspace path is required');
  const previous = projects?.[key] && typeof projects[key] === 'object' ? projects[key] : {};
  const changes = patch && typeof patch === 'object' ? { ...patch } : {};
  if (Object.hasOwn(changes, 'revisionIntake')) {
    changes.revisionIntake = normalizeRevisionIntake(changes.revisionIntake);
    if (revisionIntakeIdentity(previous.revisionIntake) !== revisionIntakeIdentity(changes.revisionIntake)) changes.revisionIntake.confirmed = false;
  }
  const next = { ...previous, ...changes };
  if (next.revisionIntake) next.revisionIntake = normalizeProjectState(next).revisionIntake;
  return { ...(projects && typeof projects === 'object' ? projects : {}), [key]: next };
}

export function analyzePaperArtifacts(candidates, scannedAt = '', options = {}) {
  const project = normalizeProjectState(options);
  const allPaths = [...new Set((Array.isArray(candidates) ? candidates : [])
    .filter((candidate) => typeof candidate === 'string' || candidate?.kind !== 'directory')
    .map((candidate) => typeof candidate === 'string' ? candidate : candidate?.path)
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.replace(/\\/g, '/')))].sort((a, b) => a.localeCompare(b));
  const paths = allPaths.filter((path) => {
    if (project.scanRoot && !path.startsWith(`${project.scanRoot}/`)) return false;
    if (project.excludedFolders.some((folder) => path === folder || path.startsWith(`${folder}/`))) return false;
    if (project.assignments[path] === 'ignore') return false;
    if (project.assignments[path]) return true;
    if (/(^|\/)(node_modules|\.git|\.venv|venv|__pycache__|\.research-loom)(\/|$)/i.test(path)) return false;
    return !/\.(ya?ml|js|jsx|ts|tsx|map|lock)$/i.test(path);
  });
  const modules = {};
  for (const stage of PAPER_STAGES) {
    const checks = (STAGE_MATERIALS[stage.id] ?? []).map((definition) => {
      const artifacts = paths.filter((path) => project.assignments[path]
        ? project.assignments[path] === `${stage.id}:${definition.id}`
        : (!(stage.id === 'draft') || /\.(md|txt|tex|docx?|pdf|rst)$/i.test(path))
          && definition.rules.some((rule) => rule.test((project.scanRoot ? path.slice(project.scanRoot.length + 1) : path).split('/').slice(-2).join('/'))));
      return { id: definition.id, zh: definition.zh, en: definition.en, status: artifacts.length ? 'found' : 'missing', artifacts: artifacts.slice(0, 100) };
    });
    const foundCount = checks.filter((check) => check.status === 'found').length;
    const allArtifacts = [...new Set(checks.flatMap((check) => check.artifacts))];
    modules[stage.id] = {
      status: foundCount === 0 ? 'missing' : foundCount === checks.length ? 'complete' : 'partial',
      coverage: checks.length ? foundCount / checks.length : 0,
      materialChecks: checks,
      artifactCount: allArtifacts.length,
      artifacts: allArtifacts.slice(0, 8),
    };
  }
  const report = {
    stage: 'topic',
    scannedAt: typeof scannedAt === 'string' ? scannedAt : '',
    candidateCount: paths.length,
    sourceFiles: paths.slice(0, 2000),
    allFiles: allPaths.slice(0, 2000),
    excludedCount: allPaths.length - paths.length,
    modules,
  };
  report.stage = currentStageForWorkflow(report, recommendWorkflow(report));
  return report;
}

export function recommendWorkflow(report) {
  const optional = new Set();
  for (const id of ['data', 'analysis', 'revision']) if (report?.modules?.[id]?.status && report.modules[id].status !== 'missing') optional.add(id);
  return IDS.filter((id) => REQUIRED_WORKFLOW.includes(id) || optional.has(id));
}

export function isResearchKickoffRecommended(report) {
  if (!report || report.candidateCount === 0) return true;
  const modules = report.modules ?? {};
  return modules.topic?.status !== 'complete'
    && modules.design?.status === 'missing'
    && modules.data?.status === 'missing'
    && modules.analysis?.status === 'missing';
}

export function resolveWorkflow(project, report) {
  const normalized = normalizeProjectState(project);
  let ids = normalized.workflowMode === 'auto' ? recommendWorkflow(report)
    : normalized.workflowMode === 'custom' ? normalized.workflow.length ? normalized.workflow : recommendWorkflow(report)
    : [...(WORKFLOW_PRESETS[normalized.workflowMode]?.stages ?? recommendWorkflow(report))];
  const active = ids.filter((id) => normalized.stageStates[id] !== 'na');
  return active.length ? active : ['topic'];
}

export function nextResearchStage(report, workflow, project) {
  const states = normalizeProjectState(project).stageStates;
  return workflow.find((id) => states[id] === 'working' || states[id] === 'review')
    ?? workflow.find((id) => states[id] !== 'confirmed') ?? workflow.at(-1) ?? 'topic';
}

export function projectHandoff(project, language = 'zh') {
  const p = normalizeProjectState(project);
  const context = [p.researchTopic, p.researchBrief, p.researchMemory].filter(Boolean).join('\n');
  const confirmed = PAPER_STAGES.filter((stage) => p.stageStates[stage.id] === 'confirmed').map((stage) => stage[language]).join(', ');
  return language === 'zh'
    ? `项目背景与研究者记录（仍须根据材料核验）：\n${context || '尚未记录'}\n研究者确认的阶段：${confirmed || '无'}\n具体投稿目标：${p.venue || '未指定'}\n作者指南来源/要求：${p.venueGuidelines || '未提供；不能把 SCI/EI 当作统一期刊规范'}\n如涉及投稿符合度，请核验指南来源与更新时间；证据不足的项目标为待评估。\n请在结束时列出本次实际产物路径、结论依据、尚未解决问题与下一步建议；需要落盘时创建新版本，不覆盖原材料。`
    : `Researcher context (verify against sources):\n${context || 'Not recorded'}\nResearcher-confirmed stages: ${confirmed || 'None'}\nTarget venue: ${p.venue || 'Unspecified'}\nAuthor guidelines/source: ${p.venueGuidelines || 'Not supplied; SCI/EI are not uniform venue rules'}\nVerify guideline source and date; mark unsupported assessments as pending. End with actual output paths, evidence, unresolved questions and next steps. Create new versions when saving files.`;
}

export function collectTaskOutputs(task, report) {
  const baseline = new Set(task.baseline ?? []);
  return [...new Set([...(task.outputs ?? []), ...report.sourceFiles.filter((path) => !baseline.has(path))])];
}

export function taskExecutionStatus(task, { running, endSeq = 0, promptFailed = false, lastAgentError = null }) {
  if (!['awaiting', 'running'].includes(task.status)) return task.status;
  if (promptFailed) return 'failed';
  if (running) return 'running';
  if (task.status === 'running' || endSeq > task.endSeq) return lastAgentError ? 'failed' : 'checking';
  return task.status;
}

export function exportProjectSnapshot(project) {
  return { format: 'research-loom-project', version: 1, project: { ...normalizeProjectState(project), tasks: [], reviewLoop: '' } };
}

export function importProjectSnapshot(value) {
  if (value?.format !== 'research-loom-project' || value.version !== 1 || !value.project || typeof value.project !== 'object' || Array.isArray(value.project)) throw new Error('Invalid project snapshot');
  return normalizeProjectState({ ...value.project, tasks: [], reviewLoop: '' });
}

export function currentStageForWorkflow(report, workflow) {
  const active = normalizeWorkflow(workflow);
  let current = active[0] ?? 'topic';
  for (const id of active) {
    const module = report?.modules?.[id];
    if (!module?.status || module.status === 'missing') continue;
    if (id === 'archive') {
      const conclusive = module.materialChecks?.some((check) => ['acceptance', 'final'].includes(check.id) && check.status === 'found');
      if (!conclusive) continue;
    }
    current = id;
  }
  return current;
}

export function scorePaperMaterials(report, workflow, standardId = 'general') {
  const active = normalizeWorkflow(workflow);
  const standard = PUBLICATION_STANDARDS[standardId] ?? PUBLICATION_STANDARDS.general;
  const totalWeight = active.reduce((sum, id) => sum + (standard.weights[id] ?? 1), 0) || 1;
  const weighted = active.reduce((sum, id) => sum + (standard.weights[id] ?? 1) * (report?.modules?.[id]?.coverage ?? 0), 0);
  const checks = active.flatMap((id) => report?.modules?.[id]?.materialChecks ?? []);
  return { score: Math.round((weighted / totalWeight) * 100), found: checks.filter((check) => check.status === 'found').length, missing: checks.filter((check) => check.status === 'missing').length, total: checks.length, standard: standardId };
}

export function suggestModulePrompt(stageId, moduleReport, standardId = 'general', language = 'zh') {
  const stage = PAPER_STAGES.find((item) => item.id === stageId) ?? PAPER_STAGES[0];
  const standard = PUBLICATION_STANDARDS[standardId] ?? PUBLICATION_STANDARDS.general;
  const missing = (moduleReport?.materialChecks ?? []).filter((item) => item.status === 'missing');
  const existing = (moduleReport?.materialChecks ?? []).filter((item) => item.status === 'found');
  const labels = (items, key) => items.map((item) => item[key]).join('、');
  if (language === 'en') {
    if (!existing.length) return `No ${stage.en} evidence is currently visible. Inspect the workspace first, then draft the missing ${labels(missing, 'en')} under the ${standard.en} standard, marking every assumption and item that requires researcher confirmation.`;
    if (missing.length) return `Audit the existing ${labels(existing, 'en')}, then complete the missing ${labels(missing, 'en')} under the ${standard.en} standard. Prioritize the highest-risk gap and keep all recommendations traceable to file evidence.`;
    return `All expected ${stage.en} material types are visible. Read them and perform a ${standard.en} quality audit for consistency, rigor, traceability, and submission risk; return prioritized, directly actionable revisions.`;
  }
  if (!existing.length) return `当前未发现【${stage.zh}】的明确材料。请先检查工作区，再按“${standard.zh}”要求起草缺失的${labels(missing, 'zh')}，所有假设和需要研究者确认之处必须显式标注。`;
  if (missing.length) return `请先审查已有的${labels(existing, 'zh')}，再按“${standard.zh}”要求补齐${labels(missing, 'zh')}。优先处理风险最高的缺口，所有建议必须可追溯到文件证据。`;
  return `【${stage.zh}】的预期材料类型已齐全。请读取材料并按“${standard.zh}”进行一致性、严谨性、可追溯性和投稿风险审计，给出有优先级、可直接执行的修订方案。`;
}

function mention(path) {
  return /[\s"]/u.test(path) ? `@"${path.replace(/"/g, '')}"` : `@${path}`;
}

export function buildResearchKickoffPrompt(mode, options = {}) {
  if (mode === 'hybrid') return [buildResearchKickoffPrompt('local', options),
    options.language === 'en' ? 'Then search online specifically for gaps in the supplied literature; merge and deduplicate sources, retaining provenance and clearly separating read full texts from abstracts.' : '然后针对已有文献暴露的缺口补充联网检索，合并去重，保留本地与在线来源标记，区分已读全文与仅有摘要。',
    buildResearchKickoffPrompt('web', options)].join('\n\n');
  const language = options.language === 'en' ? 'en' : 'zh';
  const selectedMode = mode === 'local' ? 'local' : 'web';
  const standardId = Object.hasOwn(PUBLICATION_STANDARDS, options.standardId) ? options.standardId : 'general';
  const standard = PUBLICATION_STANDARDS[standardId];
  const topic = typeof options.topic === 'string' ? options.topic.trim() : '';
  const brief = typeof options.brief === 'string' ? options.brief.trim() : '';
  const projectName = workspaceName(options.cwd) || (language === 'zh' ? '当前研究项目' : 'current research project');
  const sourceFiles = [...new Set((Array.isArray(options.sourceFiles) ? options.sourceFiles : [])
    .filter((path) => typeof path === 'string' && path.trim()))].slice(0, 60);
  const sourceList = sourceFiles.length
    ? sourceFiles.map((path) => `- ${mention(path)}`).join('\n')
    : language === 'zh' ? '- 未扫描到候选资料。' : '- No candidate source was detected.';
  const searchWindow = SEARCH_WINDOWS[options.searchWindow] ?? SEARCH_WINDOWS.recent5;
  const today = /^\d{4}-\d{2}-\d{2}/u.exec(String(options.currentDate ?? ''))?.[0] || new Date().toISOString().slice(0, 10);

  if (language === 'en') {
    const topicLine = topic || 'Not specified. Ask no more than five high-information questions before searching.';
    const briefLine = brief || 'No additional constraints supplied.';
    if (selectedMode === 'local') return [
      `Start the research project "${projectName}" by organizing and analyzing researcher-supplied literature under the ${standard.en} target.`,
      `Research topic or tentative question: ${topicLine}\nResearcher priorities/constraints: ${briefLine}`,
      'Candidate workspace sources (read each relevant file before making claims):', sourceList,
      'Work in this order: (1) inventory the files and flag duplicates, unreadable items, and missing metadata; (2) build a traceable literature matrix with title, authors, year, venue, DOI/URL, method/data, principal finding, claimed novelty, limitations, and exact file/page evidence; (3) synthesize agreements, conflicts, methodological patterns, and gaps across papers rather than merely summarizing them one by one; (4) propose 3–5 research directions, each with novelty basis, falsifiable question, feasible method/data, expected contribution, risks, and the sources that support the gap; (5) recommend a prioritized next-step research plan.',
      'Archiving rule: propose a folder/naming scheme and create only non-destructive derived indexes or notes. Do not move, rename, delete, or overwrite source papers without explicit confirmation.',
      'Academic integrity: distinguish file evidence from inference; never invent bibliographic metadata, citations, findings, novelty, or access to unread content. Mark unverifiable fields explicitly and cite exact workspace paths for every material claim.',
    ].join('\n\n');
    return [
      `Launch an online literature discovery for the research project "${projectName}" under the ${standard.en} target. Current date: ${today}.`,
      `Research topic or tentative question: ${topicLine}\nResearcher priorities/constraints: ${briefLine}\nSearch window: ${searchWindow.en}.`,
      topic ? 'Use the available web/research tools and the installed deep-research capability. Search multiple scholarly sources with reproducible English and relevant non-English queries.' : 'The topic is too underspecified for a defensible search. First ask no more than five high-information questions covering the phenomenon/problem, population or application, desired contribution, constraints, and acceptable methods. Do not fabricate a search while waiting for answers.',
      'When a search can proceed: record databases/services, exact query strings, filters, and search date; prioritize peer-reviewed and primary sources while clearly labeling preprints; verify title, authors, year, venue, DOI or stable URL from authoritative pages; never infer a paper from a search snippet or treat an abstract as full-text evidence.',
      'Return: (1) search log and inclusion criteria; (2) verified literature landscape; (3) convergent findings, disputes, and evidence gaps; (4) 3–5 candidate directions scored for novelty, importance, feasibility, data/method requirements, and risk; (5) a recommended research question and phased plan. Separate recent opportunities from established background and state all unavailable evidence.',
    ].join('\n\n');
  }

  const topicLine = topic || '尚未明确。开始检索前，先提出不超过 5 个高信息量澄清问题。';
  const briefLine = brief || '未提供额外约束。';
  if (selectedMode === 'local') return [
    `请为研究项目“${projectName}”启动课题研究，整理并分析研究者自主提供的文献资料，目标标准为“${standard.zh}”。`,
    `研究主题或暂定问题：${topicLine}\n研究者的重点与约束：${briefLine}`,
    '工作区候选资料如下（作出任何判断前必须读取相关文件）：', sourceList,
    '请依次完成：（1）建立文件清单，标记重复项、无法读取项和缺失元数据；（2）建立可追溯文献矩阵，至少包含题名、作者、年份、来源、DOI/URL、方法与数据、主要结论、作者声称的创新点、局限，以及精确文件路径/页码证据；（3）进行跨论文综合，梳理共识、冲突、方法模式和研究缺口，不能只逐篇摘要；（4）提出 3–5 个候选研究方向，逐项说明创新依据、可证伪问题、可行方法与数据、预期贡献、风险和支撑该缺口的来源；（5）给出有优先级的后续研究计划。',
    '归档规则：先提出目录与命名方案，只能创建非破坏性的衍生索引或笔记；未经明确确认，不得移动、重命名、删除或覆盖原始论文。',
    '学术规范：明确区分文件证据与推断；不得编造书目信息、引文、结论、创新点或声称读过未读取的内容；无法核验的字段必须明确标注，所有材料性结论须引用精确工作区路径。',
  ].join('\n\n');
  return [
    `请为研究项目“${projectName}”启动在线文献检索与方向发现，目标标准为“${standard.zh}”。当前日期：${today}。`,
    `研究主题或暂定问题：${topicLine}\n研究者的重点与约束：${briefLine}\n检索时间窗：${searchWindow.zh}。`,
    topic ? '请使用当前可用的网页/研究工具，并优先调用已安装的 deep-research 能力；同时使用可复现的英文检索式和相关中文检索式，在多个学术来源中交叉检索。' : '当前主题不足以支持严谨检索。请先提出不超过 5 个高信息量问题，覆盖研究现象/问题、对象或应用场景、期望贡献、现实约束和可接受方法；获得回答前不得虚构检索过程。',
    '可以检索后必须记录：数据库或服务、完整检索式、筛选条件与检索日期；优先同行评审和一手来源，预印本须单独标注；题名、作者、年份、来源、DOI 或稳定链接必须经权威页面核验；不得根据搜索摘要臆测论文，也不得把摘要当作全文证据。',
    '请输出：（1）检索日志和纳入标准；（2）经核验的研究版图；（3）共识、争议和证据缺口；（4）3–5 个候选方向，并按创新性、重要性、可行性、数据/方法需求和风险评分；（5）推荐研究问题与分阶段计划。必须区分最新机会与经典背景，并明确列出无法获得或无法核验的证据。',
  ].join('\n\n');
}

export function buildModulePrompt(stageId, options = {}) {
  const stage = PAPER_STAGES.find((item) => item.id === stageId) ?? PAPER_STAGES[0];
  const language = options.language === 'en' ? 'en' : 'zh';
  const standardId = Object.hasOwn(PUBLICATION_STANDARDS, options.standardId) ? options.standardId : 'general';
  const standard = PUBLICATION_STANDARDS[standardId];
  const moduleReport = options.moduleReport ?? { status: 'missing', materialChecks: [], artifacts: options.artifacts ?? [] };
  const artifacts = Array.isArray(moduleReport.artifacts) ? moduleReport.artifacts : [];
  const task = typeof options.userPrompt === 'string' && options.userPrompt.trim() ? options.userPrompt.trim() : suggestModulePrompt(stage.id, moduleReport, standardId, language);
  const projectName = workspaceName(options.cwd) || (language === 'zh' ? '当前论文项目' : 'current paper project');
  const evidence = artifacts.length ? artifacts.map((path) => `- ${mention(path)}`).join('\n') : language === 'zh' ? '- 未自动发现明确产物，请先检查工作区并说明缺失项。' : '- No explicit artifact was detected; inspect the workspace and identify missing items first.';
  const missing = (moduleReport.materialChecks ?? []).filter((item) => item.status === 'missing').map((item) => item[language]).join('、') || (language === 'zh' ? '无' : 'None');
  if (language === 'en') return [
    `Paper project: "${projectName}". Module: ${stage.en}. Target standard: ${standard.en}.`,
    `Quality gate: ${stage.nextEn}. Missing material types: ${missing}.`,
    'Matched workspace evidence (read relevant files before judging):', evidence,
    `Task: ${task}`,
    'Requirements: distinguish observed evidence from inference; never invent citations, data, results, or review decisions; cite file paths for findings; report missing evidence explicitly; do not overwrite files unless asked.',
  ].join('\n\n');
  return [
    `论文项目：“${projectName}”。模块：【${stage.zh}】。目标标准：“${standard.zh}”。`,
    `本阶段质量门：${stage.nextZh}。当前缺失材料类型：${missing}。`,
    '自动匹配的工作区证据如下（作出判断前请读取相关文件）：', evidence,
    `任务：${task}`,
    '学术规范：明确区分文件证据与推断；不得编造引文、数据、结果或审稿决定；结论须引用对应文件路径；证据不足时明确列出缺失项；未经明确要求不得覆盖现有文件。',
  ].join('\n\n');
}

export function buildEvaluationPrompt(report, workflow, standardId = 'general', language = 'zh', cwd = '') {
  const standard = PUBLICATION_STANDARDS[standardId] ?? PUBLICATION_STANDARDS.general;
  const active = normalizeWorkflow(workflow);
  const lines = active.map((id) => {
    const stage = PAPER_STAGES.find((item) => item.id === id);
    const module = report?.modules?.[id];
    const found = (module?.materialChecks ?? []).filter((item) => item.status === 'found').map((item) => item[language]).join('、') || (language === 'zh' ? '无' : 'None');
    const missing = (module?.materialChecks ?? []).filter((item) => item.status === 'missing').map((item) => item[language]).join('、') || (language === 'zh' ? '无' : 'None');
    const refs = (module?.artifacts ?? []).map(mention).join('、') || (language === 'zh' ? '无' : 'None');
    return language === 'zh' ? `- ${stage.zh}：已有 ${found}；缺失 ${missing}；证据 ${refs}` : `- ${stage.en}: found ${found}; missing ${missing}; evidence ${refs}`;
  }).join('\n');
  const rubric = (language === 'zh' ? standard.rubricZh : standard.rubricEn).map((item) => `- ${item}`).join('\n');
  if (language === 'en') return [
    `Perform a deep academic quality assessment of the "${workspaceName(cwd) || 'current paper project'}" against the ${standard.en} standard.`,
    'The path-only inventory below is a navigation aid, not a quality score. Read the relevant source files before assigning any points:', lines,
    'Transparent 100-point rubric:', rubric,
    'Return: (1) total and category scores; (2) evidence with exact file paths; (3) missing or unverifiable evidence; (4) submission risks; (5) prioritized next actions. Distinguish evidence from inference, do not invent citations/data/results/decisions, and state when a criterion cannot be scored. Do not overwrite files unless asked.',
  ].join('\n\n');
  return [
    `请对论文项目“${workspaceName(cwd) || '当前论文项目'}”按“${standard.zh}”进行深度学术质量评分。`,
    '以下内容仅是路径级材料清单，不是质量分。打分前必须读取相关源文件：', lines,
    '透明的 100 分量表：', rubric,
    '请输出：（1）总分与分项分；（2）带精确文件路径的证据；（3）缺失或无法核验的证据；（4）投稿风险；（5）按优先级排列的后续操作。必须区分证据与推断，不得编造引文、数据、结果或审稿决定；无法判断的项目须明确标为“不可评分”。未经明确要求不得覆盖文件。',
  ].join('\n\n');
}
