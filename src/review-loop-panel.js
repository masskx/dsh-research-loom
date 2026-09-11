import * as React from 'react';
import { LOOP_LIMIT, ISSUE_SELECTION_LIMIT, buildIssueScope, lastReadyResult, completedReplies, conversationNodes, nodeText, normalizeReviewLoop, observeLoop, parseLoopResult, loopPrompt, loopErrorIdentity, validateLoopFiles, validateLoopLaunch } from './review-loop.js';
import { ReviewIssueCards, ReviewEvidencePanel, reviewChecklist } from './review-evidence.js';
import { inspectRevisionIntake, revisionIntakeIdentity } from './revision-intake.js';
const h = React.createElement;
const field = { boxSizing: 'border-box', width: '100%', padding: 9, border: '1px solid var(--dsw-alias-border-l2,#dde1e8)', borderRadius: 8, background: 'var(--dsw-alias-bg-layer-1,#fff)', color: 'inherit', font: 'inherit' };
const btn = { ...field, cursor: 'pointer' };
const labels = { plan: '问题整理', revise: '修改新稿', verify: '对照复核' };
const statuses = { awaiting: '等待对应回复', running: '执行中', ready: '等待授权修改', blocked: '需要处理阻碍', paused: '自动衔接已暂停', done: '本轮结束 · 待作者核验' };

