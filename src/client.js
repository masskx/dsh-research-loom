import * as React from 'react';
import {
  PAPER_STAGES,
  PUBLICATION_STANDARDS,
  SEARCH_WINDOWS,
  WORKFLOW_PRESETS,
  analyzePaperArtifacts,
  buildEvaluationPrompt,
  buildModulePrompt,
  buildResearchKickoffPrompt,
  currentStageForWorkflow,
  isResearchKickoffRecommended,
  normalizeProjectState,
  normalizeWorkspaceKey,
  resolveWorkflow,
  scorePaperMaterials,
  suggestModulePrompt,
  updateProjectConfig,
  updateProjectStage,
  workspaceName,
  nextResearchStage,
  projectHandoff,
  collectTaskOutputs,
  taskExecutionStatus,
} from './paper-state.js';
import { OverviewPanel, MaterialsPanel, StageControl, ProjectTransfer, STAGE_LABELS } from './workbench-panels.js';
import { GettingStartedPanel, GUIDE_STYLES } from './getting-started-panel.js';
import { prepareComposerDraft } from './composer-draft.js';
import { ReviewLoopPanel } from './review-loop-panel.js';
import { normalizeReviewLoop } from './review-loop.js';
import { scanRemote } from '../lib/material-scan-contract.js';

export const inject = ['slots', 'settingsScope', 'remote', 'layout'];

const SETTINGS_NAMESPACE = 'academic-research';
let settingsWrites = Promise.resolve();
const copy = {
  zh: {
    title: 'Academic Research Skills', description: '学术研究、论文写作、同行评审与完整学术流水线',
    enabled: '功能已启用', disabled: '功能已停用', live: '实时生效', saving: '正在保存设置……',
    hintEnabled: '4 个核心技能和 16 个 /ars-* 命令已加入技能目录。', hintDisabled: '技能已从目录注销；配置卡片仍保留，可随时重新启用。', readOnly: '当前设置文档不可写。',
    workbench: '论文工作台', autoStage: '建议推进', workflow: '论文流程', standard: '目标标准',
    openWorkbench: '打开论文工作台', closeWorkbench: '收起论文工作台',
    materialScore: '材料完整度初评', scoreNote: '基于文件路径与类型，不代表论文质量',
    found: '已有', missing: '缺失', scanning: '正在扫描论文材料…', scanDone: '路径扫描完成',
    scanError: '扫描失败，显示上次结果', rescan: '重新扫描', current: '当前', inspect: '查看模块',
    module: '模块状态', qualityGate: '本阶段质量门', smartPrompt: '智能任务建议', restore: '恢复智能建议',
    evidence: '匹配到的文件证', noEvidence: '尚未匹配到明确文件', fill: '填入对话框', generate: '生成模块结果',
    deepScore: '按此标准深度评分', adjust: '调整流程', customHelp: '自定义启用的阶段；顺序按论文规范自动排列。',
    submitted: '任务已提交到当前对话', sendError: '任务提交失败', generating: '正在提交…',
    complete: '材料齐全', partial: '部分具备', empty: '尚未发现', candidates: '个候选文件',
    kickoff: '课题起步', kickoffHint: '空白或早期项目可从已有资料或在线检索开始',
    localStart: '整理已有资料', webStart: '在线检索资料', topicInput: '研究主题或暂定问题',
    topicPlaceholder: '例如：医学影像少样本分类；可留空，由助手先提问澄清',
    briefInput: '研究重点与约束（可选）', briefPlaceholder: '研究对象、可用数据、偏好方法、时间或投稿要求',
    searchWindow: '检索时间窗', localFiles: '候选资料', putFiles: '请把 PDF、DOCX、BIB 或 RIS 放入当前工作区，然后重新扫描。',
    kickoffFill: '填入起步任务', kickoffRun: '启动课题研究', noMove: '只生成非破坏性索引；不会自动移动或改名原始论文。',
  },
  en: {
    title: 'Academic Research Skills', description: 'Research, paper writing, peer review, and the full academic pipeline',
    enabled: 'Enabled', disabled: 'Disabled', live: 'Applies immediately', saving: 'Saving…',
    hintEnabled: '4 core skills and 16 /ars-* commands are available.', hintDisabled: 'Skills are removed; this card remains available.', readOnly: 'Settings are read-only.',
    workbench: 'Paper workbench', autoStage: 'Next step', workflow: 'Workflow', standard: 'Target standard',
    openWorkbench: 'Open paper workbench', closeWorkbench: 'Collapse paper workbench',
    materialScore: 'Material completeness', scoreNote: 'Based on path/type evidence; not a paper-quality score',
    found: 'Found', missing: 'Missing', scanning: 'Scanning paper materials…', scanDone: 'Path scan complete',
    scanError: 'Scan failed; showing the last result', rescan: 'Rescan', current: 'Current', inspect: 'Inspect module',
    module: 'Module status', qualityGate: 'Quality gate', smartPrompt: 'Smart task suggestion', restore: 'Restore smart suggestion',
    evidence: 'Matched files', noEvidence: 'No explicit file was matched', fill: 'Fill composer', generate: 'Generate module result',
    deepScore: 'Run deep assessment', adjust: 'Adjust workflow', customHelp: 'Enable custom stages; academic order is preserved.',
    submitted: 'Task submitted to the current conversation', sendError: 'Could not submit task', generating: 'Submitting…',
    complete: 'Complete', partial: 'Partial', empty: 'Not found', candidates: 'candidate files',
    kickoff: 'Research kickoff', kickoffHint: 'Start an empty or early project from supplied sources or online discovery',
    localStart: 'Organize supplied sources', webStart: 'Discover sources online', topicInput: 'Research topic or tentative question',
    topicPlaceholder: 'Example: few-shot classification in medical imaging; leave blank for guided clarification',
    briefInput: 'Priorities and constraints (optional)', briefPlaceholder: 'Population, available data, methods, timeline, or venue needs',
    searchWindow: 'Search window', localFiles: 'candidate sources', putFiles: 'Add PDF, DOCX, BIB, or RIS files to this workspace, then rescan.',
    kickoffFill: 'Fill kickoff task', kickoffRun: 'Start research', noMove: 'Creates non-destructive indexes only; source papers are never moved or renamed automatically.',
  },
};

