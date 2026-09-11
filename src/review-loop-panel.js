import * as React from 'react';
import { LOOP_LIMIT, completedReplies, conversationNodes, nodeText, normalizeReviewLoop, observeLoop, parseLoopResult, loopPrompt, loopErrorIdentity, validateLoopFiles, validateLoopLaunch } from './review-loop.js';
const h = React.createElement;
const field = { boxSizing: 'border-box', width: '100%', padding: 9, border: '1px solid var(--dsw-alias-border-l2,#dde1e8)', borderRadius: 8, background: 'var(--dsw-alias-bg-layer-1,#fff)', color: 'inherit', font: 'inherit' };
const btn = { ...field, cursor: 'pointer' };
const labels = { plan: '问题整理', revise: '修改新稿', verify: '对照复核' };
const statuses = { awaiting: '等待对应回复', running: '执行中', ready: '等待授权修改', blocked: '需要处理阻碍', paused: '自动衔接已暂停', done: '本轮结束 · 待作者核验' };

export function ReviewLoopPanel({ project, conversation, input, inputActions, cwd, sessionId, saveConfig, validateFiles, writable, enabled }) {
  const loop = normalizeReviewLoop(project.reviewLoop);
  const replies = completedReplies(conversation);
  const [sourceSeq, setSourceSeq] = React.useState('');
  const [manuscript, setManuscript] = React.useState('');
  const [scope, setScope] = React.useState('');
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
  live.current = { conversation, input, inputActions, cwd, sessionId, writable, enabled, project, validateFiles };
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; autoPermit.current = ''; executionEpoch.current++; }; }, []);
  React.useEffect(() => { autoPermit.current = ''; executionEpoch.current++; }, [cwd, sessionId, enabled, writable]);
  const source = replies.find((item) => String(item.seq) === sourceSeq) ?? replies[0];
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
      return epoch === executionEpoch.current && mounted.current && current.cwd === cwd && current.sessionId === sessionId && current.enabled && current.writable && !current.conversation.running && !current.input?.draft?.trim() && (!current.input?.phase || current.input.phase === 'plain') && !current.project.tasks.some((task) => task.sessionId === sessionId && ['awaiting', 'running', 'checking'].includes(task.status));
    };
    if (!canLaunch()) {
      autoPermit.current = ''; setError('自动衔接已暂停：请清空或发送当前草稿，并等待现有任务结束。'); return false;
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
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await operation(); } catch { setError('操作失败，未自动继续，请重试。'); autoPermit.current = ''; }
    finally { release(); if (mounted.current) setBusy(false); }
  };
  const last = loop?.history.at(-1)?.result;
  const sameSession = loop?.sessionId === sessionId;
  return h('details', { 'data-testid': 'review-loop', style: { borderTop: '1px solid var(--dsw-alias-border-l2,#dde1e8)', paddingTop: 14 } },
    h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, loop ? `审稿闭环 · ${statuses[loop.status]}` : '已有审稿结果？接着修改与复核'),
    h('div', { style: { display: 'grid', gap: 12, paddingTop: 14, minWidth: 0, overflowWrap: 'anywhere' } },
      h('small', null, '选定一份已结束的审稿回复，自动整理问题。确认范围后，最多执行一次修改和一次只读复核；每轮需重新授权，最多两轮。会使用当前模型额度。'),
      error ? h('p', { role: 'alert' }, error) : null,
      !available ? h('small', null, '需要可写设置、可用模型和空对话框，且当前没有执行中的任务。不会覆盖现有草稿。') : null,
      h('details', { open: !loop }, h('summary', { style: { cursor: 'pointer' } }, loop ? '选择其他审稿回复 / 开始新闭环' : '选择已完成的审稿回复'),
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
        h('small', null, `来源：审稿回复 ${loop.sourceSeq} / 轮次 ${loop.sourceTurn}；仅采集助手正文，不采集推理内容。`),
        !sameSession ? h('p', null, '此闭环属于另一会话；回到原会话后才可继续，避免串用结果。') : null,
        loop.message ? h('p', { role: 'status' }, loop.message) : null,
        last ? h('section', { style: { display: 'grid', gap: 9 } }, h('p', null, last.summary),
          h('small', null, `模型报告：已解决 ${last.issues.filter((item) => item.status === 'resolved').length} / ${last.issues.length} 项；仅为待作者核验的判断。`),
          h('small', null, `原稿：${last.manuscript || '未确定'}${last.revised ? `；修订稿：${last.revised}` : ''}`),
          last.issues.map((item) => h('details', { key: item.id }, h('summary', null, `${item.id} · ${{open:'未解决',partial:'部分解决',resolved:'模型认为已解决'}[item.status]} · ${item.comment.slice(0, 45)}`),
            h('p', null, item.comment), h('p', null, `类别：${{text:'文字修改',experiment:'需真实实验/分析',decision:'作者决定'}[item.kind]} · 优先级 ${item.priority}`),
            h('p', null, `位置：${item.location}`), h('p', null, `行动：${item.action}`), h('p', null, `证据：${item.evidence || '尚未核验'}`))),
          h('details', null, h('summary', null, '历史轮次与证据'), loop.history.map((item, index) => h('div', { key: index },
            h('small', null, `${labels[item.phase]} · 会话 ${loop.sessionId} · 用户消息 ${item.userSeq} → 助手消息 ${item.assistantSeq} · 轮次 ${item.turn}`),
            h('pre', { style: { whiteSpace: 'pre-wrap', maxHeight: 180, overflow: 'auto' } }, item.raw))))) : null,
        last && !active && sameSession && ['ready', 'done'].includes(loop.status) && loop.round < LOOP_LIMIT && last.issues.some((item) => item.kind === 'text' && item.status !== 'resolved') ? h(React.Fragment, null,
          h('label', null, '本轮授权的文字修改范围', h('textarea', { style: field, 'aria-label': '本轮授权范围', value: scope, maxLength: 4000, placeholder: '例如：仅修改 R1.1、R1.3 涉及的引言与讨论，保留数据和结论。', onChange: (e) => setScope(e.target.value) })),
          h('label', null, h('input', { type: 'checkbox', checked: autoVerify, onChange: (e) => setAutoVerify(e.target.checked) }), ' 修改后自动只读复核（合计最多两次模型任务）'),
          h('button', { style: btn, disabled: !available || busy || !scope.trim() || !last.issues.some((item) => item.kind === 'text' && item.status !== 'resolved'), onClick: () => run(() => launch({ ...loop, scope: scope.trim(), round: loop.round + 1 }, 'revise', '', true)) }, '授权本轮修改并执行')) : null,
        sameSession && loop.status === 'paused' && last?.phase === 'revise' ? h('button', { style: btn, disabled: !available || busy, onClick: () => run(() => launch(loop, 'verify')) }, '继续只读复核') : null,
        active && sameSession ? h(React.Fragment, null,
          h('button', { style: btn, onClick: () => { autoPermit.current = ''; executionEpoch.current++; setError('已暂停后续自动复核；已发送的任务仍在运行，如需中止请使用 DSH 停止按钮。'); } }, '暂停后续自动执行'),
          !conversation.running ? h('button', { style: btn, disabled: busy, onClick: () => run(() => { autoPermit.current = ''; return write({ ...loop, status: 'paused', message: '用户结束等待；可在主对话检查结果并以所选回复重新整理。' }, loop); }) }, '结束等待，不再自动衔接') : null) : null,
        loop.status === 'done' ? h('small', null, loop.round >= LOOP_LIMIT ? '已达到本闭环两轮上限，停止自动推进。请核验剩余问题并决定后续研究工作。' : '本轮已结束。实验与作者决策项需要你处理；有未解决的文字问题时可再授权一轮。') : null,
        h('button', { style: btn, onClick: () => {
          const url = URL.createObjectURL(new Blob([JSON.stringify(loop, null, 2)], { type: 'application/json' }));
          const a = document.createElement('a'); a.href = url; a.download = `research-loom-review-${loop.id}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        } }, '导出本闭环记录'),
        h('small', null, '收起工作台、关闭页面、切换工作区或刷新会撤销自动续行许可；返回后可检查已完成结果并手动继续。不会自动确认研究阶段或提交论文。')) : null));
}