export function ReviewLoopPanel({ project, conversation, input, inputActions, cwd, sessionId, saveConfig, validateFiles, inspectChanges, report, controllerRef, writable, enabled }) {
  const loop = normalizeReviewLoop(project.reviewLoop);
  const replies = completedReplies(conversation);
  const [sourceSeq, setSourceSeq] = React.useState('');
  const [manuscript, setManuscript] = React.useState('');
  const [scope, setScope] = React.useState('');
  const [selected, setSelected] = React.useState([]);
  const [recoveryPath, setRecoveryPath] = React.useState('');
  const [autoVerify, setAutoVerify] = React.useState(true);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [observationTick, setObservationTick] = React.useState(0);
  const lock = React.useRef(false);
  const observationPending = React.useRef(false);
  const live = React.useRef(null);
  const autoPermit = React.useRef('');
  const executionEpoch = React.useRef(0);
  const mounted = React.useRef(true);
  live.current = { conversation, input, inputActions, cwd, sessionId, writable, enabled, project, validateFiles, report };
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; autoPermit.current = ''; executionEpoch.current++; }; }, []);
  React.useEffect(() => { autoPermit.current = ''; executionEpoch.current++; }, [cwd, sessionId, enabled, writable]);
  React.useEffect(() => { setSelected([]); setScope(''); setRecoveryPath(loop?.recoveryRevised || ''); }, [loop?.id, loop?.requestId]);
  const source = replies.find((item) => String(item.seq) === sourceSeq) ?? replies[0];
  const sourceMatches = !loop?.intakeIdentity || (project.revisionIntake?.confirmed && loop.intakeIdentity === revisionIntakeIdentity(project.revisionIntake));
  React.useEffect(() => { if (!sourceMatches) { autoPermit.current = ''; executionEpoch.current++; } }, [sourceMatches]);
  const active = loop && ['awaiting', 'running'].includes(loop.status);
  const otherTask = project.tasks.some((task) => task.sessionId === sessionId && ['awaiting', 'running', 'checking'].includes(task.status));
  const available = writable && enabled && !conversation.running && !input?.draft?.trim() && (!input?.phase || input.phase === 'plain') && !otherTask;
  const write = (next, expected) => saveConfig((latest) => {
    if (!mounted.current || live.current.cwd !== cwd || live.current.sessionId !== sessionId || !live.current.enabled || !live.current.writable) throw new Error('Workspace or session changed');
    const stored = normalizeReviewLoop(latest.reviewLoop);
    if (expected && (stored?.id !== expected.id || stored?.requestId !== expected.requestId)) throw new Error('Loop changed');
    const serialized = JSON.stringify(next);
    if (serialized.length > 750000) throw new Error('Review history too large; export and start a smaller batch');
    return { reviewLoop: serialized };
  });
  const release = () => {
    lock.current = false;
    // A final reply or a saved binding may arrive while a write is pending.
    // Replay only when a newer snapshot was skipped, so a failed save cannot
    // schedule itself repeatedly against unchanged state.
    if (observationPending.current) {
      observationPending.current = false;
      if (mounted.current) setObservationTick((value) => value + 1);
    }
  };
  const launch = async (base, phase, sourceText = '', authorize = false) => {
    const epoch = executionEpoch.current;
    const canLaunch = () => {
      const current = live.current;
      return epoch === executionEpoch.current && mounted.current && current.cwd === cwd && current.sessionId === sessionId && current.enabled && current.writable && !current.conversation.running && !current.input?.draft?.trim() && (!current.input?.phase || current.input.phase === 'plain') && !current.project.tasks.some((task) => task.sessionId === sessionId && ['awaiting', 'running', 'checking'].includes(task.status))
        && (!base.intakeIdentity || (current.project.revisionIntake?.confirmed && base.intakeIdentity === revisionIntakeIdentity(current.project.revisionIntake)));
    };
    if (!canLaunch()) {
      autoPermit.current = ''; setError('自动衔接已暂停：请清空或发送当前草稿，并等待现有任务结束。'); return false;
    }
    if (base.intakeIdentity && (!live.current.project.revisionIntake?.confirmed || base.intakeIdentity !== revisionIntakeIdentity(live.current.project.revisionIntake))) {
      autoPermit.current = ''; setError('本轮材料选择已改变，请恢复原选择，或从新材料开始新的返修记录。'); return false;
    }
    let validated;
    try { validated = await validateLoopLaunch(base, phase, live.current.validateFiles); }
    catch (failure) { autoPermit.current = ''; if (mounted.current) setError(`稿件核验失败：${failure.message}。未发送任务。`); return false; }
    if (!canLaunch()) { autoPermit.current = ''; return false; }
    const current = live.current;
    const baselineAgentError = loopErrorIdentity(current.conversation.lastAgentError);
    const baselinePromptError = loopErrorIdentity(current.conversation.promptError);
    const next = { ...validated, phase, status: 'awaiting', message: '', requestId: crypto.randomUUID(), requestUserSeq: 0, requestTurn: 0,
      baselineAgentError, baselinePromptError, agentErrorCleared: !baselineAgentError, promptErrorCleared: !baselinePromptError,
      baselineSeq: Math.max(0, ...conversationNodes(current.conversation).map((node) => node.seq || 0)) };
    if (!await write(next, loop?.id === base.id ? base : null)) { autoPermit.current = ''; setError('保存任务失败，未发送。'); return false; }
    const after = live.current;
    if (!canLaunch()) {
      autoPermit.current = ''; if (mounted.current && after.cwd === cwd && after.sessionId === sessionId && after.enabled && after.writable) await write({ ...next, status: 'paused', message: '发送前会话或草稿发生变化，未发送。' }, next); return false;
    }
    if (authorize) autoPermit.current = autoVerify ? next.id : '';
    try {
      after.inputActions.setDraft(loopPrompt(next, sourceText));
      after.inputActions.submit();
      return true;
    } catch {
      autoPermit.current = ''; await write({ ...next, status: 'blocked', message: '发送失败，请检查主对话。' }, next); return false;
    }
  };

  React.useEffect(() => {
    if (lock.current) { observationPending.current = true; return; }
    if (!loop || loop.sessionId !== sessionId || !active || !writable || !enabled) return;
    const observation = observeLoop(loop, conversation);
    const errorsUnchanged = loop.agentErrorCleared === observation.agentErrorCleared && loop.promptErrorCleared === observation.promptErrorCleared;
    if (observation.kind === 'waiting' && errorsUnchanged && (!observation.accepted || (loop.status === 'running' && loop.requestUserSeq === observation.requestUserSeq && loop.requestTurn === observation.requestTurn))) return;
    lock.current = true;
    const epoch = executionEpoch.current;
    const sameContext = () => mounted.current && live.current.cwd === cwd && live.current.sessionId === sessionId && live.current.enabled && live.current.writable;
    const process = async () => {
      if (observation.kind === 'waiting') {
        if (!await write({ ...loop, agentErrorCleared: observation.agentErrorCleared, promptErrorCleared: observation.promptErrorCleared,
          ...(observation.accepted ? { status: 'running', requestUserSeq: observation.requestUserSeq, requestTurn: observation.requestTurn } : {}) }, loop)) throw new Error('Could not save request binding');
        return;
      }
      if (observation.kind === 'blocked') { autoPermit.current = ''; await write({ ...loop, status: 'blocked', message: observation.message }, loop); return; }
      let result;
      try { result = await validateLoopFiles(parseLoopResult(observation.raw, loop), loop, validateFiles); }
      catch (failure) { autoPermit.current = ''; if (sameContext()) await write({ ...loop, status: 'blocked', message: `结果核验失败：${failure.message}。原回复保留在主对话，可选择该回复重新整理。` }, loop); return; }
      if (!sameContext()) { autoPermit.current = ''; return; }
      const latestObservation = observeLoop(loop, live.current.conversation);
      if (latestObservation.kind !== 'result' || latestObservation.assistantSeq !== observation.assistantSeq || latestObservation.raw !== observation.raw) {
        observationPending.current = true;
        return;
      }
      const history = [...loop.history, { phase: loop.phase, requestId: loop.requestId, ...observation, result }].slice(-7);
      const next = { ...loop, history, manuscript: result.outcome === 'ready' ? result.manuscript : loop.manuscript,
        status: result.outcome === 'blocked' ? 'blocked' : loop.phase === 'plan' ? 'ready' : loop.phase === 'verify' ? 'done' : 'paused', message: result.outcome === 'blocked' ? result.blockers.join('；') : '' };
      if (!await write(next, loop)) { autoPermit.current = ''; return; }
      if (loop.phase === 'revise' && result.outcome === 'ready' && autoPermit.current === loop.id && sameContext() && epoch === executionEpoch.current) {
        // One authorized revision permits exactly one read-only verification.
        autoPermit.current = '';
        await launch(next, 'verify');
      }
    };
    void process().catch(() => { autoPermit.current = ''; if (mounted.current) setError('结果保存或衔接失败，请检查任务状态。'); }).finally(release);
  }, [project.reviewLoop, conversation, writable, enabled, cwd, sessionId, observationTick]);

  const run = async (operation) => {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setError('');
    try { return await operation(); } catch (failure) { setError(`操作未完成：${failure.message || '请重试'}`); autoPermit.current = ''; return false; }
    finally { release(); if (mounted.current) setBusy(false); }
  };
  const last = loop ? lastReadyResult(loop) : null;
  const sameSession = loop?.sessionId === sessionId;
  const canChoose = last && !active && sameSession && sourceMatches && ['ready', 'done'].includes(loop.status) && loop.round < LOOP_LIMIT
    && last.issues.some(item => item.kind === 'text' && item.status !== 'resolved');
  const outputPath = loop?.recoveryRevised || last?.revised || '';
  const recoveryAllowed = last && sameSession && ['blocked', 'paused'].includes(loop.status) && ['revise', 'verify'].includes(loop.phase);
  React.useImperativeHandle(controllerRef, () => ({ startFromFiles: intake => run(async () => {
    const current = live.current;
    const checked = inspectRevisionIntake(intake, current.project, current.report);
    if (!checked.confirmed || revisionIntakeIdentity(intake) !== revisionIntakeIdentity(current.project.revisionIntake)
      || !current.project.revisionIntake?.confirmed) throw new Error('请先确认当前主稿和原始意见来源');
    if (active) throw new Error('请等待当前返修任务结束');
    if (loop && !globalThis.confirm('开始新一轮意见整理会替换当前返修记录。需要保留时请先导出。继续？')) return false;
    autoPermit.current = '';
    return launch({ version: 1, id: crypto.randomUUID(), sessionId, phase: 'plan', status: 'awaiting', requestId: '', baselineSeq: 0,
      round: 0, manuscript: checked.intake.manuscript, scope: '', history: [], message: '', sourceSeq: 0, sourceTurn: 0,
      intakeIdentity: revisionIntakeIdentity(checked.intake),
      sourceType: 'files', sourceFiles: checked.intake.reviewFiles, reviewRound: checked.intake.round, reviewRelationship: checked.intake.relationship }, 'plan');
  }) }));
  const download = (body, name, type) => {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return h('details', { open: loop?.sourceType === 'files' || undefined, 'data-testid': 'review-loop', style: { borderTop: '1px solid var(--dsw-alias-border-l2,#dde1e8)', paddingTop: 14 } },
    h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, loop ? `审稿闭环 · ${statuses[loop.status]}` : '已有审稿结果？接着修改与复核'),
    h('div', { style: { display: 'grid', gap: 12, paddingTop: 14, minWidth: 0, overflowWrap: 'anywhere' } },
      h('small', null, '可从上方确认的原始意见文件直接整理，也可接续已有回复。选择具体任务后，每轮最多修改一次并只读复核一次；最多两轮，会使用当前模型额度。'),
      error ? h('p', { role: 'alert' }, error) : null,
      !available ? h('small', null, '需要可写设置、可用模型和空对话框，且当前没有执行中的任务。不会覆盖现有草稿。') : null,
      h('details', { open: !loop && project.entryScenario !== 'revision' }, h('summary', { style: { cursor: 'pointer' } }, loop ? '高级：选择其他审稿回复 / 开始新记录' : '已有对话诊断？接续已完成的回复'),
      h('label', null, '接续哪份回复', h('select', { style: { ...field, minWidth: 0 }, 'aria-label': '接续哪份回复', value: source ? String(source.seq) : '', onChange: (e) => setSourceSeq(e.target.value) },
        !replies.length ? h('option', { value: '' }, '当前已加载对话没有完整回复') : null,
        replies.map((item) => h('option', { key: item.seq, value: item.seq }, `轮次 ${item.turn} · ${nodeText(item).replace(/\s+/g, ' ').slice(0, 65)}`)))),
      source ? h('details', null, h('summary', null, '预览所选回复'), h('pre', { style: { whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto', font: 'inherit' } }, nodeText(source).slice(0, 4000))) : null,
      h('label', null, '原稿路径（建议填写）', h('input', { style: field, 'aria-label': '闭环原稿路径', value: manuscript, maxLength: 1000, placeholder: '例如 paper/main.docx', onChange: (e) => setManuscript(e.target.value) })),
      h('button', { style: btn, disabled: !available || active || busy || !source, onClick: () => run(async () => {
        if (nodeText(source).length > 24000) { setError('该回复超过 24,000 字符，请先在对话中分批整理意见。'); return; }
        autoPermit.current = '';
        await launch({ version: 1, id: crypto.randomUUID(), sessionId, phase: 'plan', status: 'awaiting', requestId: '', baselineSeq: 0, round: 0, manuscript, scope: '', history: [], message: '', sourceSeq: source.seq, sourceTurn: source.turn }, 'plan', nodeText(source));
      }) }, loop ? '以所选回复开始新闭环（替换当前记录）' : '整理这份审稿结果')),
      loop ? h(React.Fragment, null,
        h('strong', null, `${labels[loop.phase]} · ${statuses[loop.status]} · ${loop.round}/${LOOP_LIMIT} 轮`),
        h('small', null, loop.sourceType === 'files' ? `来源文件：${loop.sourceFiles.join('；')}；审稿轮次：${loop.reviewRound || '尚不确定'}；${{current:'作者认为对应当前稿',historical:'历史意见，须核对适用性',unknown:'对应版本尚待核对'}[loop.reviewRelationship]}` : `来源：审稿回复 ${loop.sourceSeq} / 轮次 ${loop.sourceTurn}；仅采集助手正文，不采集推理内容。`),
        !sameSession ? h('p', null, '此闭环属于另一会话；回到原会话后才可继续，避免串用结果。') : null,
        !sourceMatches ? h('p', { role: 'status' }, '材料选择已经改变。以下记录仍属于原先的主稿和意见；请恢复并确认原选择，或从新材料开始新的返修记录。') : null,
        loop.message ? h('p', { role: 'status' }, loop.message) : null,
        last ? h('section', { style: { display: 'grid', gap: 9 } }, h('p', null, last.summary),
          h('small', null, `模型报告：已解决 ${last.issues.filter((item) => item.status === 'resolved').length} / ${last.issues.length} 项；仅为待作者核验的判断。`),
          h('small', null, `原稿：${last.manuscript || '未确定'}${last.revised ? `；修订稿：${last.revised}` : ''}`),
          canChoose ? h('div', null, h('p', null, '下一步：选择本轮要处理的文字问题。实验与作者决策项会保留待办。'),
            h('button', { style: btn, disabled: !available || busy, onClick: () => {
              const candidates = last.issues.filter(item => item.kind === 'text' && item.status !== 'resolved');
              const ranks = { high: 0, medium: 1, low: 2 };
              const first = [...candidates].sort((a, b) => ranks[a.priority] - ranks[b.priority])[0];
              setSelected(first ? [first.id] : []);
            } }, '先选择一项文字任务'), h('small', null, '按模型建议的优先级选择一项，你仍需核对其依据；不是对难度或耗时的保证。')) : null,
          h(ReviewIssueCards, { issues: last.issues, selected, onSelect: setSelected, canSelect: canChoose && available && !busy, limit: ISSUE_SELECTION_LIMIT }),
          outputPath ? h(ReviewEvidencePanel, { key: `${loop.id}-${outputPath}`, manuscript: loop.manuscript || last.manuscript, revised: outputPath, inspectChanges, disabled: active || !enabled || !sameSession }) : null,
          h('details', null, h('summary', null, '历史轮次与证据'), loop.history.map((item, index) => h('div', { key: index },
            h('small', null, `${labels[item.phase]} · 会话 ${loop.sessionId} · 用户消息 ${item.userSeq} → 助手消息 ${item.assistantSeq} · 轮次 ${item.turn}`),
            h('pre', { style: { whiteSpace: 'pre-wrap', maxHeight: 180, overflow: 'auto' } }, item.raw))))) : null,
        canChoose && last.issues.some((item) => item.kind === 'text' && item.status !== 'resolved') ? h(React.Fragment, null,
          h('strong', null, `本轮已选 ${selected.length} 项${selected.length ? `：${selected.join('、')}` : ''}（最多 ${ISSUE_SELECTION_LIMIT} 项）`),
          h('details', null, h('summary', null, selected.length ? '补充要求（可选）' : '熟悉返修流程？填写自定义范围'),
            h('label', null, '本轮授权的文字修改范围', h('textarea', { style: field, 'aria-label': '本轮授权范围', value: scope, maxLength: selected.length ? 1000 : 4000, placeholder: selected.length ? '例如：保留现有术语；不要改变摘要长度。' : '例如：仅修改 R1.1 涉及的引言；也可以直接勾选上方任务。', onChange: (e) => setScope(e.target.value) }))),
          h('label', null, h('input', { type: 'checkbox', checked: autoVerify, onChange: (e) => setAutoVerify(e.target.checked) }), ' 修改后自动只读复核（合计最多两次模型任务）'),
          h('button', { style: btn, disabled: !available || busy || (!selected.length && !scope.trim()), onClick: () => run(() => launch({ ...loop,
            selectedIssueIds: selected, recoveryRevised: '', scope: selected.length ? buildIssueScope(last.issues, selected, scope.trim()) : scope.trim(), round: loop.round + 1 }, 'revise', '', true)) }, '授权本轮修改并执行')) : null,
        sameSession && loop.status === 'paused' && last?.phase === 'revise' ? h('button', { style: btn, disabled: !available || busy, onClick: () => run(() => launch(loop, 'verify')) }, '继续只读复核') : null,
        recoveryAllowed ? h('section', { 'aria-label': '中断恢复', style: { display: 'grid', gap: 9 } },
          h('strong', null, '中断后继续检查已有稿件'),
          h('p', null, '本轮没有确认完整结果，文件可能已生成。保留已有问题清单；指定实际修订稿后，只读核对，不重复修改，也不提前标记成功。'),
          h('label', null, '待检查的修订稿路径', h('input', { style: field, 'aria-label': '恢复修订稿路径', value: recoveryPath, maxLength: 1000, placeholder: '例如 paper/revised-1.tex', onChange: e => setRecoveryPath(e.target.value) })),
          recoveryPath.trim() ? h(ReviewEvidencePanel, { manuscript: loop.manuscript, revised: recoveryPath.trim(), inspectChanges, disabled: active || !enabled || !sameSession }) : null,
          h('button', { style: btn, disabled: !available || busy || !recoveryPath.trim(), onClick: () => run(() => {
            autoPermit.current = '';
            return launch({ ...loop, recoveryRevised: recoveryPath.trim() }, 'verify');
          }) }, '只读检查这份稿件并恢复记录'), h('small', null, '会发送一次模型复核任务。路径不正确、与原稿相同或仍遇到服务错误时，不会自动重试。')) : null,
        sameSession && loop.status === 'blocked' && loop.phase === 'verify' && last?.phase === 'revise' && !loop.recoveryRevised ? h('button', { style: btn, disabled: !available || busy, onClick: () => run(() => launch(loop, 'verify')) }, '重试上次只读复核') : null,
        active && sameSession ? h(React.Fragment, null,
          h('button', { style: btn, onClick: () => { autoPermit.current = ''; executionEpoch.current++; setError('已暂停后续自动复核；已发送的任务仍在运行，如需中止请使用 DSH 停止按钮。'); } }, '暂停后续自动执行'),
          !conversation.running ? h('button', { style: btn, disabled: busy, onClick: () => run(() => { autoPermit.current = ''; return write({ ...loop, status: 'paused', message: '用户结束等待；可在主对话检查结果并以所选回复重新整理。' }, loop); }) }, '结束等待，不再自动衔接') : null) : null,
        loop.status === 'done' ? h('small', null, loop.round >= LOOP_LIMIT ? '已达到本闭环两轮上限，停止自动推进。请核验剩余问题并决定后续研究工作。' : '本轮已结束。实验与作者决策项需要你处理；有未解决的文字问题时可再授权一轮。') : null,
        last ? h('button', { style: btn, onClick: () => download(reviewChecklist(loop, last), `research-loom-revision-${loop.id}.md`, 'text/markdown;charset=utf-8') }, '导出返修检查清单与回复填写模板') : null,
        h('button', { style: btn, onClick: () => download(JSON.stringify(loop, null, 2), `research-loom-review-${loop.id}.json`, 'application/json') }, '导出本闭环记录'),
        h('small', null, '收起工作台、关闭页面、切换工作区或刷新会撤销自动续行许可；返回后可检查已完成结果并手动继续。不会自动确认研究阶段或提交论文。')) : null));
}