const colors = {
  background: 'var(--dsw-alias-bg-layer-1, #fff)', surface: 'var(--dsw-alias-bg-layer-2, #f7f8fb)',
  border: 'var(--dsw-alias-border-l2, #dde1e8)', primary: 'var(--dsw-alias-label-primary, #17191f)',
  secondary: 'var(--dsw-alias-label-secondary, #60646f)', dimmed: 'var(--dsw-alias-label-secondary, #60646f)',
  brand: 'var(--dsw-alias-brand-primary, #4d6bfe)', success: 'var(--dsw-alias-state-success-primary, #16895c)',
  warning: 'var(--dsw-alias-state-warning-primary, #c77914)', danger: 'var(--dsw-alias-state-error-primary, #cf4747)',
};

function locale() {
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function useSettingsScope(scope) {
  const subscribe = React.useCallback((listener) => scope.subscribe(listener), [scope]);
  const getSnapshot = React.useCallback(() => scope.getSnapshot(), [scope]);
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function statusTone(status) {
  if (status === 'complete') return { color: colors.success, background: 'rgba(22,137,92,.10)' };
  if (status === 'partial') return { color: colors.warning, background: 'rgba(199,121,20,.11)' };
  return { color: colors.dimmed, background: 'rgba(120,126,140,.10)' };
}

function smallButton(label, props = {}, primary = false) {
  return React.createElement('button', {
    type: 'button', ...props,
    style: {
      border: primary ? 0 : `1px solid ${colors.border}`, borderRadius: 8,
      background: primary ? colors.brand : colors.background, color: primary ? '#fff' : colors.primary,
      padding: '7px 11px', fontSize: 11, fontWeight: primary ? 650 : 500,
      cursor: props.disabled ? 'default' : 'pointer', opacity: props.disabled ? .58 : 1,
      ...(props.style ?? {}),
    },
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
  const [view, setView] = React.useState('overview');
  const [scanNonce, setScanNonce] = React.useState(0);
  const [scan, setScan] = React.useState({ status: 'idle', report: null, error: '' });
  const [selectedStage, setSelectedStage] = React.useState('');
  const [prompts, setPrompts] = React.useState({});
  const [open, setOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState('');
  const [pendingDraft, setPendingDraft] = React.useState(null);
  const ownedDraft = React.useRef(null);
  const submitLock = React.useRef(false);
  const panelElement = React.useRef(null);
  const taskWrites = React.useRef(new Set());
  const [kickoffDraft, setKickoffDraft] = React.useState({ mode: 'auto', topic: '', brief: '', searchWindow: 'recent5' });
  const [kickoffExpanded, setKickoffExpanded] = React.useState(false);
  const selectionTouched = React.useRef(false);
  const kickoffExpansionTouched = React.useRef(false);
  const layoutReservation = React.useRef({ active: false, detailsWasOpen: false, sidebarChanged: false });
  const enabled = snapshot.value?.enabled !== false;
  const visibleForSurface = !heroOnly || session?.blank === true;
  const liveInput = React.useRef(null);
  liveInput.current = { cwd, sessionId, input, enabled, running };
  React.useEffect(() => { if (panelElement.current) panelElement.current.scrollTop = 0; }, [view]);
  React.useEffect(() => {
    ownedDraft.current = null;
    setPendingDraft(null);
  }, [cwd, sessionId]);
  React.useEffect(() => {
    if (!input?.draft?.trim() || running) ownedDraft.current = null;
  }, [input?.draft, running]);
  React.useEffect(() => setPendingDraft(null), [snapshot.value?.projects?.[normalizeWorkspaceKey(cwd)]?.entryScenario, snapshot.value?.projects?.[normalizeWorkspaceKey(cwd)]?.entryStep]);

  function releaseLayout() {
    const reservation = layoutReservation.current;
    if (!reservation.active) return;
    if (!reservation.detailsWasOpen) ctx.layout?.closeDetails();
    if (reservation.sidebarChanged) ctx.layout?.toggleSidebar();
    layoutReservation.current = { active: false, detailsWasOpen: false, sidebarChanged: false };
  }

  function openPanel() {
    const frame = typeof document === 'undefined' ? null : document.querySelector('[data-shell-overlay]')?.parentElement;
    const detailsWasOpen = Boolean(frame && !frame.hasAttribute('data-details-collapsed'));
    const sidebarCollapsed = Boolean(frame?.hasAttribute('data-sidebar-collapsed'));
    let sidebarChanged = false;
    if (typeof window !== 'undefined' && window.innerWidth < 1280 && !sidebarCollapsed) {
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

  React.useEffect(() => () => releaseLayout(), [ctx]);

  React.useEffect(() => {
    selectionTouched.current = false;
    setSelectedStage('');
    setPrompts({});
    setActionMessage('');
    setView('overview');
    setScan({ status: 'idle', report: null, error: '' });
    setKickoffExpanded(false);
    kickoffExpansionTouched.current = false;
  }, [cwd]);

  React.useEffect(() => {
    if (snapshot.status !== 'ready' || !cwd) return;
    const saved = normalizeProjectState(snapshot.value?.projects?.[normalizeWorkspaceKey(cwd)]);
    setKickoffDraft({ mode: saved.kickoffMode, topic: saved.researchTopic, brief: saved.researchBrief, searchWindow: saved.searchWindow });
  }, [cwd, snapshot.status, snapshot.value?.projects?.[normalizeWorkspaceKey(cwd)]?.researchTopic,
    snapshot.value?.projects?.[normalizeWorkspaceKey(cwd)]?.researchBrief,
    snapshot.value?.projects?.[normalizeWorkspaceKey(cwd)]?.kickoffMode,
    snapshot.value?.projects?.[normalizeWorkspaceKey(cwd)]?.searchWindow]);

  React.useEffect(() => {
    if (snapshot.status !== 'ready' || !enabled || !visibleForSurface || !cwd || !sessionId) return undefined;
    const controller = new AbortController();
    let live = true;
    setScan((previous) => ({ status: 'scanning', report: previous.report, error: '' }));
    const run = async () => {
      try {
        const result = await ctx.remote.researchLoom.scan(sessionId, controller.signal);
        if (!live) return;
        if (!result?.ok) throw new Error(result?.error?.message ?? 'Material scan failed');
        const candidates = result.value.files;
        const scannedAt = new Date().toISOString();
        const report = analyzePaperArtifacts(candidates, scannedAt);
        const latest = scope.getSnapshot();
        const latestProject = normalizeProjectState(latest.value?.projects?.[normalizeWorkspaceKey(cwd)]);
        const configuredReport = analyzePaperArtifacts(candidates, scannedAt, latestProject);
        const inferredStage = nextResearchStage(configuredReport, resolveWorkflow(latestProject, configuredReport), latestProject);
        report.stage = inferredStage;
        setScan({ status: 'ready', report, cwd, error: '', incomplete: result.value.incomplete });
        if (!kickoffExpansionTouched.current) setKickoffExpanded(isResearchKickoffRecommended(configuredReport));
        if (!selectionTouched.current) setSelectedStage(inferredStage);
      } catch (error) {
        if (!live || controller.signal.aborted) return;
        console.warn('[dsh-academic-research-skills] artifact scan failed', error);
        setScan((previous) => ({ status: 'error', report: previous.report, error: error instanceof Error ? error.message : String(error) }));
      }
    };
    void run();
    return () => { live = false; controller.abort(); };
  }, [ctx, scope, sessionId, cwd, enabled, visibleForSurface, scanNonce, snapshot.status]);

  const key = normalizeWorkspaceKey(cwd);
  const projects = snapshot.value?.projects ?? {};
  const project = normalizeProjectState(projects[key]);
  const report = React.useMemo(() => analyzePaperArtifacts(scan.cwd === cwd ? scan.report?.allFiles ?? [] : [], scan.cwd === cwd ? scan.report?.scannedAt ?? '' : '', project),
    [cwd, scan.cwd, scan.report, JSON.stringify(project.assignments), project.scanRoot, project.excludedFolders.join('\n')]);
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
      if (latest.status !== 'ready' || !latest.writable || !cwd) throw new Error('Settings are not writable');
      const previous = normalizeProjectState(latest.value?.projects?.[key]);
      await scope.set('projects', updateProjectConfig(latest.value?.projects ?? {}, cwd, typeof patch === 'function' ? patch(previous) : patch));
      return true;
    });
    settingsWrites = operation.catch(() => {});
    return operation.catch(() => { setActionMessage(language === 'zh' ? '保存失败，请重试。' : 'Could not save; please retry.'); return false; });
  };
  const endSeq = Math.max(0, ...Array.from(conversation?.turnEnds?.values?.() ?? []));
  React.useEffect(() => {
    if (!enabled || !visibleForSurface || snapshot.status !== 'ready' || !cwd) return;
    const task = project.tasks.find((t) => t.sessionId === sessionId && ['awaiting', 'running', 'checking'].includes(t.status));
    if (!task || taskWrites.current.has(task.id)) return;
    const promptFailed = conversation?.promptError && task.status === 'awaiting' && input?.draft?.includes(`[Research Loom task ${task.id}]`);
    const status = taskExecutionStatus(task, { running, endSeq, promptFailed, lastAgentError: conversation?.lastAgentError });
    // A finished turn is only a signal to inspect artifacts, never an academic pass.
    if (status !== task.status) {
      taskWrites.current.add(task.id);
      void saveConfig((latest) => ({ tasks: latest.tasks.map((t) => t.id === task.id ? { ...t, status } : t) }))
        .finally(() => taskWrites.current.delete(task.id));
      if (status === 'checking' || status === 'failed') setScanNonce((n) => n + 1);
    }
  }, [running, endSeq, conversation?.promptError, conversation?.lastAgentError, JSON.stringify(project.tasks), enabled, visibleForSurface, cwd, sessionId, snapshot.status]);

  React.useEffect(() => {
    if (scan.status !== 'ready' || scan.cwd !== cwd || !enabled || !visibleForSurface) return;
    const pending = project.tasks.filter((task) => task.status === 'checking');
    if (!pending.length) return;
    void saveConfig((latest) => ({ tasks: latest.tasks.map((task) => pending.some((p) => p.id === task.id)
      ? { ...task, status: 'review', outputs: collectTaskOutputs(task, report) } : task) }));
  }, [scan.report, scan.status]);

  const checkResults = async (id) => {
    if (await saveConfig((latest) => ({ tasks: latest.tasks.map((task) => task.id === id ? { ...task, status: 'checking' } : task) }))) setScanNonce((n) => n + 1);
  };
  if (snapshot.status !== 'ready' || !enabled || !visibleForSurface || !cwd) return null;
  const chooseStage = (stage) => {
    selectionTouched.current = true;
    setSelectedStage(stage.id);
    setView('flow');
    setActionMessage('');
  };
  const submitPrompt = async (prompt, direct, stageId = selected.id) => {
    if (!inputActions || submitLock.current || running || (input?.phase && input.phase !== 'plain')) return;
    submitLock.current = true;
    setSending(true);
    setActionMessage('');
    let submittedTaskId;
    try {
      await settingsWrites;
      let live = liveInput.current;
      if (live.cwd !== cwd || live.sessionId !== sessionId || !live.enabled || live.running) return;
      const latestProject = normalizeProjectState(scope.getSnapshot().value?.projects?.[key]);
      if (direct && ['awaiting', 'running'].includes(normalizeReviewLoop(latestProject.reviewLoop)?.status)) {
        setActionMessage(language === 'zh' ? '审稿闭环正在等待结果，请先完成或结束等待。' : 'The review loop is awaiting a result; finish or end its wait first.'); return false;
      }
      const composed = `${prompt}\n\n${projectHandoff(latestProject, language)}`;
      setPendingDraft(null);
      if (!direct || live.input?.draft?.trim()) {
        const currentDraft = live.input?.draft ?? '';
        const owned = ownedDraft.current;
        const prepared = prepareComposerDraft(currentDraft, composed, owned?.cwd === cwd && owned?.sessionId === sessionId ? owned.text : '');
        if (prepared.kind === 'confirm') {
          setPendingDraft({ text: composed, baseline: currentDraft, cwd, sessionId });
          return false;
        }
        inputActions.setDraft(prepared.draft);
        ownedDraft.current = { cwd, sessionId, text: composed };
        setActionMessage(language === 'zh' ? (prepared.kind === 'replace' ? '已替换上一次插件任务，其他文字保留，请检查后发送。' : '已填入对话框，可编辑后发送。') : (prepared.kind === 'replace' ? 'Previous plugin task replaced; other text preserved. Review and send.' : 'Draft prepared; edit and send when ready.'));
        return true;
      }
      if (project.tasks.some((task) => task.sessionId === sessionId && ['awaiting', 'running', 'checking'].includes(task.status))) {
        setActionMessage(language === 'zh' ? '上一个任务尚未结束，请在“更多 → 最近任务”中检查执行状态和产物。' : 'Check the previous task in More → Recent tasks before starting another.'); return;
      }
      if (scan.status !== 'ready') { setActionMessage(language === 'zh' ? '请等待材料扫描完成后再启动任务。' : 'Wait for the material scan before starting.'); return; }
      const task = { id: crypto.randomUUID(), sessionId, stageId, status: 'awaiting', startedAt: new Date().toISOString(), endSeq, baseline: report.sourceFiles, outputs: [] };
      if (!await saveConfig((latest) => ({ tasks: [task, ...latest.tasks].slice(0, 20) }))) return;
      submittedTaskId = task.id;
      live = liveInput.current;
      if (live.cwd !== cwd || live.sessionId !== sessionId || !live.enabled || live.running || live.input?.draft?.trim()) throw new Error('Input changed during submission');
      inputActions.setDraft(`${composed}\n\n[Research Loom task ${task.id}]`);
      inputActions.submit();
      setActionMessage(language === 'zh' ? '已请求启动，执行状态见“更多 → 最近任务”。' : 'Start requested; follow status in More → Recent tasks.');
    } catch {
      setActionMessage(strings.sendError);
      if (submittedTaskId) await saveConfig((latest) => ({ tasks: latest.tasks.map((task) => task.id === submittedTaskId ? { ...task, status: 'failed' } : task) }));
    } finally {
      setSending(false);
      submitLock.current = false;
    }
  };
  const modulePrompt = () => buildModulePrompt(selected.id, { language, cwd, moduleReport: selectedReport, standardId: project.standard, userPrompt: promptValue });
  const confirmDraftReplacement = () => {
    const live = liveInput.current;
    if (!pendingDraft || !inputActions || live.running || !live.enabled || (live.input?.phase && live.input.phase !== 'plain')) return;
    if (live.cwd !== pendingDraft.cwd || live.sessionId !== pendingDraft.sessionId || live.input?.draft !== pendingDraft.baseline) {
      setPendingDraft(null);
      setActionMessage(language === 'zh' ? '对话草稿已变化，未覆盖。请重新准备任务。' : 'The draft changed; nothing was overwritten. Prepare the task again.');
      return;
    }
    inputActions.setDraft(pendingDraft.text);
    ownedDraft.current = { cwd, sessionId, text: pendingDraft.text };
    setPendingDraft(null);
    setActionMessage(language === 'zh' ? '已替换当前草稿，请检查后发送。' : 'Current draft replaced. Review and send.');
  };
  const scanLabel = scan.status === 'idle' || scan.status === 'scanning' ? strings.scanning : scan.status === 'error' ? strings.scanError : `${strings.scanDone} · ${report.candidateCount} ${strings.candidates}${scan.incomplete ? (language === 'zh' ? ' · 清单不完整（扫描上限、链接或目录不可读）' : ' · Incomplete (scan limit, links, or unreadable directories)') : ''}`;
  const confirmedCount = workflowIds.filter((id) => project.stageStates[id] === 'confirmed').length;
  const standard = PUBLICATION_STANDARDS[project.standard];
  const kickoffMode = kickoffDraft.mode === 'auto' ? (report.candidateCount ? 'local' : 'web') : kickoffDraft.mode;
  const startupState = isResearchKickoffRecommended(report);
  const kickoffPrompt = () => buildResearchKickoffPrompt(kickoffMode, {
    language,
    cwd,
    standardId: project.standard,
    topic: kickoffDraft.topic,
    brief: kickoffDraft.brief,
    searchWindow: kickoffDraft.searchWindow,
    currentDate: new Date().toISOString(),
    sourceFiles: report.sourceFiles,
  });

  if (!open) {
    return React.createElement('button', {
      type: 'button',
      'data-testid': 'academic-paper-status-trigger',
      'aria-label': strings.openWorkbench,
      onClick: openPanel,
      style: {
        display: 'flex', alignItems: 'center', gap: 7, maxWidth: heroOnly ? 260 : 190,
        border: `1px solid ${colors.border}`, borderRadius: 999,
        background: colors.background, color: colors.primary,
        padding: '5px 9px 5px 6px', cursor: 'pointer', alignSelf: heroOnly ? 'center' : undefined,
      },
    },
    React.createElement('span', { style: { display: 'grid', minWidth: 0, textAlign: 'left' } },
      React.createElement('strong', { style: { fontSize: 11 } }, strings.workbench),
      React.createElement('span', { title: scanLabel, style: { color: colors.secondary, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, language === 'zh' ? '查看任务与论文材料' : 'Tasks and paper materials')));
  }

  return React.createElement('section', {
    ref: panelElement,
    className: 'research-workbench',
    'data-testid': 'academic-paper-status', 'aria-label': strings.workbench,
    style: {
      boxSizing: 'border-box', position: 'fixed', zIndex: 35,
      top: 0, right: 0, bottom: 0, width: 'min(340px, 100vw)',
      padding: '20px', overflowY: 'auto', overscrollBehavior: 'contain',
      border: 0, borderLeft: `1px solid ${colors.border}`, borderRadius: 0,
      background: colors.background, color: colors.primary,
      boxShadow: 'none', display: 'grid',
      alignContent: 'start', gap: 14, fontSize: 13, lineHeight: 1.55,
    },
  },
  React.createElement('style', null, '.research-workbench :is(button,select,textarea,input,span,small,label,summary,code,li){font-size:13px!important}.research-workbench strong{font-size:14px!important}.research-workbench :is(button,input,select,textarea):focus-visible{outline:2px solid #4d6bfe;outline-offset:2px}.research-workbench button:disabled{cursor:not-allowed;opacity:.55}'),
  React.createElement('style', null, GUIDE_STYLES),
  React.createElement('header', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'start' } },
    React.createElement('div', { style: { minWidth: 0 } },
      React.createElement('div', { style: { display: 'flex', gap: 7, alignItems: 'center' } },
        React.createElement('strong', { style: { fontSize: 14 } }, strings.workbench),
        view === 'flow' ? React.createElement('span', { style: { color: colors.brand, background: 'rgba(77,107,254,.10)', padding: '2px 7px', borderRadius: 999, fontSize: 10, fontWeight: 650 } }, `${strings.autoStage} · ${current[language]}`) : null),
      React.createElement('div', { title: cwd, style: { marginTop: 3, color: colors.secondary, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, workspaceName(cwd)),
      scan.status !== 'ready' || view !== 'overview' || scan.incomplete ? React.createElement('div', { role: scan.status === 'error' ? 'alert' : 'status', title: scan.error || undefined, style: { marginTop: 4, color: scan.status === 'error' ? colors.danger : colors.dimmed, fontSize: 12 } }, scanLabel) : null),
    smallButton('×', { 'aria-label': strings.closeWorkbench, title: strings.closeWorkbench, onClick: closePanel, style: { width: 30, height: 30, padding: 0, borderRadius: '50%', fontSize: 18, lineHeight: 1 } }),
    view === 'flow' ? React.createElement('div', { style: { gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) auto', gap: 8, alignItems: 'end' } },
      React.createElement('label', { style: { display: 'grid', gap: 3, color: colors.secondary, fontSize: 10 } }, strings.workflow,
        React.createElement('select', { 'aria-label': strings.workflow, value: project.workflowMode, onChange: (event) => { const mode = event.target.value; void saveConfig({ workflowMode: mode, ...(mode === 'custom' && !project.workflow.length ? { workflow: workflowIds } : {}) }); }, style: { minWidth: 0, border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.background, color: colors.primary, padding: '6px 7px', fontSize: 10 } },
          Object.entries(WORKFLOW_PRESETS).map(([id, preset]) => React.createElement('option', { key: id, value: id }, preset[language])))),
      React.createElement('label', { style: { display: 'grid', gap: 3, color: colors.secondary, fontSize: 10 } }, strings.standard,
        React.createElement('select', { 'aria-label': strings.standard, value: project.standard, onChange: (event) => { void saveConfig({ standard: event.target.value }); }, style: { minWidth: 0, border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.background, color: colors.primary, padding: '6px 7px', fontSize: 10 } },
          Object.entries(PUBLICATION_STANDARDS).map(([id, item]) => React.createElement('option', { key: id, value: id }, item[language])))),
      React.createElement('div', { 'data-testid': 'material-score', title: strings.scoreNote, style: { width: 54, height: 54, borderRadius: '50%', background: `conic-gradient(${colors.brand} ${score.score}%, ${colors.border} 0)`, display: 'grid', placeItems: 'center' } },
        React.createElement('div', { style: { width: 44, height: 44, borderRadius: '50%', background: colors.background, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 750 } }, `${score.score}%`))) : null),
  React.createElement('nav', { 'aria-label': language === 'zh' ? '工作台视图' : 'Workbench views', style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, position: 'sticky', top: -20, padding: '8px 0 0', borderBottom: `1px solid ${colors.border}`, zIndex: 2, background: colors.background } },
    [['overview', '开始', 'Start'], ['materials', '材料', 'Materials'], ['flow', '流程', 'Workflow'], ['tools', '更多', 'More']].map(([id, zh, en]) => smallButton(language === 'zh' ? zh : en, { key: id, 'aria-pressed': view === id, onClick: () => { setView(id); setActionMessage(''); }, style: { border: 0, borderBottom: `2px solid ${view === id ? colors.brand : 'transparent'}`, borderRadius: 0, padding: '8px 0 12px', background: 'transparent', color: view === id ? colors.primary : colors.secondary, fontWeight: view === id ? 600 : 400 } }))),
  actionMessage && !(view === 'overview' && /^(已填入对话框|已追加到已有草稿|Draft prepared|Appended to your draft)/.test(actionMessage)) ? React.createElement('div', { role: 'status', style: { padding: 10, background: colors.surface, borderRadius: 8 } }, actionMessage) : null,
  pendingDraft ? React.createElement('section', { 'aria-label': language === 'zh' ? '确认替换草稿' : 'Confirm draft replacement', style: { display: 'grid', gap: 10, padding: 12, border: `1px solid ${colors.border}`, borderRadius: 8 } },
    React.createElement('span', null, language === 'zh' ? '对话框已有文字，或你已编辑过上次任务。是否用新任务替换整份草稿？替换会移除其中的手动修改，不会自动发送。' : 'The composer contains existing or edited text. Replace the entire draft with this task? Manual edits will be removed; nothing will be sent.'),
    smallButton(language === 'zh' ? '替换当前草稿' : 'Replace current draft', { disabled: running || sending, onClick: confirmDraftReplacement }),
    smallButton(language === 'zh' ? '保留原草稿，取消' : 'Keep draft and cancel', { onClick: () => setPendingDraft(null) })) : null,
  running ? React.createElement('div', { role: 'status' }, language === 'zh' ? '当前对话正在执行，完成后会检查新增材料。' : 'Conversation running; new materials will be checked afterward.') : null,
  view === 'overview' ? React.createElement(GettingStartedPanel, { key: `guide-${cwd}`, project, report, saveConfig, submitPrompt, language, cwd, disabled: sending || running || !inputActions || scan.status !== 'ready', writable: snapshot.writable, onMaterials: () => setView('materials') }) : null,
  React.createElement('div', { hidden: view !== 'overview' }, React.createElement(ReviewLoopPanel, { key: `loop-${cwd}-${sessionId}`, project, conversation, input, inputActions, cwd, sessionId, saveConfig, writable: snapshot.writable, enabled })),
  view === 'tools' ? React.createElement(OverviewPanel, { key: `overview-${cwd}`, project, report, workflow: workflowIds, nextStage: currentStageId, saveConfig, checkResults, language, onStage: (id) => chooseStage(PAPER_STAGES.find((s) => s.id === id)) }) : null,
  view === 'materials' ? React.createElement(MaterialsPanel, { key: cwd, project, report, saveConfig, language, rescan: () => setScanNonce((n) => n + 1), scanning: scan.status === 'scanning', fillFile: (path) => { void submitPrompt(language === 'zh' ? `请读取工作区文件 ${JSON.stringify(path)}，核验题名、作者、年份、主要结论及证据页码。明确标注全文、摘要或不可读状态，不得编造读取结果。` : `Read workspace file ${JSON.stringify(path)}; verify metadata, findings and page evidence. State whether full text, abstract only, or unreadable.`, false); } }) : null,
  view === 'tools' ? React.createElement('details', { 'data-testid': 'advanced-tools', style: { borderTop: `1px solid ${colors.border}`, paddingTop: 10 } },
  React.createElement('summary', { style: { cursor: 'pointer', color: colors.secondary } }, language === 'zh' ? '更多工具：评分、检索与迁移' : 'More tools: assessment, search and migration'),
  React.createElement('div', { style: { display: 'grid', gap: 14, marginTop: 14 } },
  React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
    React.createElement('span', { style: { fontSize: 11, fontWeight: 650 } }, strings.materialScore),
    React.createElement('span', { style: { color: colors.success, fontSize: 10 } }, `${strings.found} ${score.found}`),
    React.createElement('span', { style: { color: colors.danger, fontSize: 10 } }, `${strings.missing} ${score.missing}`),
    React.createElement('span', { style: { color: colors.dimmed, fontSize: 10 } }, strings.scoreNote),
    React.createElement('span', { style: { flex: 1 } }),
    smallButton(strings.deepScore, { 'data-testid': 'deep-score', disabled: sending || running, onClick: () => { void submitPrompt(buildEvaluationPrompt(report, workflowIds, project.standard, language, cwd), true); } }, true)),
  view === 'tools' ? React.createElement('details', {
    'data-testid': 'research-kickoff',
    open: kickoffExpanded,
    onToggle: (event) => {
      const next = event.currentTarget.open;
      if (next === kickoffExpanded) return;
      kickoffExpansionTouched.current = true;
      setKickoffExpanded(next);
    },
    style: { border: `1px solid ${startupState ? 'rgba(77,107,254,.30)' : colors.border}`, borderRadius: 12, background: startupState ? 'rgba(77,107,254,.045)' : colors.surface, padding: '10px 11px' },
  },
  React.createElement('summary', { style: { cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 } },
    React.createElement('span', { style: { display: 'grid', gap: 2 } },
      React.createElement('strong', { style: { fontSize: 12 } }, strings.kickoff),
      React.createElement('span', { style: { color: colors.secondary, fontSize: 9 } }, strings.kickoffHint)),
    startupState ? React.createElement('span', { style: { color: colors.brand, background: 'rgba(77,107,254,.10)', borderRadius: 999, padding: '2px 7px', fontSize: 9, whiteSpace: 'nowrap' } }, language === 'zh' ? '建议从这里开始' : 'Recommended') : null),
  React.createElement('div', { style: { display: 'grid', gap: 9, marginTop: 10 } },
    React.createElement('div', { role: 'group', 'aria-label': strings.kickoff, style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 } },
      [['local', strings.localStart], ['web', strings.webStart], ['hybrid', language === 'zh' ? '已有资料 + 补充检索' : 'Sources + gap search']].map(([mode, label]) => React.createElement('button', {
        key: mode, type: 'button', 'aria-pressed': kickoffMode === mode,
        onClick: () => { setKickoffDraft((value) => ({ ...value, mode })); void saveConfig({ kickoffMode: mode }); },
        style: { border: `1px solid ${kickoffMode === mode ? colors.brand : colors.border}`, borderRadius: 9, background: kickoffMode === mode ? 'rgba(77,107,254,.09)' : colors.background, color: kickoffMode === mode ? colors.brand : colors.primary, padding: '8px 7px', fontSize: 10, fontWeight: kickoffMode === mode ? 650 : 500, cursor: 'pointer' },
      }, label))),
    React.createElement('label', { style: { display: 'grid', gap: 4, color: colors.secondary, fontSize: 10 } }, strings.topicInput,
      React.createElement('textarea', {
        value: kickoffDraft.topic, rows: 2, placeholder: strings.topicPlaceholder,
        onChange: (event) => setKickoffDraft((value) => ({ ...value, topic: event.target.value })),
        onBlur: () => { void saveConfig({ researchTopic: kickoffDraft.topic }); },
        style: { boxSizing: 'border-box', width: '100%', minHeight: 52, resize: 'vertical', border: `1px solid ${colors.border}`, borderRadius: 9, background: colors.background, color: colors.primary, padding: '7px 8px', font: 'inherit', fontSize: 10, lineHeight: 1.4 },
      })),
    React.createElement('label', { style: { display: 'grid', gap: 4, color: colors.secondary, fontSize: 10 } }, strings.briefInput,
      React.createElement('textarea', {
        value: kickoffDraft.brief, rows: 2, placeholder: strings.briefPlaceholder,
        onChange: (event) => setKickoffDraft((value) => ({ ...value, brief: event.target.value })),
        onBlur: () => { void saveConfig({ researchBrief: kickoffDraft.brief }); },
        style: { boxSizing: 'border-box', width: '100%', minHeight: 48, resize: 'vertical', border: `1px solid ${colors.border}`, borderRadius: 9, background: colors.background, color: colors.primary, padding: '7px 8px', font: 'inherit', fontSize: 10, lineHeight: 1.4 },
      })),
    kickoffMode !== 'local' ? React.createElement('label', { style: { display: 'grid', gap: 4, color: colors.secondary, fontSize: 10 } }, strings.searchWindow,
      React.createElement('select', {
        value: kickoffDraft.searchWindow,
        onChange: (event) => { const searchWindow = event.target.value; setKickoffDraft((value) => ({ ...value, searchWindow })); void saveConfig({ searchWindow }); },
        style: { border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.background, color: colors.primary, padding: '6px 7px', fontSize: 10 },
      }, Object.entries(SEARCH_WINDOWS).map(([id, item]) => React.createElement('option', { key: id, value: id }, item[language])))) : React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', color: colors.secondary, fontSize: 10 } },
        React.createElement('span', null, `${report.candidateCount} ${strings.localFiles}`),
        smallButton(strings.rescan, { disabled: scan.status === 'scanning', onClick: () => setScanNonce((value) => value + 1), style: { padding: '5px 8px' } }),
        report.candidateCount === 0 ? React.createElement('span', { style: { color: colors.warning } }, strings.putFiles) : null),
    React.createElement('div', { style: { color: colors.dimmed, fontSize: 9, lineHeight: 1.4 } }, strings.noMove),
    React.createElement('div', { style: { display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' } },
      smallButton(strings.kickoffFill, { disabled: !inputActions || running, onClick: () => { void submitPrompt(kickoffPrompt(), false, 'topic'); } }),
      smallButton(sending ? strings.generating : strings.kickoffRun, { disabled: sending || running || !inputActions, onClick: () => { void submitPrompt(kickoffPrompt(), true, 'topic'); } }, true))),
  ) : null,
  view === 'tools' ? React.createElement(ProjectTransfer, { key: `transfer-${cwd}`, project, saveConfig, language }) : null,
  )) : null,
  view === 'flow' ? React.createElement(React.Fragment, null,
  React.createElement('ol', { style: { listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, padding: 0, margin: 0 } },
    stages.map((stage, index) => {
      const module = report.modules[stage.id];
      const tone = statusTone(module.status);
      const active = stage.id === selected.id;
      return React.createElement('li', { key: stage.id }, React.createElement('button', {
        type: 'button', 'aria-label': `${strings.inspect}：${stage[language]}`, 'aria-current': active ? 'step' : undefined,
        onClick: () => chooseStage(stage), style: { width: '100%', minHeight: 54, textAlign: 'left', border: active ? `1px solid ${colors.brand}` : `1px solid ${colors.border}`, borderRadius: 10, background: active ? 'rgba(77,107,254,.06)' : colors.surface, color: colors.primary, padding: '7px 8px', cursor: 'pointer' },
      },
      React.createElement('span', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 } },
        React.createElement('b', { style: { fontSize: 11 } }, stage[language]),
        React.createElement('span', { style: { width: 7, height: 7, borderRadius: '50%', background: tone.color } })),
      React.createElement('span', { style: { display: 'block', marginTop: 5, color: tone.color, fontSize: 9 } }, `${module.status === 'complete' ? strings.complete : module.status === 'partial' ? strings.partial : strings.empty}`),
      React.createElement('span', { style: { display: 'block', color: colors.secondary } }, STAGE_LABELS[project.stageStates[stage.id] ?? 'auto'][language === 'en' ? 1 : 0])));
    })),
  React.createElement('div', { role: 'progressbar', 'aria-label': language === 'zh' ? '研究者确认进度' : 'Researcher confirmed progress', 'aria-valuemin': 0, 'aria-valuemax': workflowIds.length, 'aria-valuenow': confirmedCount, style: { height: 5, borderRadius: 999, background: colors.border, overflow: 'hidden' } },
    React.createElement('div', { style: { height: '100%', width: `${Math.round(confirmedCount / workflowIds.length * 100)}%`, background: colors.brand, transition: 'width 180ms ease' } })),
  React.createElement('article', { 'data-testid': 'academic-paper-module-panel', style: { border: `1px solid ${colors.border}`, borderRadius: 12, background: colors.surface, padding: '11px 12px', display: 'grid', gap: 9 } },
    React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
      React.createElement('strong', { style: { fontSize: 12 } }, `${strings.module} · ${selected[language]}`),
      React.createElement('span', { style: { ...statusTone(selectedReport.status), padding: '2px 7px', borderRadius: 999, fontSize: 10 } }, selectedReport.status === 'complete' ? strings.complete : selectedReport.status === 'partial' ? strings.partial : strings.empty),
      React.createElement('span', { style: { color: colors.secondary, fontSize: 10 } }, `${strings.qualityGate}：${selected[language === 'zh' ? 'nextZh' : 'nextEn']}`)),
    React.createElement(StageControl, { stageId: selected.id, project, saveConfig, language, allowNA: workflowIds.length > 1 }),
    React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
      selectedReport.materialChecks.map((item) => React.createElement('span', { key: item.id, title: item.status === 'found' ? item.artifacts.join('\n') : undefined, style: { color: item.status === 'found' ? colors.success : colors.danger, background: item.status === 'found' ? 'rgba(22,137,92,.09)' : 'rgba(207,71,71,.08)', border: `1px solid ${item.status === 'found' ? 'rgba(22,137,92,.22)' : 'rgba(207,71,71,.18)'}`, borderRadius: 999, padding: '3px 8px', fontSize: 10 } }, `${item.status === 'found' ? '✓' : '○'} ${item[language]}`))),
    React.createElement('details', null,
      React.createElement('summary', { style: { color: colors.secondary, fontSize: 10, cursor: 'pointer' } }, `${strings.evidence} · ${selectedReport.artifactCount}`),
      selectedReport.artifacts.length ? React.createElement('ul', { style: { margin: '7px 0 0', paddingLeft: 19, color: colors.secondary, fontSize: 10, lineHeight: 1.55, overflowWrap: 'anywhere' } }, selectedReport.artifacts.map((path) => React.createElement('li', { key: path, title: path }, path))) : React.createElement('p', { style: { margin: '7px 0 0', color: colors.dimmed, fontSize: 10 } }, strings.noEvidence)),
    React.createElement('label', { style: { display: 'grid', gap: 4, color: colors.secondary, fontSize: 10 } }, `${strings.smartPrompt} · ${standard[language]}`,
      React.createElement('textarea', { 'data-testid': 'module-prompt', value: promptValue, rows: 3, onChange: (event) => setPrompts((value) => ({ ...value, [selected.id]: event.target.value })), style: { boxSizing: 'border-box', width: '100%', minHeight: 66, resize: 'vertical', border: `1px solid ${colors.border}`, borderRadius: 9, background: colors.background, color: colors.primary, padding: '8px 9px', font: 'inherit', lineHeight: 1.45 } })),
    React.createElement('div', { style: { display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' } },
      smallButton(strings.restore, { onClick: () => setPrompts((value) => { const next = { ...value }; delete next[selected.id]; return next; }) }),
      smallButton(strings.fill, { disabled: !inputActions || running, onClick: () => { void submitPrompt(modulePrompt(), false); } }),
      smallButton(sending ? strings.generating : strings.generate, { disabled: sending || running || !inputActions, onClick: () => { void submitPrompt(modulePrompt(), true); } }, true),
      actionMessage ? React.createElement('span', { role: 'status', style: { color: actionMessage === strings.sendError ? colors.danger : colors.success, fontSize: 10 } }, actionMessage) : null)),
  React.createElement('details', { 'data-testid': 'workflow-settings', style: { borderTop: `1px solid ${colors.border}`, paddingTop: 8 } },
    React.createElement('summary', { style: { color: colors.secondary, fontSize: 10, cursor: 'pointer' } }, strings.adjust),
    React.createElement('div', { style: { marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' } },
      React.createElement('span', { style: { color: colors.dimmed, fontSize: 10 } }, strings.customHelp),
      PAPER_STAGES.map((stage) => {
        const checked = workflowIds.includes(stage.id);
        return React.createElement('label', { key: stage.id, style: { display: 'inline-flex', gap: 4, alignItems: 'center', color: colors.secondary, fontSize: 10 } },
          React.createElement('input', { type: 'checkbox', checked, disabled: project.workflowMode !== 'custom' || (checked && workflowIds.length === 1), onChange: () => { const selectedIds = checked ? workflowIds.filter((id) => id !== stage.id) : [...workflowIds, stage.id]; void saveConfig({ workflow: PAPER_STAGES.map((item) => item.id).filter((id) => selectedIds.includes(id)) }); } }), stage[language]);
      }),
      smallButton(strings.rescan, { disabled: scan.status === 'scanning', onClick: () => setScanNonce((value) => value + 1) }))),
  Object.keys(project.stageStates).filter((id) => project.stageStates[id] === 'na').map((id) => React.createElement(StageControl, { key: id, stageId: id, project, saveConfig, language })),
  ) : null,
  );
}

function AcademicResearchCard({ scope, refreshCatalog }) {
  const strings = copy[locale()];
  const snapshot = useSettingsScope(scope);
  const [saving, setSaving] = React.useState(false);
  if (snapshot.status !== 'ready') return null;
  const enabled = snapshot.value?.enabled !== false;
  const writable = snapshot.writable && !saving;
  const toggle = async () => {
    if (!writable) return;
    setSaving(true);
    try { await scope.set('enabled', !enabled); refreshCatalog(); } finally { setSaving(false); }
  };
  return React.createElement('li', { 'data-testid': 'academic-research-settings-card', style: { listStyle: 'none', border: `1px solid ${colors.border}`, borderRadius: 12, background: colors.background, padding: '16px 18px', display: 'grid', gap: 12 } },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' } },
      React.createElement('div', null, React.createElement('div', { style: { color: colors.primary, fontSize: 15, fontWeight: 650 } }, strings.title), React.createElement('div', { style: { color: colors.secondary, fontSize: 12, marginTop: 3 } }, strings.description)),
      React.createElement('button', { type: 'button', role: 'switch', 'aria-checked': enabled, 'aria-label': strings.title, disabled: !writable, onClick: () => { void toggle(); }, style: { appearance: 'none', width: 44, minWidth: 44, height: 24, padding: 2, border: 0, borderRadius: 999, background: enabled ? colors.brand : colors.dimmed, cursor: writable ? 'pointer' : 'default', opacity: writable ? 1 : .55 } }, React.createElement('span', { style: { display: 'block', width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)', transform: enabled ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 160ms ease' } }))),
    React.createElement('div', { style: { color: enabled ? colors.success : colors.secondary, fontSize: 11, fontWeight: 600 } }, saving ? strings.saving : `${enabled ? strings.enabled : strings.disabled} · ${strings.live}`),
    React.createElement('p', { style: { margin: 0, color: colors.secondary, fontSize: 11, lineHeight: 1.5 } }, enabled ? strings.hintEnabled : strings.hintDisabled),
    !snapshot.writable ? React.createElement('p', { role: 'status', style: { margin: 0, color: colors.secondary, fontSize: 11 } }, strings.readOnly) : null);
}

export async function apply(ctx) {
  const disposeRemote = await ctx.remote.$mount(scanRemote);
  ctx.inject(['remote.researchLoom'], registerWorkbench);
  return disposeRemote;
}

function registerWorkbench(ctx) {
  const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE });
  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({ name: 'settings.plugin.item', key: SETTINGS_NAMESPACE }, () => React.createElement(AcademicResearchCard, { scope, refreshCatalog: () => ctx.emit('connection/reset') })));
  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
    name: 'conversation.session.header.actions',
    id: 'academic-research-paper-status',
    order: 15,
    label: 'Paper workbench',
  }, (props) => React.createElement(PaperStatusDock, { ...props, ctx, scope })));
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'academic-research-blank-session-kickoff',
    order: -20,
    label: 'Paper workbench for blank sessions',
  }, (props) => React.createElement(PaperStatusDock, { ...props, ctx, scope, heroOnly: true })));
}
