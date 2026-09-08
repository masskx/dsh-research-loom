window.__ModuleLoader__.load({ id: "dsh-academic-research-skills", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.js
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var React2 = __toESM(require("react"), 1);

// src/paper-state.js
var PAPER_STAGES = Object.freeze([
  { id: "topic", zh: "选题立项", en: "Topic", nextZh: "明确研究问题、贡献与边界", nextEn: "Define the question, contribution, and scope" },
  { id: "literature", zh: "文献综述", en: "Literature", nextZh: "建立可追溯的文献矩阵与研究缺口", nextEn: "Build a traceable literature matrix and research gap" },
  { id: "design", zh: "研究设计", en: "Design", nextZh: "固定方法、样本、变量与分析计划", nextEn: "Lock the method, sample, variables, and analysis plan" },
  { id: "data", zh: "数据材料", en: "Data", nextZh: "完成数据、材料或语料的收集与质控", nextEn: "Complete collection and quality control" },
  { id: "analysis", zh: "分析结果", en: "Analysis", nextZh: "完成分析并区分结果、解释与局限", nextEn: "Complete analysis and separate results, interpretation, and limitations" },
  { id: "draft", zh: "论文初稿", en: "Draft", nextZh: "形成结构完整、引证可核验的初稿", nextEn: "Produce a complete draft with verifiable citations" },
  { id: "revision", zh: "内审修订", en: "Revision", nextZh: "完成论证、方法、语言与格式质检", nextEn: "Audit argument, methods, language, and format" },
  { id: "submission", zh: "投稿准备", en: "Submission", nextZh: "核对投稿规范、投稿信、声明与附件", nextEn: "Check venue rules, cover letter, disclosures, and files" },
  { id: "review", zh: "外审返修", en: "Peer review", nextZh: "逐条回应审稿意见并维护修改证据链", nextEn: "Answer reviewers point by point with a revision trail" },
  { id: "archive", zh: "录用归档", en: "Archive", nextZh: "归档最终版本、数据、代码与复现材料", nextEn: "Archive the final paper, data, code, and reproducibility materials" }
]);
var material = (id, zh, en, ...rules) => ({ id, zh, en, rules });
var STAGE_MATERIALS = Object.freeze({
  topic: [
    material("statement", "选题说明或研究问题", "topic statement or research questions", /proposal|research.?question|开题|选题|研究问题|项目说明|项目重启总览/iu),
    material("plan", "开题报告或项目计划", "proposal or project plan", /proposal|protocol|计划|开题|立项/iu),
    material("contribution", "贡献与范围说明", "contribution and scope statement", /contribution|scope|创新|贡献|研究边界/iu)
  ],
  literature: [
    material("references", "参考文献库", "reference library", /\.bib$|\.ris$|\.enl$|bibliograph|references?|文献库|参考文献|zotero/iu),
    material("review", "综述正文", "literature review draft", /literature.?review|related.?work|文献综述|文献回顾|综述/iu),
    material("matrix", "文献矩阵或研究缺口", "evidence matrix or research gap", /matrix|research.?gap|evidence.?table|文献矩阵|证据矩阵|研究缺口/iu)
  ],
  design: [
    material("method", "研究方案或方法", "protocol or methods", /method|methodology|protocol|research.?design|experiment.?plan|研究设计|实验设计|研究方案|方法/iu),
    material("variables", "样本、变量或测量说明", "sample, variables, or measurement plan", /sample|variable|measure|participant|样本|变量|测量|受试者/iu),
    material("ethics", "伦理、预注册或偏倚控制", "ethics, preregistration, or bias control", /ethic|prereg|bias|irb|伦理|预注册|偏倚/iu)
  ],
  data: [
    material("dataset", "原始或处理数据/语料", "raw or processed data/corpus", /(^|\/)(data|dataset|datasets|corpus|materials?)(\/|$)|数据集|语料|原始数据|处理数据/iu, /\.(csv|tsv|xlsx?|parquet|sav|dta)$/iu),
    material("dictionary", "数据字典或材料说明", "data dictionary or materials documentation", /dictionary|codebook|schema|数据字典|字段说明|材料说明/iu),
    material("quality", "清洗与质量控制记录", "cleaning and quality-control log", /clean|quality.?control|qc|清洗|质控|质量控制|纳排/iu)
  ],
  analysis: [
    material("code", "分析代码或实验脚本", "analysis code or experiment scripts", /(^|\/)(analysis|scripts?|code)(\/|$)|分析代码|实验脚本/iu, /(^|\/)(plot|analyse|analyze)[^/]*\.(py|r|ipynb|m)$/iu),
    material("tables", "结果表或统计输出", "result tables or statistical output", /(^|\/)(results?|outputs?|tables?)(\/|$)|结果表|统计输出|实验结果/iu),
    material("figures", "图或可视化结果", "figures or visual results", /(^|\/)(figures?|figs?|plots?|charts?)(\/|$)|(^|\/)[^/]*(figure|plot|chart|图表|插图|可视化)[^/]*$/iu)
  ],
  draft: [
    material("source", "论文主稿源文件", "manuscript source", /(^|\/)(draft|manuscript|paper)(\/|$)|论文|初稿|源稿|当前稿/iu, /(^|\/)(main|paper|manuscript)[^/]*\.(tex|docx?)$/iu),
    material("rendered", "可阅读的渲染稿", "rendered manuscript", /(^|\/)(main|paper|manuscript|draft)[^/]*\.pdf$/iu, /成稿|渲染稿|当前稿.*\.pdf$/iu),
    material("abstract", "摘要或完整提纲", "abstract or complete outline", /abstract|outline|摘要|提纲|目录/iu)
  ],
  revision: [
    material("revised", "修订稿", "revised manuscript", /revision|revised|修订稿|修改稿|返修稿|历史稿/iu),
    material("changelog", "修改记录", "change log", /change.?log|revision.?log|修改记录|修订记录|版本说明/iu),
    material("internal", "内部评阅或质检表", "internal review or quality checklist", /internal.?review|quality.?check|内审|内部评阅|质检|检查表/iu)
  ],
  submission: [
    material("package", "投稿包或定稿", "submission package or final draft", /submission|submit|投稿包|提交包|当前成稿|latex.?clean/iu),
    material("template", "期刊/会议模板与规范", "venue template and guidelines", /template|guideline|期刊模板|会议模板|投稿规范|author.?instruction/iu),
    material("letter", "投稿信、声明或补充材料", "cover letter, disclosures, or supplements", /cover.?letter|disclosure|supplement|投稿信|声明|补充材料/iu)
  ],
  review: [
    material("comments", "审稿意见", "reviewer comments", /reviewer|review.?report|审稿意见|外审意见|评审意见|审查意见/iu),
    material("decision", "编辑决定", "editor decision", /editor.?decision|decision.?letter|编辑决定|决定信|decision/iu),
    material("response", "逐条回复或返修说明", "point-by-point response", /response.?to|rebuttal|point.?by.?point|逐条回复|回复审稿|答辩/iu)
  ],
  archive: [
    material("acceptance", "录用通知", "acceptance notice", /accepted|acceptance|录用|接收函/iu),
    material("final", "最终版或正式发表版", "final or published version", /camera.?ready|published|publication|final.?version|最终版|正式发表/iu),
    material("repository", "DOI、数据代码或复现归档", "DOI, data/code, or reproducibility archive", /(^|\/)(archive|repository|reproducibility)(\/|$)|doi[^/]*\.(txt|md|json|ya?ml)$|复现包|数据归档|代码归档/iu)
  ]
});
var ARTIFACT_SCAN_QUERIES = Object.freeze([
  "proposal",
  "开题",
  "研究问题",
  "文献",
  ".bib",
  ".ris",
  ".enl",
  ".docx",
  "literature",
  "method",
  "protocol",
  "sample",
  "伦理",
  "data",
  "数据",
  ".csv",
  ".xlsx",
  "result",
  "结果",
  "figure",
  "draft",
  ".tex",
  ".pdf",
  "revision",
  "修订",
  "submission",
  "投稿",
  "review",
  "审稿",
  "decision",
  "accepted",
  "录用",
  "doi",
  ".md",
  ".txt",
  ".ipynb",
  ".py",
  ".r"
]);
var IDS = PAPER_STAGES.map((stage) => stage.id);
var STAGE_IDS = new Set(IDS);
var REQUIRED_WORKFLOW = ["topic", "literature", "design", "draft", "submission", "review", "archive"];
var WORKFLOW_PRESETS = Object.freeze({
  auto: { zh: "智能匹配", en: "Smart match", stages: null },
  empirical: { zh: "实证研究", en: "Empirical", stages: IDS },
  theoretical: { zh: "理论研究", en: "Theoretical", stages: ["topic", "literature", "design", "draft", "submission", "review", "archive"] },
  review: { zh: "综述论文", en: "Review paper", stages: ["topic", "literature", "design", "draft", "revision", "submission", "review", "archive"] },
  custom: { zh: "自定义", en: "Custom", stages: null }
});
var PUBLICATION_STANDARDS = Object.freeze({
  general: {
    zh: "通用学术规范",
    en: "General academic",
    weights: { topic: 10, literature: 14, design: 14, data: 10, analysis: 12, draft: 18, revision: 7, submission: 7, review: 5, archive: 3 },
    rubricZh: ["研究问题与贡献（20）", "文献与理论定位（15）", "方法严谨性（20）", "结果与论证（20）", "报告、伦理与可复现性（15）", "表达与规范（10）"],
    rubricEn: ["Question and contribution (20)", "Literature and positioning (15)", "Methodological rigor (20)", "Results and argument (20)", "Reporting, ethics, and reproducibility (15)", "Writing and compliance (10)"]
  },
  sci: {
    zh: "SCI 期刊",
    en: "SCI journal",
    weights: { topic: 8, literature: 12, design: 15, data: 12, analysis: 16, draft: 18, revision: 6, submission: 7, review: 4, archive: 2 },
    rubricZh: ["创新性与理论贡献（20）", "文献定位与引证质量（15）", "方法与统计严谨性（25）", "结果、讨论与局限（20）", "可复现性、伦理与数据透明（10）", "期刊规范与学术表达（10）"],
    rubricEn: ["Novelty and theoretical contribution (20)", "Positioning and citation quality (15)", "Methodological and statistical rigor (25)", "Results, discussion, and limitations (20)", "Reproducibility, ethics, and transparency (10)", "Journal compliance and scholarly writing (10)"]
  },
  ei: {
    zh: "EI 会议",
    en: "EI conference",
    weights: { topic: 8, literature: 9, design: 15, data: 10, analysis: 20, draft: 20, revision: 5, submission: 8, review: 3, archive: 2 },
    rubricZh: ["技术贡献与问题价值（20）", "方法、算法或系统设计（25）", "实验验证与对比（25）", "可复现性与工程完整性（10）", "表达、图表与篇幅效率（10）", "会议格式与匿名规范（10）"],
    rubricEn: ["Technical contribution and problem value (20)", "Method, algorithm, or system design (25)", "Experimental validation and comparisons (25)", "Reproducibility and engineering completeness (10)", "Writing, figures, and space efficiency (10)", "Conference formatting and anonymity (10)"]
  }
});
var SEARCH_WINDOWS = Object.freeze({
  recent2: { zh: "近 2 年 + 奠基文献", en: "Last 2 years + seminal work", years: 2 },
  recent5: { zh: "近 5 年 + 奠基文献", en: "Last 5 years + seminal work", years: 5 },
  all: { zh: "不限年份，强调最新进展", en: "All years, emphasize current work", years: 0 }
});
function normalizeWorkspaceKey(cwd) {
  if (typeof cwd !== "string") return "";
  return cwd.trim().replace(/\\/g, "/").replace(/\/+$/, "");
}
function workspaceName(cwd) {
  const key = normalizeWorkspaceKey(cwd);
  if (!key) return "";
  return key.split("/").filter(Boolean).at(-1) ?? key;
}
function normalizeWorkflow(value) {
  const selected = new Set(Array.isArray(value) ? value.filter((id) => STAGE_IDS.has(id)) : []);
  return IDS.filter((id) => selected.has(id));
}
function normalizeProjectState(value) {
  return {
    stage: STAGE_IDS.has(value?.stage) ? value.stage : "topic",
    updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : "",
    source: value?.source === "auto" || value?.source === "manual" ? value.source : "manual",
    lastScannedAt: typeof value?.lastScannedAt === "string" ? value.lastScannedAt : "",
    workflowMode: Object.hasOwn(WORKFLOW_PRESETS, value?.workflowMode) ? value.workflowMode : "auto",
    workflow: normalizeWorkflow(value?.workflow),
    standard: Object.hasOwn(PUBLICATION_STANDARDS, value?.standard) ? value.standard : "general",
    kickoffMode: ["auto", "local", "web", "hybrid"].includes(value?.kickoffMode) ? value.kickoffMode : "auto",
    researchTopic: typeof value?.researchTopic === "string" ? value.researchTopic.slice(0, 500) : "",
    researchBrief: typeof value?.researchBrief === "string" ? value.researchBrief.slice(0, 2e3) : "",
    searchWindow: Object.hasOwn(SEARCH_WINDOWS, value?.searchWindow) ? value.searchWindow : "recent5",
    researchMemory: typeof value?.researchMemory === "string" ? value.researchMemory.slice(0, 8e3) : "",
    venue: typeof value?.venue === "string" ? value.venue.slice(0, 500) : "",
    venueGuidelines: typeof value?.venueGuidelines === "string" ? value.venueGuidelines.slice(0, 2e3) : "",
    scanRoot: normalizeRelativeRoot(value?.scanRoot),
    excludedFolders: Array.isArray(value?.excludedFolders) ? value.excludedFolders.map(normalizeRelativeRoot).filter(Boolean).slice(0, 50) : [],
    assignments: Object.fromEntries(Object.entries(value?.assignments ?? {}).filter(([path, id]) => typeof path === "string" && isMaterialAssignment(id))),
    stageStates: Object.fromEntries(Object.entries(value?.stageStates ?? {}).filter(([id, state]) => STAGE_IDS.has(id) && ["not-started", "working", "review", "confirmed", "na"].includes(state))),
    tasks: Array.isArray(value?.tasks) ? value.tasks.filter((task) => task && typeof task.id === "string" && typeof task.sessionId === "string" && STAGE_IDS.has(task.stageId)).slice(0, 20).map((task) => ({
      id: task.id.slice(0, 100),
      sessionId: task.sessionId.slice(0, 200),
      stageId: task.stageId,
      status: ["awaiting", "running", "checking", "review", "failed", "confirmed"].includes(task.status) ? task.status : "review",
      startedAt: typeof task.startedAt === "string" ? task.startedAt : "",
      endSeq: Number.isFinite(task.endSeq) ? task.endSeq : 0,
      baseline: Array.isArray(task.baseline) ? task.baseline.filter((p) => typeof p === "string").slice(0, 2e3) : [],
      outputs: Array.isArray(task.outputs) ? task.outputs.filter((p) => typeof p === "string").slice(0, 2e3) : []
    })) : []
  };
}
function normalizeRelativeRoot(value) {
  if (typeof value !== "string") return "";
  const path = value.trim().replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
  if (/^(\/|[a-z]:)/i.test(path) || path.split("/").includes("..")) return "";
  return path === "." ? "" : path;
}
function isMaterialAssignment(id) {
  return id === "ignore" || Object.entries(STAGE_MATERIALS).some(([stage, items]) => items.some((item) => `${stage}:${item.id}` === id));
}
function updateProjectConfig(projects, cwd, patch) {
  const key = normalizeWorkspaceKey(cwd);
  if (!key) throw new TypeError("A workspace path is required");
  const previous = projects?.[key] && typeof projects[key] === "object" ? projects[key] : {};
  return { ...projects && typeof projects === "object" ? projects : {}, [key]: { ...previous, ...patch && typeof patch === "object" ? patch : {} } };
}
function analyzePaperArtifacts(candidates, scannedAt = "", options = {}) {
  const project = normalizeProjectState(options);
  const allPaths = [...new Set((Array.isArray(candidates) ? candidates : []).filter((candidate) => typeof candidate === "string" || candidate?.kind !== "directory").map((candidate) => typeof candidate === "string" ? candidate : candidate?.path).filter((value) => typeof value === "string" && value.trim()).map((value) => value.replace(/\\/g, "/")))].sort((a, b) => a.localeCompare(b));
  const paths = allPaths.filter((path) => {
    if (project.scanRoot && !path.startsWith(`${project.scanRoot}/`)) return false;
    if (project.excludedFolders.some((folder) => path === folder || path.startsWith(`${folder}/`))) return false;
    if (project.assignments[path] === "ignore") return false;
    if (project.assignments[path]) return true;
    if (/(^|\/)(node_modules|\.git|\.venv|venv|__pycache__|\.research-loom)(\/|$)/i.test(path)) return false;
    return !/\.(ya?ml|js|jsx|ts|tsx|map|lock)$/i.test(path);
  });
  const modules = {};
  for (const stage of PAPER_STAGES) {
    const checks = (STAGE_MATERIALS[stage.id] ?? []).map((definition) => {
      const artifacts = paths.filter((path) => project.assignments[path] ? project.assignments[path] === `${stage.id}:${definition.id}` : (!(stage.id === "draft") || /\.(md|txt|tex|docx?|pdf|rst)$/i.test(path)) && definition.rules.some((rule) => rule.test((project.scanRoot ? path.slice(project.scanRoot.length + 1) : path).split("/").slice(-2).join("/"))));
      return { id: definition.id, zh: definition.zh, en: definition.en, status: artifacts.length ? "found" : "missing", artifacts: artifacts.slice(0, 100) };
    });
    const foundCount = checks.filter((check) => check.status === "found").length;
    const allArtifacts = [...new Set(checks.flatMap((check) => check.artifacts))];
    modules[stage.id] = {
      status: foundCount === 0 ? "missing" : foundCount === checks.length ? "complete" : "partial",
      coverage: checks.length ? foundCount / checks.length : 0,
      materialChecks: checks,
      artifactCount: allArtifacts.length,
      artifacts: allArtifacts.slice(0, 8)
    };
  }
  const report = {
    stage: "topic",
    scannedAt: typeof scannedAt === "string" ? scannedAt : "",
    candidateCount: paths.length,
    sourceFiles: paths.slice(0, 2e3),
    allFiles: allPaths.slice(0, 2e3),
    excludedCount: allPaths.length - paths.length,
    modules
  };
  report.stage = currentStageForWorkflow(report, recommendWorkflow(report));
  return report;
}
function recommendWorkflow(report) {
  const optional = /* @__PURE__ */ new Set();
  for (const id of ["data", "analysis", "revision"]) if (report?.modules?.[id]?.status && report.modules[id].status !== "missing") optional.add(id);
  return IDS.filter((id) => REQUIRED_WORKFLOW.includes(id) || optional.has(id));
}
function isResearchKickoffRecommended(report) {
  if (!report || report.candidateCount === 0) return true;
  const modules = report.modules ?? {};
  return modules.topic?.status !== "complete" && modules.design?.status === "missing" && modules.data?.status === "missing" && modules.analysis?.status === "missing";
}
function resolveWorkflow(project, report) {
  const normalized = normalizeProjectState(project);
  let ids = normalized.workflowMode === "auto" ? recommendWorkflow(report) : normalized.workflowMode === "custom" ? normalized.workflow.length ? normalized.workflow : recommendWorkflow(report) : [...WORKFLOW_PRESETS[normalized.workflowMode]?.stages ?? recommendWorkflow(report)];
  const active = ids.filter((id) => normalized.stageStates[id] !== "na");
  return active.length ? active : ["topic"];
}
function nextResearchStage(report, workflow, project) {
  const states = normalizeProjectState(project).stageStates;
  return workflow.find((id) => states[id] === "working" || states[id] === "review") ?? workflow.find((id) => states[id] !== "confirmed") ?? workflow.at(-1) ?? "topic";
}
function projectHandoff(project, language = "zh") {
  const p = normalizeProjectState(project);
  const context = [p.researchTopic, p.researchBrief, p.researchMemory].filter(Boolean).join("\n");
  const confirmed = PAPER_STAGES.filter((stage) => p.stageStates[stage.id] === "confirmed").map((stage) => stage[language]).join(", ");
  return language === "zh" ? `项目背景与研究者记录（仍须根据材料核验）：
${context || "尚未记录"}
研究者确认的阶段：${confirmed || "无"}
具体投稿目标：${p.venue || "未指定"}
作者指南来源/要求：${p.venueGuidelines || "未提供；不能把 SCI/EI 当作统一期刊规范"}
如涉及投稿符合度，请核验指南来源与更新时间；证据不足的项目标为待评估。
请在结束时列出本次实际产物路径、结论依据、尚未解决问题与下一步建议；需要落盘时创建新版本，不覆盖原材料。` : `Researcher context (verify against sources):
${context || "Not recorded"}
Researcher-confirmed stages: ${confirmed || "None"}
Target venue: ${p.venue || "Unspecified"}
Author guidelines/source: ${p.venueGuidelines || "Not supplied; SCI/EI are not uniform venue rules"}
Verify guideline source and date; mark unsupported assessments as pending. End with actual output paths, evidence, unresolved questions and next steps. Create new versions when saving files.`;
}
function collectTaskOutputs(task, report) {
  const baseline = new Set(task.baseline ?? []);
  return [.../* @__PURE__ */ new Set([...task.outputs ?? [], ...report.sourceFiles.filter((path) => !baseline.has(path))])];
}
function taskExecutionStatus(task, { running, endSeq = 0, promptFailed = false, lastAgentError = null }) {
  if (!["awaiting", "running"].includes(task.status)) return task.status;
  if (promptFailed) return "failed";
  if (running) return "running";
  if (task.status === "running" || endSeq > task.endSeq) return lastAgentError ? "failed" : "checking";
  return task.status;
}
function exportProjectSnapshot(project) {
  return { format: "research-loom-project", version: 1, project: { ...normalizeProjectState(project), tasks: [] } };
}
function importProjectSnapshot(value) {
  if (value?.format !== "research-loom-project" || value.version !== 1 || !value.project || typeof value.project !== "object" || Array.isArray(value.project)) throw new Error("Invalid project snapshot");
  return normalizeProjectState({ ...value.project, tasks: [] });
}
function currentStageForWorkflow(report, workflow) {
  const active = normalizeWorkflow(workflow);
  let current = active[0] ?? "topic";
  for (const id of active) {
    const module2 = report?.modules?.[id];
    if (!module2?.status || module2.status === "missing") continue;
    if (id === "archive") {
      const conclusive = module2.materialChecks?.some((check) => ["acceptance", "final"].includes(check.id) && check.status === "found");
      if (!conclusive) continue;
    }
    current = id;
  }
  return current;
}
function scorePaperMaterials(report, workflow, standardId = "general") {
  const active = normalizeWorkflow(workflow);
  const standard = PUBLICATION_STANDARDS[standardId] ?? PUBLICATION_STANDARDS.general;
  const totalWeight = active.reduce((sum, id) => sum + (standard.weights[id] ?? 1), 0) || 1;
  const weighted = active.reduce((sum, id) => sum + (standard.weights[id] ?? 1) * (report?.modules?.[id]?.coverage ?? 0), 0);
  const checks = active.flatMap((id) => report?.modules?.[id]?.materialChecks ?? []);
  return { score: Math.round(weighted / totalWeight * 100), found: checks.filter((check) => check.status === "found").length, missing: checks.filter((check) => check.status === "missing").length, total: checks.length, standard: standardId };
}
function suggestModulePrompt(stageId, moduleReport, standardId = "general", language = "zh") {
  const stage = PAPER_STAGES.find((item) => item.id === stageId) ?? PAPER_STAGES[0];
  const standard = PUBLICATION_STANDARDS[standardId] ?? PUBLICATION_STANDARDS.general;
  const missing = (moduleReport?.materialChecks ?? []).filter((item) => item.status === "missing");
  const existing = (moduleReport?.materialChecks ?? []).filter((item) => item.status === "found");
  const labels = (items, key) => items.map((item) => item[key]).join("、");
  if (language === "en") {
    if (!existing.length) return `No ${stage.en} evidence is currently visible. Inspect the workspace first, then draft the missing ${labels(missing, "en")} under the ${standard.en} standard, marking every assumption and item that requires researcher confirmation.`;
    if (missing.length) return `Audit the existing ${labels(existing, "en")}, then complete the missing ${labels(missing, "en")} under the ${standard.en} standard. Prioritize the highest-risk gap and keep all recommendations traceable to file evidence.`;
    return `All expected ${stage.en} material types are visible. Read them and perform a ${standard.en} quality audit for consistency, rigor, traceability, and submission risk; return prioritized, directly actionable revisions.`;
  }
  if (!existing.length) return `当前未发现【${stage.zh}】的明确材料。请先检查工作区，再按“${standard.zh}”要求起草缺失的${labels(missing, "zh")}，所有假设和需要研究者确认之处必须显式标注。`;
  if (missing.length) return `请先审查已有的${labels(existing, "zh")}，再按“${standard.zh}”要求补齐${labels(missing, "zh")}。优先处理风险最高的缺口，所有建议必须可追溯到文件证据。`;
  return `【${stage.zh}】的预期材料类型已齐全。请读取材料并按“${standard.zh}”进行一致性、严谨性、可追溯性和投稿风险审计，给出有优先级、可直接执行的修订方案。`;
}
function mention(path) {
  return /[\s"]/u.test(path) ? `@"${path.replace(/"/g, "")}"` : `@${path}`;
}
function buildResearchKickoffPrompt(mode, options = {}) {
  if (mode === "hybrid") return [
    buildResearchKickoffPrompt("local", options),
    options.language === "en" ? "Then search online specifically for gaps in the supplied literature; merge and deduplicate sources, retaining provenance and clearly separating read full texts from abstracts." : "然后针对已有文献暴露的缺口补充联网检索，合并去重，保留本地与在线来源标记，区分已读全文与仅有摘要。",
    buildResearchKickoffPrompt("web", options)
  ].join("\n\n");
  const language = options.language === "en" ? "en" : "zh";
  const selectedMode = mode === "local" ? "local" : "web";
  const standardId = Object.hasOwn(PUBLICATION_STANDARDS, options.standardId) ? options.standardId : "general";
  const standard = PUBLICATION_STANDARDS[standardId];
  const topic = typeof options.topic === "string" ? options.topic.trim() : "";
  const brief = typeof options.brief === "string" ? options.brief.trim() : "";
  const projectName = workspaceName(options.cwd) || (language === "zh" ? "当前研究项目" : "current research project");
  const sourceFiles = [...new Set((Array.isArray(options.sourceFiles) ? options.sourceFiles : []).filter((path) => typeof path === "string" && path.trim()))].slice(0, 60);
  const sourceList = sourceFiles.length ? sourceFiles.map((path) => `- ${mention(path)}`).join("\n") : language === "zh" ? "- 未扫描到候选资料。" : "- No candidate source was detected.";
  const searchWindow = SEARCH_WINDOWS[options.searchWindow] ?? SEARCH_WINDOWS.recent5;
  const today = /^\d{4}-\d{2}-\d{2}/u.exec(String(options.currentDate ?? ""))?.[0] || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  if (language === "en") {
    const topicLine2 = topic || "Not specified. Ask no more than five high-information questions before searching.";
    const briefLine2 = brief || "No additional constraints supplied.";
    if (selectedMode === "local") return [
      `Start the research project "${projectName}" by organizing and analyzing researcher-supplied literature under the ${standard.en} target.`,
      `Research topic or tentative question: ${topicLine2}
Researcher priorities/constraints: ${briefLine2}`,
      "Candidate workspace sources (read each relevant file before making claims):",
      sourceList,
      "Work in this order: (1) inventory the files and flag duplicates, unreadable items, and missing metadata; (2) build a traceable literature matrix with title, authors, year, venue, DOI/URL, method/data, principal finding, claimed novelty, limitations, and exact file/page evidence; (3) synthesize agreements, conflicts, methodological patterns, and gaps across papers rather than merely summarizing them one by one; (4) propose 3–5 research directions, each with novelty basis, falsifiable question, feasible method/data, expected contribution, risks, and the sources that support the gap; (5) recommend a prioritized next-step research plan.",
      "Archiving rule: propose a folder/naming scheme and create only non-destructive derived indexes or notes. Do not move, rename, delete, or overwrite source papers without explicit confirmation.",
      "Academic integrity: distinguish file evidence from inference; never invent bibliographic metadata, citations, findings, novelty, or access to unread content. Mark unverifiable fields explicitly and cite exact workspace paths for every material claim."
    ].join("\n\n");
    return [
      `Launch an online literature discovery for the research project "${projectName}" under the ${standard.en} target. Current date: ${today}.`,
      `Research topic or tentative question: ${topicLine2}
Researcher priorities/constraints: ${briefLine2}
Search window: ${searchWindow.en}.`,
      topic ? "Use the available web/research tools and the installed deep-research capability. Search multiple scholarly sources with reproducible English and relevant non-English queries." : "The topic is too underspecified for a defensible search. First ask no more than five high-information questions covering the phenomenon/problem, population or application, desired contribution, constraints, and acceptable methods. Do not fabricate a search while waiting for answers.",
      "When a search can proceed: record databases/services, exact query strings, filters, and search date; prioritize peer-reviewed and primary sources while clearly labeling preprints; verify title, authors, year, venue, DOI or stable URL from authoritative pages; never infer a paper from a search snippet or treat an abstract as full-text evidence.",
      "Return: (1) search log and inclusion criteria; (2) verified literature landscape; (3) convergent findings, disputes, and evidence gaps; (4) 3–5 candidate directions scored for novelty, importance, feasibility, data/method requirements, and risk; (5) a recommended research question and phased plan. Separate recent opportunities from established background and state all unavailable evidence."
    ].join("\n\n");
  }
  const topicLine = topic || "尚未明确。开始检索前，先提出不超过 5 个高信息量澄清问题。";
  const briefLine = brief || "未提供额外约束。";
  if (selectedMode === "local") return [
    `请为研究项目“${projectName}”启动课题研究，整理并分析研究者自主提供的文献资料，目标标准为“${standard.zh}”。`,
    `研究主题或暂定问题：${topicLine}
研究者的重点与约束：${briefLine}`,
    "工作区候选资料如下（作出任何判断前必须读取相关文件）：",
    sourceList,
    "请依次完成：（1）建立文件清单，标记重复项、无法读取项和缺失元数据；（2）建立可追溯文献矩阵，至少包含题名、作者、年份、来源、DOI/URL、方法与数据、主要结论、作者声称的创新点、局限，以及精确文件路径/页码证据；（3）进行跨论文综合，梳理共识、冲突、方法模式和研究缺口，不能只逐篇摘要；（4）提出 3–5 个候选研究方向，逐项说明创新依据、可证伪问题、可行方法与数据、预期贡献、风险和支撑该缺口的来源；（5）给出有优先级的后续研究计划。",
    "归档规则：先提出目录与命名方案，只能创建非破坏性的衍生索引或笔记；未经明确确认，不得移动、重命名、删除或覆盖原始论文。",
    "学术规范：明确区分文件证据与推断；不得编造书目信息、引文、结论、创新点或声称读过未读取的内容；无法核验的字段必须明确标注，所有材料性结论须引用精确工作区路径。"
  ].join("\n\n");
  return [
    `请为研究项目“${projectName}”启动在线文献检索与方向发现，目标标准为“${standard.zh}”。当前日期：${today}。`,
    `研究主题或暂定问题：${topicLine}
研究者的重点与约束：${briefLine}
检索时间窗：${searchWindow.zh}。`,
    topic ? "请使用当前可用的网页/研究工具，并优先调用已安装的 deep-research 能力；同时使用可复现的英文检索式和相关中文检索式，在多个学术来源中交叉检索。" : "当前主题不足以支持严谨检索。请先提出不超过 5 个高信息量问题，覆盖研究现象/问题、对象或应用场景、期望贡献、现实约束和可接受方法；获得回答前不得虚构检索过程。",
    "可以检索后必须记录：数据库或服务、完整检索式、筛选条件与检索日期；优先同行评审和一手来源，预印本须单独标注；题名、作者、年份、来源、DOI 或稳定链接必须经权威页面核验；不得根据搜索摘要臆测论文，也不得把摘要当作全文证据。",
    "请输出：（1）检索日志和纳入标准；（2）经核验的研究版图；（3）共识、争议和证据缺口；（4）3–5 个候选方向，并按创新性、重要性、可行性、数据/方法需求和风险评分；（5）推荐研究问题与分阶段计划。必须区分最新机会与经典背景，并明确列出无法获得或无法核验的证据。"
  ].join("\n\n");
}
function buildModulePrompt(stageId, options = {}) {
  const stage = PAPER_STAGES.find((item) => item.id === stageId) ?? PAPER_STAGES[0];
  const language = options.language === "en" ? "en" : "zh";
  const standardId = Object.hasOwn(PUBLICATION_STANDARDS, options.standardId) ? options.standardId : "general";
  const standard = PUBLICATION_STANDARDS[standardId];
  const moduleReport = options.moduleReport ?? { status: "missing", materialChecks: [], artifacts: options.artifacts ?? [] };
  const artifacts = Array.isArray(moduleReport.artifacts) ? moduleReport.artifacts : [];
  const task = typeof options.userPrompt === "string" && options.userPrompt.trim() ? options.userPrompt.trim() : suggestModulePrompt(stage.id, moduleReport, standardId, language);
  const projectName = workspaceName(options.cwd) || (language === "zh" ? "当前论文项目" : "current paper project");
  const evidence = artifacts.length ? artifacts.map((path) => `- ${mention(path)}`).join("\n") : language === "zh" ? "- 未自动发现明确产物，请先检查工作区并说明缺失项。" : "- No explicit artifact was detected; inspect the workspace and identify missing items first.";
  const missing = (moduleReport.materialChecks ?? []).filter((item) => item.status === "missing").map((item) => item[language]).join("、") || (language === "zh" ? "无" : "None");
  if (language === "en") return [
    `Paper project: "${projectName}". Module: ${stage.en}. Target standard: ${standard.en}.`,
    `Quality gate: ${stage.nextEn}. Missing material types: ${missing}.`,
    "Matched workspace evidence (read relevant files before judging):",
    evidence,
    `Task: ${task}`,
    "Requirements: distinguish observed evidence from inference; never invent citations, data, results, or review decisions; cite file paths for findings; report missing evidence explicitly; do not overwrite files unless asked."
  ].join("\n\n");
  return [
    `论文项目：“${projectName}”。模块：【${stage.zh}】。目标标准：“${standard.zh}”。`,
    `本阶段质量门：${stage.nextZh}。当前缺失材料类型：${missing}。`,
    "自动匹配的工作区证据如下（作出判断前请读取相关文件）：",
    evidence,
    `任务：${task}`,
    "学术规范：明确区分文件证据与推断；不得编造引文、数据、结果或审稿决定；结论须引用对应文件路径；证据不足时明确列出缺失项；未经明确要求不得覆盖现有文件。"
  ].join("\n\n");
}
function buildEvaluationPrompt(report, workflow, standardId = "general", language = "zh", cwd = "") {
  const standard = PUBLICATION_STANDARDS[standardId] ?? PUBLICATION_STANDARDS.general;
  const active = normalizeWorkflow(workflow);
  const lines = active.map((id) => {
    const stage = PAPER_STAGES.find((item) => item.id === id);
    const module2 = report?.modules?.[id];
    const found = (module2?.materialChecks ?? []).filter((item) => item.status === "found").map((item) => item[language]).join("、") || (language === "zh" ? "无" : "None");
    const missing = (module2?.materialChecks ?? []).filter((item) => item.status === "missing").map((item) => item[language]).join("、") || (language === "zh" ? "无" : "None");
    const refs = (module2?.artifacts ?? []).map(mention).join("、") || (language === "zh" ? "无" : "None");
    return language === "zh" ? `- ${stage.zh}：已有 ${found}；缺失 ${missing}；证据 ${refs}` : `- ${stage.en}: found ${found}; missing ${missing}; evidence ${refs}`;
  }).join("\n");
  const rubric = (language === "zh" ? standard.rubricZh : standard.rubricEn).map((item) => `- ${item}`).join("\n");
  if (language === "en") return [
    `Perform a deep academic quality assessment of the "${workspaceName(cwd) || "current paper project"}" against the ${standard.en} standard.`,
    "The path-only inventory below is a navigation aid, not a quality score. Read the relevant source files before assigning any points:",
    lines,
    "Transparent 100-point rubric:",
    rubric,
    "Return: (1) total and category scores; (2) evidence with exact file paths; (3) missing or unverifiable evidence; (4) submission risks; (5) prioritized next actions. Distinguish evidence from inference, do not invent citations/data/results/decisions, and state when a criterion cannot be scored. Do not overwrite files unless asked."
  ].join("\n\n");
  return [
    `请对论文项目“${workspaceName(cwd) || "当前论文项目"}”按“${standard.zh}”进行深度学术质量评分。`,
    "以下内容仅是路径级材料清单，不是质量分。打分前必须读取相关源文件：",
    lines,
    "透明的 100 分量表：",
    rubric,
    "请输出：（1）总分与分项分；（2）带精确文件路径的证据；（3）缺失或无法核验的证据；（4）投稿风险；（5）按优先级排列的后续操作。必须区分证据与推断，不得编造引文、数据、结果或审稿决定；无法判断的项目须明确标为“不可评分”。未经明确要求不得覆盖文件。"
  ].join("\n\n");
}

// src/workbench-panels.js
var React = __toESM(require("react"), 1);
var h = React.createElement;
var box = { display: "grid", gap: 12, border: "1px solid var(--dsw-alias-border-l2, #dde1e8)", borderRadius: 12, padding: 14 };
var field = { boxSizing: "border-box", width: "100%", padding: "9px 10px", font: "inherit", color: "inherit", background: "var(--dsw-alias-bg-layer-1, #fff)", border: "1px solid #cbd0da", borderRadius: 8 };
var button = { ...field, width: "auto", cursor: "pointer", fontSize: 13 };
var STAGE_LABELS = {
  auto: ["自动 · 待核验", "Auto · unverified"],
  "not-started": ["未开始", "Not started"],
  working: ["进行中", "In progress"],
  review: ["待核验", "To verify"],
  confirmed: ["研究者已确认", "Researcher confirmed"],
  na: ["不适用", "Not applicable"]
};
var TASK_LABELS = { awaiting: ["等待执行 / 尚未确认接收", "Awaiting execution"], running: ["对话正在执行", "Conversation running"], checking: ["正在检查产物", "Checking outputs"], review: ["待检查结果", "Review results"], failed: ["执行失败 · 请查看对话", "Failed · inspect conversation"], confirmed: ["研究者已验收", "Researcher accepted"] };
function Editor({ label, value, onSave, multiline = false }) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);
  return h(
    "label",
    { style: { display: "grid", gap: 6 } },
    label,
    h(multiline ? "textarea" : "input", {
      "aria-label": label,
      style: field,
      value: draft,
      rows: multiline ? 4 : void 0,
      onChange: (e) => setDraft(e.target.value),
      onBlur: () => {
        if (draft !== value) void onSave(draft);
      }
    })
  );
}
function StageControl({ stageId, project, saveConfig, language, allowNA = true }) {
  const en = language === "en";
  return h(
    "label",
    { style: { display: "grid", gap: 6 } },
    en ? "Research status" : "研究状态（独立于材料清单）",
    project.stageStates[stageId] === "na" ? h("strong", null, PAPER_STAGES.find((stage) => stage.id === stageId)[language]) : null,
    h(
      "select",
      {
        style: field,
        "aria-label": en ? "Research status" : "研究状态",
        value: project.stageStates[stageId] ?? "auto",
        onChange: (e) => {
          const state = e.target.value;
          void saveConfig((latest) => {
            const next = { ...latest.stageStates };
            if (state === "auto") delete next[stageId];
            else next[stageId] = state;
            return { stageStates: next };
          });
        }
      },
      Object.entries(STAGE_LABELS).filter(([id]) => id !== "na" || allowNA).map(([id, text]) => h("option", { key: id, value: id }, text[en ? 1 : 0]))
    )
  );
}
function OverviewPanel({ project, report, workflow, nextStage, onStage, saveConfig, checkResults, language }) {
  const en = language === "en";
  const stage = PAPER_STAGES.find((s) => s.id === nextStage);
  const gaps = report.modules[nextStage].materialChecks.filter((m) => m.status === "missing");
  const complete = workflow.filter((id) => project.stageStates[id] === "confirmed").length;
  return h(
    "div",
    { style: { display: "grid", gap: 14 }, "data-testid": "workbench-overview" },
    h(
      "section",
      { style: box },
      h("strong", null, en ? "Next recommended step" : "下一步建议"),
      h("span", { style: { fontSize: 19, fontWeight: 650 } }, stage[language]),
      h("span", null, stage[en ? "nextEn" : "nextZh"]),
      h("span", null, `${en ? "Researcher-confirmed stages" : "已确认阶段"} ${complete}/${workflow.length}`),
      h("span", null, gaps.length ? `${en ? "Not yet found: " : "尚未发现："}${gaps.map((m) => m[language]).join("、")}` : en ? "Expected material types found; verify content before confirming." : "预期材料类型已发现，请核验内容后再确认阶段。"),
      h("button", { style: button, onClick: () => onStage(nextStage) }, en ? "Open module" : "查看并推进此模块")
    ),
    h(
      "section",
      { style: box },
      h("strong", null, en ? "Research context" : "项目记忆"),
      h(Editor, { label: en ? "Research topic" : "研究主题", value: project.researchTopic, onSave: (researchTopic) => saveConfig({ researchTopic }) }),
      h(Editor, { label: en ? "Confirmed decisions and unresolved questions" : "已确定方向、关键结论与待解决问题", value: project.researchMemory, multiline: true, onSave: (researchMemory) => saveConfig({ researchMemory }) }),
      h("small", null, en ? "Saved context accompanies subsequent module tasks." : "保存后会随后续模块任务一起提交，作为研究者记录供模型核验。")
    ),
    h(
      "section",
      { style: box },
      h("strong", null, en ? "Recent tasks" : "最近任务"),
      !project.tasks.length ? h("span", null, en ? "Tasks started from this workbench will appear here." : "从工作台启动任务后，这里会记录执行状态和新增候选产物。") : null,
      project.tasks.slice(0, 6).map((task) => h(
        "article",
        { key: task.id, style: { display: "grid", gap: 7, borderTop: "1px solid #ddd", paddingTop: 10 } },
        h("strong", null, `${PAPER_STAGES.find((s) => s.id === task.stageId)[language]} · ${TASK_LABELS[task.status][en ? 1 : 0]}`),
        h("small", null, `${task.startedAt} · ${en ? "Session" : "会话"} ${task.sessionId.slice(0, 8)}`),
        h("span", null, task.outputs.length ? `${en ? "New candidates" : "新增候选文件"}：${task.outputs.length}` : en ? "No new path recorded. Check conversation for in-place edits or text results." : "未记录新增路径；原文件修改或纯对话结果请在对话中检查。"),
        task.outputs.slice(0, 8).map((path) => h("code", { key: path, style: { overflowWrap: "anywhere" } }, path)),
        h(
          "div",
          { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
          h("button", { style: button, disabled: task.status === "running", onClick: () => checkResults(task.id) }, en ? "Check outputs" : "检查产物"),
          h("button", { style: button, disabled: ["awaiting", "running", "checking", "confirmed"].includes(task.status), onClick: () => saveConfig((latest) => ({ tasks: latest.tasks.map((item) => item.id === task.id ? { ...item, status: "confirmed" } : item) })) }, en ? "Accept result" : "验收结果")
        )
      )),
      h("small", null, en ? "New paths are candidates, not proof of completion or authorship. Accepting a task does not confirm a whole stage." : "新增路径是候选产物，不代表任务已完成或由该任务生成；验收任务不会自动确认整个阶段。")
    ),
    h(
      "details",
      { style: box },
      h("summary", { style: { cursor: "pointer" } }, en ? "Target venue and author guidelines" : "具体投稿目标与作者指南"),
      h(Editor, { label: en ? "Journal or conference" : "期刊或会议名称", value: project.venue, onSave: (venue) => saveConfig({ venue }) }),
      h(Editor, { label: en ? "Guidelines URL, date and requirements" : "指南链接、日期与关键要求", value: project.venueGuidelines, multiline: true, onSave: (venueGuidelines) => saveConfig({ venueGuidelines }) }),
      h("small", null, en ? "SCI/EI presets are advisory rubrics, not a venue compliance certification." : "SCI/EI 预设是建议量表；具体投稿符合度需核验目标刊会的作者指南。")
    )
  );
}
function MaterialsPanel({ project, report, saveConfig, rescan, scanning, language, fillFile }) {
  const en = language === "en";
  const [query, setQuery] = React.useState("");
  const [limit, setLimit] = React.useState(30);
  const [error, setError] = React.useState("");
  const files = report.allFiles.filter((path) => path.toLowerCase().includes(query.toLowerCase()));
  const active = new Set(report.sourceFiles);
  return h(
    "section",
    { style: { display: "grid", gap: 12 }, "data-testid": "workbench-materials" },
    h("p", { style: { margin: 0 } }, en ? "Path/type inventory only. Content has not been verified. Manual classification does not mean the file was read." : "这是路径与类型清单，尚未核验正文。手动归类也不代表已读取或验证内容。"),
    h(
      "details",
      { style: box },
      h("summary", { style: { cursor: "pointer" } }, en ? "Scan scope" : "扫描范围与排除目录"),
      h(Editor, { label: en ? "Paper subfolder (blank = workspace)" : "论文子目录（留空为整个工作区）", value: project.scanRoot, onSave: (value) => {
        const scanRoot = normalizeRelativeRoot(value);
        if (value.trim() && value.trim() !== "." && !scanRoot) {
          setError(en ? "Use a workspace-relative subfolder." : "请输入工作区内相对子目录，不支持绝对路径或 ..。");
          return;
        }
        setError("");
        return saveConfig({ scanRoot });
      } }),
      h(Editor, { label: en ? "Excluded subfolders, one per line" : "排除子目录，每行一个", multiline: true, value: project.excludedFolders.join("\n"), onSave: (value) => {
        const lines = value.split("\n").map((s) => s.trim()).filter(Boolean);
        if (lines.some((s) => !normalizeRelativeRoot(s))) {
          setError(en ? "Invalid relative folder." : "排除目录必须是有效的相对路径。");
          return;
        }
        setError("");
        return saveConfig({ excludedFolders: lines.map(normalizeRelativeRoot) });
      } })
    ),
    error ? h("p", { role: "alert" }, error) : null,
    h(
      "div",
      { style: { display: "flex", gap: 8, alignItems: "center" } },
      h("span", null, `${en ? "Included" : "纳入"} ${report.candidateCount} · ${en ? "Excluded" : "排除"} ${report.excludedCount}`),
      h("button", { style: button, disabled: scanning, onClick: rescan }, en ? "Rescan" : "重新扫描")
    ),
    h("input", { style: field, type: "search", "aria-label": en ? "Find materials" : "搜索材料", placeholder: en ? "Filter by filename" : "按文件名筛选", value: query, onChange: (e) => {
      setQuery(e.target.value);
      setLimit(30);
    } }),
    files.slice(0, limit).map((path) => {
      const matches = Object.entries(report.modules).flatMap(([id, module2]) => module2.materialChecks.filter((m) => m.artifacts.includes(path)).map((m) => `${PAPER_STAGES.find((s) => s.id === id)[language]} · ${m[language]}`));
      return h(
        "article",
        { key: path, style: box },
        h("strong", { style: { overflowWrap: "anywhere" } }, path),
        h("small", null, !active.has(path) ? en ? "Excluded" : "已排除" : project.assignments[path] ? en ? "Manually classified · content unverified" : "人工归类 · 正文待核验" : en ? "Path match · content unverified" : "路径匹配 · 正文待核验"),
        h("span", null, matches.join("；") || (en ? "No material type matched" : "尚未匹配具体材料类型")),
        h(
          "select",
          { style: field, "aria-label": `${en ? "Classify" : "归类"} ${path}`, value: project.assignments[path] ?? "auto", onChange: (e) => {
            const value = e.target.value;
            void saveConfig((latest) => {
              const assignments = { ...latest.assignments };
              if (value === "auto") delete assignments[path];
              else assignments[path] = value;
              return { assignments };
            });
          } },
          h("option", { value: "auto" }, en ? "Automatic" : "自动匹配"),
          h("option", { value: "ignore" }, en ? "Exclude file" : "排除此文件"),
          PAPER_STAGES.map((stage) => h("optgroup", { key: stage.id, label: stage[language] }, STAGE_MATERIALS[stage.id].map((m) => h("option", { key: m.id, value: `${stage.id}:${m.id}` }, m[language]))))
        ),
        active.has(path) ? h("button", { style: button, onClick: () => fillFile(path) }, en ? "Prepare content review" : "填入材料核验任务") : null
      );
    }),
    !files.length ? h("p", null, en ? "No matching candidate files." : "没有匹配的候选文件。") : null,
    files.length > limit ? h("button", { style: button, onClick: () => setLimit((n) => n + 30) }, en ? "Show more" : "显示更多") : null
  );
}
function ProjectTransfer({ project, saveConfig, language }) {
  const [message, setMessage] = React.useState("");
  const [pending, setPending] = React.useState(null);
  const en = language === "en";
  return h(
    "details",
    { style: box },
    h("summary", { style: { cursor: "pointer" } }, en ? "Export / import project memory" : "导出 / 导入项目记忆"),
    h("p", null, en ? "Save the JSON with your paper for migration. Source documents and session task logs are not included." : "将 JSON 和论文一起保存，换电脑后可以导入。快照不含论文正文及会话任务记录。"),
    h("button", { style: button, onClick: () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(exportProjectSnapshot(project), null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "research-loom-project.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1e3);
    } }, en ? "Export project memory" : "导出项目记忆"),
    h(
      "label",
      { style: { display: "grid", gap: 8 } },
      en ? "Choose a snapshot to preview" : "选择快照并预览",
      h("input", { type: "file", accept: ".json", "aria-label": en ? "Import project memory" : "导入项目记忆", onChange: async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          if (file.size > 2e6) throw new Error("too large");
          setPending(importProjectSnapshot(JSON.parse(await file.text())));
          setMessage("");
        } catch {
          setPending(null);
          setMessage(en ? "Invalid snapshot or larger than 2 MB." : "快照格式无效，或文件超过 2 MB。");
        }
        e.target.value = "";
      } })
    ),
    pending ? h(
      "div",
      { style: box },
      h("span", null, `${en ? "Topic" : "主题"}：${pending.researchTopic || "—"}`),
      h("span", null, en ? "Applying replaces project preferences, classifications and memory; current task history is preserved." : "应用后将替换本项目偏好、归类和记忆；保留当前任务记录。"),
      h("button", { style: button, onClick: async () => {
        if (await saveConfig({ ...pending, tasks: project.tasks }) !== false) {
          setPending(null);
          setMessage(en ? "Imported." : "已导入。");
        }
      } }, en ? "Apply snapshot" : "应用此快照"),
      h("button", { style: button, onClick: () => setPending(null) }, en ? "Cancel" : "取消")
    ) : null,
    message ? h("p", { role: "status" }, message) : null
  );
}

// src/client.js
var inject = ["slots", "settingsScope", "remote", "remote.fileReferences", "layout"];
var SETTINGS_NAMESPACE = "academic-research";
var settingsWrites = Promise.resolve();
var copy = {
  zh: {
    title: "Academic Research Skills",
    description: "学术研究、论文写作、同行评审与完整学术流水线",
    enabled: "功能已启用",
    disabled: "功能已停用",
    live: "实时生效",
    saving: "正在保存设置……",
    hintEnabled: "4 个核心技能和 16 个 /ars-* 命令已加入技能目录。",
    hintDisabled: "技能已从目录注销；配置卡片仍保留，可随时重新启用。",
    readOnly: "当前设置文档不可写。",
    workbench: "论文工作台",
    autoStage: "建议推进",
    workflow: "论文流程",
    standard: "目标标准",
    openWorkbench: "打开论文工作台",
    closeWorkbench: "收起论文工作台",
    materialScore: "材料完整度初评",
    scoreNote: "基于文件路径与类型，不代表论文质量",
    found: "已有",
    missing: "缺失",
    scanning: "正在扫描论文材料…",
    scanDone: "路径扫描完成",
    scanError: "扫描失败，显示上次结果",
    rescan: "重新扫描",
    current: "当前",
    inspect: "查看模块",
    module: "模块状态",
    qualityGate: "本阶段质量门",
    smartPrompt: "智能任务建议",
    restore: "恢复智能建议",
    evidence: "匹配到的文件证",
    noEvidence: "尚未匹配到明确文件",
    fill: "填入对话框",
    generate: "生成模块结果",
    deepScore: "按此标准深度评分",
    adjust: "调整流程",
    customHelp: "自定义启用的阶段；顺序按论文规范自动排列。",
    submitted: "任务已提交到当前对话",
    sendError: "任务提交失败",
    generating: "正在提交…",
    complete: "材料齐全",
    partial: "部分具备",
    empty: "尚未发现",
    candidates: "个候选文件",
    kickoff: "课题起步",
    kickoffHint: "空白或早期项目可从已有资料或在线检索开始",
    localStart: "整理已有资料",
    webStart: "在线检索资料",
    topicInput: "研究主题或暂定问题",
    topicPlaceholder: "例如：医学影像少样本分类；可留空，由助手先提问澄清",
    briefInput: "研究重点与约束（可选）",
    briefPlaceholder: "研究对象、可用数据、偏好方法、时间或投稿要求",
    searchWindow: "检索时间窗",
    localFiles: "候选资料",
    putFiles: "请把 PDF、DOCX、BIB 或 RIS 放入当前工作区，然后重新扫描。",
    kickoffFill: "填入起步任务",
    kickoffRun: "启动课题研究",
    noMove: "只生成非破坏性索引；不会自动移动或改名原始论文。"
  },
  en: {
    title: "Academic Research Skills",
    description: "Research, paper writing, peer review, and the full academic pipeline",
    enabled: "Enabled",
    disabled: "Disabled",
    live: "Applies immediately",
    saving: "Saving…",
    hintEnabled: "4 core skills and 16 /ars-* commands are available.",
    hintDisabled: "Skills are removed; this card remains available.",
    readOnly: "Settings are read-only.",
    workbench: "Paper workbench",
    autoStage: "Next step",
    workflow: "Workflow",
    standard: "Target standard",
    openWorkbench: "Open paper workbench",
    closeWorkbench: "Collapse paper workbench",
    materialScore: "Material completeness",
    scoreNote: "Based on path/type evidence; not a paper-quality score",
    found: "Found",
    missing: "Missing",
    scanning: "Scanning paper materials…",
    scanDone: "Path scan complete",
    scanError: "Scan failed; showing the last result",
    rescan: "Rescan",
    current: "Current",
    inspect: "Inspect module",
    module: "Module status",
    qualityGate: "Quality gate",
    smartPrompt: "Smart task suggestion",
    restore: "Restore smart suggestion",
    evidence: "Matched files",
    noEvidence: "No explicit file was matched",
    fill: "Fill composer",
    generate: "Generate module result",
    deepScore: "Run deep assessment",
    adjust: "Adjust workflow",
    customHelp: "Enable custom stages; academic order is preserved.",
    submitted: "Task submitted to the current conversation",
    sendError: "Could not submit task",
    generating: "Submitting…",
    complete: "Complete",
    partial: "Partial",
    empty: "Not found",
    candidates: "candidate files",
    kickoff: "Research kickoff",
    kickoffHint: "Start an empty or early project from supplied sources or online discovery",
    localStart: "Organize supplied sources",
    webStart: "Discover sources online",
    topicInput: "Research topic or tentative question",
    topicPlaceholder: "Example: few-shot classification in medical imaging; leave blank for guided clarification",
    briefInput: "Priorities and constraints (optional)",
    briefPlaceholder: "Population, available data, methods, timeline, or venue needs",
    searchWindow: "Search window",
    localFiles: "candidate sources",
    putFiles: "Add PDF, DOCX, BIB, or RIS files to this workspace, then rescan.",
    kickoffFill: "Fill kickoff task",
    kickoffRun: "Start research",
    noMove: "Creates non-destructive indexes only; source papers are never moved or renamed automatically."
  }
};
var colors = {
  background: "var(--dsw-alias-bg-layer-1, #fff)",
  surface: "var(--dsw-alias-bg-layer-2, #f7f8fb)",
  border: "var(--dsw-alias-border-l2, #dde1e8)",
  primary: "var(--dsw-alias-label-primary, #17191f)",
  secondary: "var(--dsw-alias-label-secondary, #60646f)",
  dimmed: "var(--dsw-alias-label-secondary, #60646f)",
  brand: "var(--dsw-alias-brand-primary, #4d6bfe)",
  success: "var(--dsw-alias-state-success-primary, #16895c)",
  warning: "var(--dsw-alias-state-warning-primary, #c77914)",
  danger: "var(--dsw-alias-state-error-primary, #cf4747)"
};
function locale() {
  return typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}
function useSettingsScope(scope) {
  const subscribe = React2.useCallback((listener) => scope.subscribe(listener), [scope]);
  const getSnapshot = React2.useCallback(() => scope.getSnapshot(), [scope]);
  return React2.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
function statusTone(status) {
  if (status === "complete") return { color: colors.success, background: "rgba(22,137,92,.10)" };
  if (status === "partial") return { color: colors.warning, background: "rgba(199,121,20,.11)" };
  return { color: colors.dimmed, background: "rgba(120,126,140,.10)" };
}
function smallButton(label, props = {}, primary = false) {
  return React2.createElement("button", {
    type: "button",
    ...props,
    style: {
      border: primary ? 0 : `1px solid ${colors.border}`,
      borderRadius: 8,
      background: primary ? colors.brand : colors.background,
      color: primary ? "#fff" : colors.primary,
      padding: "7px 11px",
      fontSize: 11,
      fontWeight: primary ? 650 : 500,
      cursor: props.disabled ? "default" : "pointer",
      opacity: props.disabled ? 0.58 : 1,
      ...props.style ?? {}
    }
  }, label);
}
function PaperStatusDock({ ctx, scope, sessionId, useSessions, useSession, useInput, inputActions, session, heroOnly = false }) {
  const language = locale();
  const strings = copy[language];
  const snapshot = useSettingsScope(scope);
  const cwd = useSessions((state) => state.byId[sessionId]?.cwd);
  const conversation = useSession((state) => state);
  const input = useInput((state) => state);
  const running = conversation?.running === true;
  const [view, setView] = React2.useState("overview");
  const [scanNonce, setScanNonce] = React2.useState(0);
  const [scan, setScan] = React2.useState({ status: "idle", report: null, error: "" });
  const [selectedStage, setSelectedStage] = React2.useState("");
  const [prompts, setPrompts] = React2.useState({});
  const [open, setOpen] = React2.useState(false);
  const [sending, setSending] = React2.useState(false);
  const [actionMessage, setActionMessage] = React2.useState("");
  const submitLock = React2.useRef(false);
  const panelElement = React2.useRef(null);
  const taskWrites = React2.useRef(/* @__PURE__ */ new Set());
  const [kickoffDraft, setKickoffDraft] = React2.useState({ mode: "auto", topic: "", brief: "", searchWindow: "recent5" });
  const [kickoffExpanded, setKickoffExpanded] = React2.useState(false);
  const selectionTouched = React2.useRef(false);
  const kickoffExpansionTouched = React2.useRef(false);
  const layoutReservation = React2.useRef({ active: false, detailsWasOpen: false, sidebarChanged: false });
  const enabled = snapshot.value?.enabled !== false;
  const visibleForSurface = !heroOnly || session?.blank === true;
  const liveInput = React2.useRef(null);
  liveInput.current = { cwd, sessionId, input, enabled, running };
  React2.useEffect(() => {
    if (panelElement.current) panelElement.current.scrollTop = 0;
  }, [view]);
  function releaseLayout() {
    const reservation = layoutReservation.current;
    if (!reservation.active) return;
    if (!reservation.detailsWasOpen) ctx.layout?.closeDetails();
    if (reservation.sidebarChanged) ctx.layout?.toggleSidebar();
    layoutReservation.current = { active: false, detailsWasOpen: false, sidebarChanged: false };
  }
  function openPanel() {
    const frame = typeof document === "undefined" ? null : document.querySelector("[data-shell-overlay]")?.parentElement;
    const detailsWasOpen = Boolean(frame && !frame.hasAttribute("data-details-collapsed"));
    const sidebarCollapsed = Boolean(frame?.hasAttribute("data-sidebar-collapsed"));
    let sidebarChanged = false;
    if (typeof window !== "undefined" && window.innerWidth < 1280 && !sidebarCollapsed) {
      ctx.layout?.toggleSidebar();
      sidebarChanged = true;
    }
    ctx.layout?.openDetails();
    layoutReservation.current = { active: true, detailsWasOpen, sidebarChanged };
    setOpen(true);
  }
  function closePanel() {
    setOpen(false);
    releaseLayout();
  }
  React2.useEffect(() => () => releaseLayout(), [ctx]);
  React2.useEffect(() => {
    selectionTouched.current = false;
    setSelectedStage("");
    setPrompts({});
    setActionMessage("");
    setView("overview");
    setScan({ status: "idle", report: null, error: "" });
    setKickoffExpanded(false);
    kickoffExpansionTouched.current = false;
  }, [cwd]);
  React2.useEffect(() => {
    if (snapshot.status !== "ready" || !cwd) return;
    const saved = normalizeProjectState(snapshot.value?.projects?.[normalizeWorkspaceKey(cwd)]);
    setKickoffDraft({ mode: saved.kickoffMode, topic: saved.researchTopic, brief: saved.researchBrief, searchWindow: saved.searchWindow });
  }, [
    cwd,
    snapshot.status,
    snapshot.value?.projects?.[normalizeWorkspaceKey(cwd)]?.researchTopic,
    snapshot.value?.projects?.[normalizeWorkspaceKey(cwd)]?.researchBrief,
    snapshot.value?.projects?.[normalizeWorkspaceKey(cwd)]?.kickoffMode,
    snapshot.value?.projects?.[normalizeWorkspaceKey(cwd)]?.searchWindow
  ]);
  React2.useEffect(() => {
    if (snapshot.status !== "ready" || !enabled || !visibleForSurface || !cwd || !sessionId) return void 0;
    const controller = new AbortController();
    let live = true;
    setScan((previous) => ({ status: "scanning", report: previous.report, error: "" }));
    const run = async () => {
      try {
        if (!ctx.remote?.fileReferences?.list) throw new Error("file reference service unavailable");
        const settled = await Promise.allSettled(ARTIFACT_SCAN_QUERIES.map(async (query) => {
          const result = await ctx.remote.fileReferences.list(sessionId, query, controller.signal);
          if (!result?.ok) throw new Error(result?.error?.message ?? `scan failed for ${query}`);
          return result.value;
        }));
        if (!live) return;
        const successful = settled.filter((item) => item.status === "fulfilled");
        if (!successful.length) throw new Error("all artifact queries failed");
        const candidates = successful.flatMap((item) => item.value).filter((candidate) => candidate?.kind === "file");
        const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
        const report2 = analyzePaperArtifacts(candidates, scannedAt);
        const latest = scope.getSnapshot();
        const latestProject = normalizeProjectState(latest.value?.projects?.[normalizeWorkspaceKey(cwd)]);
        const configuredReport = analyzePaperArtifacts(candidates, scannedAt, latestProject);
        const inferredStage = nextResearchStage(configuredReport, resolveWorkflow(latestProject, configuredReport), latestProject);
        report2.stage = inferredStage;
        setScan({ status: "ready", report: report2, cwd, error: "", incomplete: successful.length < settled.length });
        if (!kickoffExpansionTouched.current) setKickoffExpanded(isResearchKickoffRecommended(configuredReport));
        if (!selectionTouched.current) setSelectedStage(inferredStage);
      } catch (error) {
        if (!live || controller.signal.aborted) return;
        console.warn("[dsh-academic-research-skills] artifact scan failed", error);
        setScan((previous) => ({ status: "error", report: previous.report, error: error instanceof Error ? error.message : String(error) }));
      }
    };
    void run();
    return () => {
      live = false;
      controller.abort();
    };
  }, [ctx, scope, sessionId, cwd, enabled, visibleForSurface, scanNonce, snapshot.status]);
  const key = normalizeWorkspaceKey(cwd);
  const projects = snapshot.value?.projects ?? {};
  const project = normalizeProjectState(projects[key]);
  const report = React2.useMemo(
    () => analyzePaperArtifacts(scan.cwd === cwd ? scan.report?.allFiles ?? [] : [], scan.cwd === cwd ? scan.report?.scannedAt ?? "" : "", project),
    [cwd, scan.cwd, scan.report, JSON.stringify(project.assignments), project.scanRoot, project.excludedFolders.join("\n")]
  );
  const workflowIds = resolveWorkflow(project, report);
  const stages = workflowIds.map((id) => PAPER_STAGES.find((stage) => stage.id === id)).filter(Boolean);
  const currentStageId = nextResearchStage(report, workflowIds, project);
  const current = PAPER_STAGES.find((stage) => stage.id === currentStageId) ?? stages[0];
  const selected = stages.find((stage) => stage.id === selectedStage) ?? current ?? PAPER_STAGES[0];
  const selectedReport = report.modules[selected.id];
  const score = scorePaperMaterials(report, workflowIds, project.standard);
  const suggestion = suggestModulePrompt(selected.id, selectedReport, project.standard, language);
  const promptValue = Object.hasOwn(prompts, selected.id) ? prompts[selected.id] : suggestion;
  const saveConfig = (patch) => {
    const operation = settingsWrites.then(async () => {
      const latest = scope.getSnapshot();
      if (latest.status !== "ready" || !latest.writable || !cwd) throw new Error("Settings are not writable");
      const previous = normalizeProjectState(latest.value?.projects?.[key]);
      await scope.set("projects", updateProjectConfig(latest.value?.projects ?? {}, cwd, typeof patch === "function" ? patch(previous) : patch));
      return true;
    });
    settingsWrites = operation.catch(() => {
    });
    return operation.catch(() => {
      setActionMessage(language === "zh" ? "保存失败，请重试。" : "Could not save; please retry.");
      return false;
    });
  };
  const endSeq = Math.max(0, ...Array.from(conversation?.turnEnds?.values?.() ?? []));
  React2.useEffect(() => {
    if (!enabled || !visibleForSurface || snapshot.status !== "ready" || !cwd) return;
    const task = project.tasks.find((t) => t.sessionId === sessionId && ["awaiting", "running", "checking"].includes(t.status));
    if (!task || taskWrites.current.has(task.id)) return;
    const promptFailed = conversation?.promptError && task.status === "awaiting" && input?.draft?.includes(`[Research Loom task ${task.id}]`);
    const status = taskExecutionStatus(task, { running, endSeq, promptFailed, lastAgentError: conversation?.lastAgentError });
    if (status !== task.status) {
      taskWrites.current.add(task.id);
      void saveConfig((latest) => ({ tasks: latest.tasks.map((t) => t.id === task.id ? { ...t, status } : t) })).finally(() => taskWrites.current.delete(task.id));
      if (status === "checking" || status === "failed") setScanNonce((n) => n + 1);
    }
  }, [running, endSeq, conversation?.promptError, conversation?.lastAgentError, JSON.stringify(project.tasks), enabled, visibleForSurface, cwd, sessionId, snapshot.status]);
  React2.useEffect(() => {
    if (scan.status !== "ready" || scan.cwd !== cwd || !enabled || !visibleForSurface) return;
    const pending = project.tasks.filter((task) => task.status === "checking");
    if (!pending.length) return;
    void saveConfig((latest) => ({ tasks: latest.tasks.map((task) => pending.some((p) => p.id === task.id) ? { ...task, status: "review", outputs: collectTaskOutputs(task, report) } : task) }));
  }, [scan.report, scan.status]);
  const checkResults = async (id) => {
    if (await saveConfig((latest) => ({ tasks: latest.tasks.map((task) => task.id === id ? { ...task, status: "checking" } : task) }))) setScanNonce((n) => n + 1);
  };
  if (snapshot.status !== "ready" || !enabled || !visibleForSurface || !cwd) return null;
  const chooseStage = (stage) => {
    selectionTouched.current = true;
    setSelectedStage(stage.id);
    setView("flow");
    setActionMessage("");
  };
  const submitPrompt = async (prompt, direct, stageId = selected.id) => {
    if (!inputActions || submitLock.current || running || input?.phase && input.phase !== "plain") return;
    submitLock.current = true;
    setSending(true);
    setActionMessage("");
    let submittedTaskId;
    try {
      await settingsWrites;
      let live = liveInput.current;
      if (live.cwd !== cwd || live.sessionId !== sessionId || !live.enabled || live.running) return;
      const latestProject = normalizeProjectState(scope.getSnapshot().value?.projects?.[key]);
      const composed = `${prompt}

${projectHandoff(latestProject, language)}`;
      if (live.input?.draft?.trim()) {
        inputActions.setDraft(`${live.input.draft}

${composed}`);
        setActionMessage(language === "zh" ? "已追加到已有草稿，请在对话框检查后发送。" : "Appended to your draft; review and send from the composer.");
        return;
      }
      if (!direct) {
        inputActions.setDraft(composed);
        setActionMessage(language === "zh" ? "已填入对话框，可编辑后发送。" : "Draft prepared; edit and send when ready.");
        return;
      }
      if (project.tasks.some((task2) => task2.sessionId === sessionId && ["awaiting", "running", "checking"].includes(task2.status))) {
        setActionMessage(language === "zh" ? "上一个任务尚未结束，请在概览中检查执行状态和产物。" : "Check the previous task in Overview before starting another.");
        return;
      }
      if (scan.status !== "ready") {
        setActionMessage(language === "zh" ? "请等待材料扫描完成后再启动任务。" : "Wait for the material scan before starting.");
        return;
      }
      const task = { id: crypto.randomUUID(), sessionId, stageId, status: "awaiting", startedAt: (/* @__PURE__ */ new Date()).toISOString(), endSeq, baseline: report.sourceFiles, outputs: [] };
      if (!await saveConfig((latest) => ({ tasks: [task, ...latest.tasks].slice(0, 20) }))) return;
      submittedTaskId = task.id;
      live = liveInput.current;
      if (live.cwd !== cwd || live.sessionId !== sessionId || !live.enabled || live.running || live.input?.draft?.trim()) throw new Error("Input changed during submission");
      inputActions.setDraft(`${composed}

[Research Loom task ${task.id}]`);
      inputActions.submit();
      setActionMessage(language === "zh" ? "已请求启动，执行状态见概览。" : "Start requested; follow status in Overview.");
    } catch {
      setActionMessage(strings.sendError);
      if (submittedTaskId) await saveConfig((latest) => ({ tasks: latest.tasks.map((task) => task.id === submittedTaskId ? { ...task, status: "failed" } : task) }));
    } finally {
      setSending(false);
      submitLock.current = false;
    }
  };
  const modulePrompt = () => buildModulePrompt(selected.id, { language, cwd, moduleReport: selectedReport, standardId: project.standard, userPrompt: promptValue });
  const scanLabel = scan.status === "idle" || scan.status === "scanning" ? strings.scanning : scan.status === "error" ? strings.scanError : `${strings.scanDone} · ${report.candidateCount} ${strings.candidates}${scan.incomplete ? language === "zh" ? " · 部分查询失败，清单可能不完整" : " · Partial scan" : ""}`;
  const confirmedCount = workflowIds.filter((id) => project.stageStates[id] === "confirmed").length;
  const standard = PUBLICATION_STANDARDS[project.standard];
  const kickoffMode = kickoffDraft.mode === "auto" ? report.candidateCount ? "local" : "web" : kickoffDraft.mode;
  const startupState = isResearchKickoffRecommended(report);
  const kickoffPrompt = () => buildResearchKickoffPrompt(kickoffMode, {
    language,
    cwd,
    standardId: project.standard,
    topic: kickoffDraft.topic,
    brief: kickoffDraft.brief,
    searchWindow: kickoffDraft.searchWindow,
    currentDate: (/* @__PURE__ */ new Date()).toISOString(),
    sourceFiles: report.sourceFiles
  });
  if (!open) {
    return React2.createElement(
      "button",
      {
        type: "button",
        "data-testid": "academic-paper-status-trigger",
        "aria-label": strings.openWorkbench,
        onClick: openPanel,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 7,
          maxWidth: heroOnly ? 260 : 190,
          border: `1px solid ${colors.border}`,
          borderRadius: 999,
          background: colors.background,
          color: colors.primary,
          padding: "5px 9px 5px 6px",
          cursor: "pointer",
          alignSelf: heroOnly ? "center" : void 0
        }
      },
      React2.createElement("span", {
        style: {
          display: "grid",
          placeItems: "center",
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: `conic-gradient(${colors.brand} ${score.score}%, ${colors.border} 0)`,
          color: colors.primary,
          fontSize: 9,
          fontWeight: 750
        }
      }, React2.createElement("span", { style: { display: "grid", placeItems: "center", width: 20, height: 20, borderRadius: "50%", background: colors.background } }, `${score.score}%`)),
      React2.createElement(
        "span",
        { style: { display: "grid", minWidth: 0, textAlign: "left" } },
        React2.createElement("strong", { style: { fontSize: 11 } }, strings.workbench),
        React2.createElement("span", { style: { color: colors.secondary, fontSize: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, `${current[language]} · ${scanLabel}`)
      )
    );
  }
  return React2.createElement(
    "section",
    {
      ref: panelElement,
      className: "research-workbench",
      "data-testid": "academic-paper-status",
      "aria-label": strings.workbench,
      style: {
        boxSizing: "border-box",
        position: "fixed",
        zIndex: 35,
        top: 0,
        right: 0,
        bottom: 0,
        width: "min(340px, 100vw)",
        padding: "14px",
        overflowY: "auto",
        overscrollBehavior: "contain",
        border: 0,
        borderLeft: `1px solid ${colors.border}`,
        borderRadius: 0,
        background: colors.background,
        color: colors.primary,
        boxShadow: "0 12px 38px rgba(25,35,60,.18)",
        display: "grid",
        alignContent: "start",
        gap: 14,
        fontSize: 13,
        lineHeight: 1.55
      }
    },
    React2.createElement("style", null, ".research-workbench :is(button,select,textarea,input,span,small,label,summary,code,li){font-size:13px!important}.research-workbench strong{font-size:14px!important}.research-workbench :is(button,input,select,textarea):focus-visible{outline:2px solid #4d6bfe;outline-offset:2px}.research-workbench button:disabled{cursor:not-allowed;opacity:.55}"),
    React2.createElement(
      "header",
      { style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "start" } },
      React2.createElement(
        "div",
        { style: { minWidth: 0 } },
        React2.createElement(
          "div",
          { style: { display: "flex", gap: 7, alignItems: "center" } },
          React2.createElement("strong", { style: { fontSize: 14 } }, strings.workbench),
          React2.createElement("span", { style: { color: colors.brand, background: "rgba(77,107,254,.10)", padding: "2px 7px", borderRadius: 999, fontSize: 10, fontWeight: 650 } }, `${strings.autoStage} · ${current[language]}`)
        ),
        React2.createElement("div", { title: cwd, style: { marginTop: 3, color: colors.secondary, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, workspaceName(cwd)),
        React2.createElement("div", { role: scan.status === "error" ? "alert" : "status", title: scan.error || void 0, style: { marginTop: 4, color: scan.status === "error" ? colors.danger : colors.dimmed, fontSize: 10 } }, scanLabel)
      ),
      smallButton("×", { "aria-label": strings.closeWorkbench, title: strings.closeWorkbench, onClick: closePanel, style: { width: 30, height: 30, padding: 0, borderRadius: "50%", fontSize: 18, lineHeight: 1 } }),
      React2.createElement(
        "div",
        { style: { gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) auto", gap: 8, alignItems: "end" } },
        React2.createElement(
          "label",
          { style: { display: "grid", gap: 3, color: colors.secondary, fontSize: 10 } },
          strings.workflow,
          React2.createElement(
            "select",
            { "aria-label": strings.workflow, value: project.workflowMode, onChange: (event) => {
              const mode = event.target.value;
              void saveConfig({ workflowMode: mode, ...mode === "custom" && !project.workflow.length ? { workflow: workflowIds } : {} });
            }, style: { minWidth: 0, border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.background, color: colors.primary, padding: "6px 7px", fontSize: 10 } },
            Object.entries(WORKFLOW_PRESETS).map(([id, preset]) => React2.createElement("option", { key: id, value: id }, preset[language]))
          )
        ),
        React2.createElement(
          "label",
          { style: { display: "grid", gap: 3, color: colors.secondary, fontSize: 10 } },
          strings.standard,
          React2.createElement(
            "select",
            { "aria-label": strings.standard, value: project.standard, onChange: (event) => {
              void saveConfig({ standard: event.target.value });
            }, style: { minWidth: 0, border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.background, color: colors.primary, padding: "6px 7px", fontSize: 10 } },
            Object.entries(PUBLICATION_STANDARDS).map(([id, item]) => React2.createElement("option", { key: id, value: id }, item[language]))
          )
        ),
        React2.createElement(
          "div",
          { "data-testid": "material-score", title: strings.scoreNote, style: { width: 54, height: 54, borderRadius: "50%", background: `conic-gradient(${colors.brand} ${score.score}%, ${colors.border} 0)`, display: "grid", placeItems: "center" } },
          React2.createElement("div", { style: { width: 44, height: 44, borderRadius: "50%", background: colors.background, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 750 } }, `${score.score}%`)
        )
      )
    ),
    React2.createElement(
      "nav",
      { "aria-label": language === "zh" ? "工作台视图" : "Workbench views", style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, position: "sticky", top: -14, padding: "10px 0", zIndex: 2, background: colors.background } },
      [["overview", "概览", "Overview"], ["materials", "材料", "Materials"], ["flow", "流程", "Workflow"]].map(([id, zh, en]) => smallButton(language === "zh" ? zh : en, { key: id, "aria-pressed": view === id, onClick: () => setView(id) }, view === id))
    ),
    actionMessage ? React2.createElement("div", { role: "status", style: { padding: 10, background: colors.surface, borderRadius: 8 } }, actionMessage) : null,
    running ? React2.createElement("div", { role: "status" }, language === "zh" ? "当前对话正在执行，完成后会检查新增材料。" : "Conversation running; new materials will be checked afterward.") : null,
    view === "materials" ? React2.createElement(MaterialsPanel, { key: cwd, project, report, saveConfig, language, rescan: () => setScanNonce((n) => n + 1), scanning: scan.status === "scanning", fillFile: (path) => {
      void submitPrompt(language === "zh" ? `请读取工作区文件 ${JSON.stringify(path)}，核验题名、作者、年份、主要结论及证据页码。明确标注全文、摘要或不可读状态，不得编造读取结果。` : `Read workspace file ${JSON.stringify(path)}; verify metadata, findings and page evidence. State whether full text, abstract only, or unreadable.`, false);
    } }) : null,
    view === "overview" ? React2.createElement(
      "div",
      { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } },
      React2.createElement("span", { style: { fontSize: 11, fontWeight: 650 } }, strings.materialScore),
      React2.createElement("span", { style: { color: colors.success, fontSize: 10 } }, `${strings.found} ${score.found}`),
      React2.createElement("span", { style: { color: colors.danger, fontSize: 10 } }, `${strings.missing} ${score.missing}`),
      React2.createElement("span", { style: { color: colors.dimmed, fontSize: 10 } }, strings.scoreNote),
      React2.createElement("span", { style: { flex: 1 } }),
      smallButton(strings.deepScore, { "data-testid": "deep-score", disabled: sending || running, onClick: () => {
        void submitPrompt(buildEvaluationPrompt(report, workflowIds, project.standard, language, cwd), true);
      } }, true)
    ) : null,
    view === "overview" ? React2.createElement(
      "details",
      {
        "data-testid": "research-kickoff",
        open: kickoffExpanded,
        onToggle: (event) => {
          const next = event.currentTarget.open;
          if (next === kickoffExpanded) return;
          kickoffExpansionTouched.current = true;
          setKickoffExpanded(next);
        },
        style: { border: `1px solid ${startupState ? "rgba(77,107,254,.30)" : colors.border}`, borderRadius: 12, background: startupState ? "rgba(77,107,254,.045)" : colors.surface, padding: "10px 11px" }
      },
      React2.createElement(
        "summary",
        { style: { cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 } },
        React2.createElement(
          "span",
          { style: { display: "grid", gap: 2 } },
          React2.createElement("strong", { style: { fontSize: 12 } }, strings.kickoff),
          React2.createElement("span", { style: { color: colors.secondary, fontSize: 9 } }, strings.kickoffHint)
        ),
        startupState ? React2.createElement("span", { style: { color: colors.brand, background: "rgba(77,107,254,.10)", borderRadius: 999, padding: "2px 7px", fontSize: 9, whiteSpace: "nowrap" } }, language === "zh" ? "建议从这里开始" : "Recommended") : null
      ),
      React2.createElement(
        "div",
        { style: { display: "grid", gap: 9, marginTop: 10 } },
        React2.createElement(
          "div",
          { role: "group", "aria-label": strings.kickoff, style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 } },
          [["local", strings.localStart], ["web", strings.webStart], ["hybrid", language === "zh" ? "已有资料 + 补充检索" : "Sources + gap search"]].map(([mode, label]) => React2.createElement("button", {
            key: mode,
            type: "button",
            "aria-pressed": kickoffMode === mode,
            onClick: () => {
              setKickoffDraft((value) => ({ ...value, mode }));
              void saveConfig({ kickoffMode: mode });
            },
            style: { border: `1px solid ${kickoffMode === mode ? colors.brand : colors.border}`, borderRadius: 9, background: kickoffMode === mode ? "rgba(77,107,254,.09)" : colors.background, color: kickoffMode === mode ? colors.brand : colors.primary, padding: "8px 7px", fontSize: 10, fontWeight: kickoffMode === mode ? 650 : 500, cursor: "pointer" }
          }, label))
        ),
        React2.createElement(
          "label",
          { style: { display: "grid", gap: 4, color: colors.secondary, fontSize: 10 } },
          strings.topicInput,
          React2.createElement("textarea", {
            value: kickoffDraft.topic,
            rows: 2,
            placeholder: strings.topicPlaceholder,
            onChange: (event) => setKickoffDraft((value) => ({ ...value, topic: event.target.value })),
            onBlur: () => {
              void saveConfig({ researchTopic: kickoffDraft.topic });
            },
            style: { boxSizing: "border-box", width: "100%", minHeight: 52, resize: "vertical", border: `1px solid ${colors.border}`, borderRadius: 9, background: colors.background, color: colors.primary, padding: "7px 8px", font: "inherit", fontSize: 10, lineHeight: 1.4 }
          })
        ),
        React2.createElement(
          "label",
          { style: { display: "grid", gap: 4, color: colors.secondary, fontSize: 10 } },
          strings.briefInput,
          React2.createElement("textarea", {
            value: kickoffDraft.brief,
            rows: 2,
            placeholder: strings.briefPlaceholder,
            onChange: (event) => setKickoffDraft((value) => ({ ...value, brief: event.target.value })),
            onBlur: () => {
              void saveConfig({ researchBrief: kickoffDraft.brief });
            },
            style: { boxSizing: "border-box", width: "100%", minHeight: 48, resize: "vertical", border: `1px solid ${colors.border}`, borderRadius: 9, background: colors.background, color: colors.primary, padding: "7px 8px", font: "inherit", fontSize: 10, lineHeight: 1.4 }
          })
        ),
        kickoffMode !== "local" ? React2.createElement(
          "label",
          { style: { display: "grid", gap: 4, color: colors.secondary, fontSize: 10 } },
          strings.searchWindow,
          React2.createElement("select", {
            value: kickoffDraft.searchWindow,
            onChange: (event) => {
              const searchWindow = event.target.value;
              setKickoffDraft((value) => ({ ...value, searchWindow }));
              void saveConfig({ searchWindow });
            },
            style: { border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.background, color: colors.primary, padding: "6px 7px", fontSize: 10 }
          }, Object.entries(SEARCH_WINDOWS).map(([id, item]) => React2.createElement("option", { key: id, value: id }, item[language])))
        ) : React2.createElement(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", color: colors.secondary, fontSize: 10 } },
          React2.createElement("span", null, `${report.candidateCount} ${strings.localFiles}`),
          smallButton(strings.rescan, { disabled: scan.status === "scanning", onClick: () => setScanNonce((value) => value + 1), style: { padding: "5px 8px" } }),
          report.candidateCount === 0 ? React2.createElement("span", { style: { color: colors.warning } }, strings.putFiles) : null
        ),
        React2.createElement("div", { style: { color: colors.dimmed, fontSize: 9, lineHeight: 1.4 } }, strings.noMove),
        React2.createElement(
          "div",
          { style: { display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" } },
          smallButton(strings.kickoffFill, { disabled: !inputActions || running, onClick: () => {
            void submitPrompt(kickoffPrompt(), false, "topic");
          } }),
          smallButton(sending ? strings.generating : strings.kickoffRun, { disabled: sending || running || !inputActions, onClick: () => {
            void submitPrompt(kickoffPrompt(), true, "topic");
          } }, true)
        )
      )
    ) : null,
    view === "overview" ? React2.createElement(OverviewPanel, { key: cwd, project, report, workflow: workflowIds, nextStage: currentStageId, saveConfig, checkResults, language, onStage: (id) => chooseStage(PAPER_STAGES.find((s) => s.id === id)) }) : null,
    view === "overview" ? React2.createElement(ProjectTransfer, { key: `transfer-${cwd}`, project, saveConfig, language }) : null,
    view === "flow" ? React2.createElement(
      React2.Fragment,
      null,
      React2.createElement(
        "ol",
        { style: { listStyle: "none", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6, padding: 0, margin: 0 } },
        stages.map((stage, index) => {
          const module2 = report.modules[stage.id];
          const tone = statusTone(module2.status);
          const active = stage.id === selected.id;
          return React2.createElement("li", { key: stage.id }, React2.createElement(
            "button",
            {
              type: "button",
              "aria-label": `${strings.inspect}：${stage[language]}`,
              "aria-current": active ? "step" : void 0,
              onClick: () => chooseStage(stage),
              style: { width: "100%", minHeight: 54, textAlign: "left", border: active ? `1px solid ${colors.brand}` : `1px solid ${colors.border}`, borderRadius: 10, background: active ? "rgba(77,107,254,.06)" : colors.surface, color: colors.primary, padding: "7px 8px", cursor: "pointer" }
            },
            React2.createElement(
              "span",
              { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 } },
              React2.createElement("b", { style: { fontSize: 11 } }, stage[language]),
              React2.createElement("span", { style: { width: 7, height: 7, borderRadius: "50%", background: tone.color } })
            ),
            React2.createElement("span", { style: { display: "block", marginTop: 5, color: tone.color, fontSize: 9 } }, `${module2.status === "complete" ? strings.complete : module2.status === "partial" ? strings.partial : strings.empty}`),
            React2.createElement("span", { style: { display: "block", color: colors.secondary } }, STAGE_LABELS[project.stageStates[stage.id] ?? "auto"][language === "en" ? 1 : 0])
          ));
        })
      ),
      React2.createElement(
        "div",
        { role: "progressbar", "aria-label": language === "zh" ? "研究者确认进度" : "Researcher confirmed progress", "aria-valuemin": 0, "aria-valuemax": workflowIds.length, "aria-valuenow": confirmedCount, style: { height: 5, borderRadius: 999, background: colors.border, overflow: "hidden" } },
        React2.createElement("div", { style: { height: "100%", width: `${Math.round(confirmedCount / workflowIds.length * 100)}%`, background: colors.brand, transition: "width 180ms ease" } })
      ),
      React2.createElement(
        "article",
        { "data-testid": "academic-paper-module-panel", style: { border: `1px solid ${colors.border}`, borderRadius: 12, background: colors.surface, padding: "11px 12px", display: "grid", gap: 9 } },
        React2.createElement(
          "div",
          { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } },
          React2.createElement("strong", { style: { fontSize: 12 } }, `${strings.module} · ${selected[language]}`),
          React2.createElement("span", { style: { ...statusTone(selectedReport.status), padding: "2px 7px", borderRadius: 999, fontSize: 10 } }, selectedReport.status === "complete" ? strings.complete : selectedReport.status === "partial" ? strings.partial : strings.empty),
          React2.createElement("span", { style: { color: colors.secondary, fontSize: 10 } }, `${strings.qualityGate}：${selected[language === "zh" ? "nextZh" : "nextEn"]}`)
        ),
        React2.createElement(StageControl, { stageId: selected.id, project, saveConfig, language, allowNA: workflowIds.length > 1 }),
        React2.createElement(
          "div",
          { style: { display: "flex", flexWrap: "wrap", gap: 6 } },
          selectedReport.materialChecks.map((item) => React2.createElement("span", { key: item.id, title: item.status === "found" ? item.artifacts.join("\n") : void 0, style: { color: item.status === "found" ? colors.success : colors.danger, background: item.status === "found" ? "rgba(22,137,92,.09)" : "rgba(207,71,71,.08)", border: `1px solid ${item.status === "found" ? "rgba(22,137,92,.22)" : "rgba(207,71,71,.18)"}`, borderRadius: 999, padding: "3px 8px", fontSize: 10 } }, `${item.status === "found" ? "✓" : "○"} ${item[language]}`))
        ),
        React2.createElement(
          "details",
          null,
          React2.createElement("summary", { style: { color: colors.secondary, fontSize: 10, cursor: "pointer" } }, `${strings.evidence} · ${selectedReport.artifactCount}`),
          selectedReport.artifacts.length ? React2.createElement("ul", { style: { margin: "7px 0 0", paddingLeft: 19, color: colors.secondary, fontSize: 10, lineHeight: 1.55, overflowWrap: "anywhere" } }, selectedReport.artifacts.map((path) => React2.createElement("li", { key: path, title: path }, path))) : React2.createElement("p", { style: { margin: "7px 0 0", color: colors.dimmed, fontSize: 10 } }, strings.noEvidence)
        ),
        React2.createElement(
          "label",
          { style: { display: "grid", gap: 4, color: colors.secondary, fontSize: 10 } },
          `${strings.smartPrompt} · ${standard[language]}`,
          React2.createElement("textarea", { "data-testid": "module-prompt", value: promptValue, rows: 3, onChange: (event) => setPrompts((value) => ({ ...value, [selected.id]: event.target.value })), style: { boxSizing: "border-box", width: "100%", minHeight: 66, resize: "vertical", border: `1px solid ${colors.border}`, borderRadius: 9, background: colors.background, color: colors.primary, padding: "8px 9px", font: "inherit", lineHeight: 1.45 } })
        ),
        React2.createElement(
          "div",
          { style: { display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" } },
          smallButton(strings.restore, { onClick: () => setPrompts((value) => {
            const next = { ...value };
            delete next[selected.id];
            return next;
          }) }),
          smallButton(strings.fill, { disabled: !inputActions || running, onClick: () => {
            void submitPrompt(modulePrompt(), false);
          } }),
          smallButton(sending ? strings.generating : strings.generate, { disabled: sending || running || !inputActions, onClick: () => {
            void submitPrompt(modulePrompt(), true);
          } }, true),
          actionMessage ? React2.createElement("span", { role: "status", style: { color: actionMessage === strings.sendError ? colors.danger : colors.success, fontSize: 10 } }, actionMessage) : null
        )
      ),
      React2.createElement(
        "details",
        { "data-testid": "workflow-settings", style: { borderTop: `1px solid ${colors.border}`, paddingTop: 8 } },
        React2.createElement("summary", { style: { color: colors.secondary, fontSize: 10, cursor: "pointer" } }, strings.adjust),
        React2.createElement(
          "div",
          { style: { marginTop: 8, display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" } },
          React2.createElement("span", { style: { color: colors.dimmed, fontSize: 10 } }, strings.customHelp),
          PAPER_STAGES.map((stage) => {
            const checked = workflowIds.includes(stage.id);
            return React2.createElement(
              "label",
              { key: stage.id, style: { display: "inline-flex", gap: 4, alignItems: "center", color: colors.secondary, fontSize: 10 } },
              React2.createElement("input", { type: "checkbox", checked, disabled: project.workflowMode !== "custom" || checked && workflowIds.length === 1, onChange: () => {
                const selectedIds = checked ? workflowIds.filter((id) => id !== stage.id) : [...workflowIds, stage.id];
                void saveConfig({ workflow: PAPER_STAGES.map((item) => item.id).filter((id) => selectedIds.includes(id)) });
              } }),
              stage[language]
            );
          }),
          smallButton(strings.rescan, { disabled: scan.status === "scanning", onClick: () => setScanNonce((value) => value + 1) })
        )
      ),
      Object.keys(project.stageStates).filter((id) => project.stageStates[id] === "na").map((id) => React2.createElement(StageControl, { key: id, stageId: id, project, saveConfig, language }))
    ) : null
  );
}
function AcademicResearchCard({ scope, refreshCatalog }) {
  const strings = copy[locale()];
  const snapshot = useSettingsScope(scope);
  const [saving, setSaving] = React2.useState(false);
  if (snapshot.status !== "ready") return null;
  const enabled = snapshot.value?.enabled !== false;
  const writable = snapshot.writable && !saving;
  const toggle = async () => {
    if (!writable) return;
    setSaving(true);
    try {
      await scope.set("enabled", !enabled);
      refreshCatalog();
    } finally {
      setSaving(false);
    }
  };
  return React2.createElement(
    "li",
    { "data-testid": "academic-research-settings-card", style: { listStyle: "none", border: `1px solid ${colors.border}`, borderRadius: 12, background: colors.background, padding: "16px 18px", display: "grid", gap: 12 } },
    React2.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" } },
      React2.createElement("div", null, React2.createElement("div", { style: { color: colors.primary, fontSize: 15, fontWeight: 650 } }, strings.title), React2.createElement("div", { style: { color: colors.secondary, fontSize: 12, marginTop: 3 } }, strings.description)),
      React2.createElement("button", { type: "button", role: "switch", "aria-checked": enabled, "aria-label": strings.title, disabled: !writable, onClick: () => {
        void toggle();
      }, style: { appearance: "none", width: 44, minWidth: 44, height: 24, padding: 2, border: 0, borderRadius: 999, background: enabled ? colors.brand : colors.dimmed, cursor: writable ? "pointer" : "default", opacity: writable ? 1 : 0.55 } }, React2.createElement("span", { style: { display: "block", width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.25)", transform: enabled ? "translateX(20px)" : "translateX(0)", transition: "transform 160ms ease" } }))
    ),
    React2.createElement("div", { style: { color: enabled ? colors.success : colors.secondary, fontSize: 11, fontWeight: 600 } }, saving ? strings.saving : `${enabled ? strings.enabled : strings.disabled} · ${strings.live}`),
    React2.createElement("p", { style: { margin: 0, color: colors.secondary, fontSize: 11, lineHeight: 1.5 } }, enabled ? strings.hintEnabled : strings.hintDisabled),
    !snapshot.writable ? React2.createElement("p", { role: "status", style: { margin: 0, color: colors.secondary, fontSize: 11 } }, strings.readOnly) : null
  );
}
function apply(ctx) {
  const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE });
  ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({ name: "settings.plugin.item", key: SETTINGS_NAMESPACE }, () => React2.createElement(AcademicResearchCard, { scope, refreshCatalog: () => ctx.emit("connection/reset") })));
  ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
    name: "conversation.session.header.actions",
    id: "academic-research-paper-status",
    order: 15,
    label: "Paper workbench"
  }, (props) => React2.createElement(PaperStatusDock, { ...props, ctx, scope })));
  ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
    name: "conversation.input.dock",
    id: "academic-research-blank-session-kickoff",
    order: -20,
    label: "Paper workbench for blank sessions"
  }, (props) => React2.createElement(PaperStatusDock, { ...props, ctx, scope, heroOnly: true })));
}
return module.exports; } });
//# sourceMappingURL=client.js.map
