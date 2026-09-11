import * as React from 'react';
const h = React.createElement;
const block = { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 280, overflow: 'auto', font: 'inherit', padding: 10, background: 'var(--dsw-alias-bg-layer-2,#f7f8fb)' };
const kindLabels = { text: '文字修改', experiment: '需要真实实验或分析', decision: '需要作者决定' };
const stateLabels = { open: '待处理', partial: '部分处理', resolved: '模型报告已解决 · 待核验' };

export function ReviewIssueCards({ issues, selected = [], onSelect, canSelect, limit = 20 }) {
  return h('section', { 'aria-label': '逐条返修任务', style: { display: 'grid', gap: 14 } }, issues.map(item => {
    const selectable = canSelect && item.kind === 'text' && item.status !== 'resolved';
    return h('article', { key: item.id, style: { border: '1px solid var(--dsw-alias-border-l2,#dde1e8)', borderRadius: 8, padding: 12 } },
      h('strong', null, `${item.id} · ${stateLabels[item.status]}`),
      h('p', null, item.comment),
      h('small', null, `${kindLabels[item.kind]} · ${{high:'优先处理',medium:'随后处理',low:'可以稍后'}[item.priority]}`),
      h('p', null, `这条意见在要求什么：${item.explanation || item.action || '需要结合原文进一步确认。'}`),
      h('p', null, `位置：${item.location || '尚未定位'}`),
      item.applicability ? h('p', null, `对所选主稿的适用性：${{applicable:'适用；本轮处理状态见上方',addressed:'模型认为已有处理依据，请核对',uncertain:'尚待核对，不能直接假设适用'}[item.applicability]}`) : null,
      h('p', null, `下一步：${item.action}`),
      item.missingEvidence ? h('p', null, `还缺什么：${item.missingEvidence}`) : null,
      h('p', null, `怎样算完成：${item.completionCheck || (item.kind === 'text' ? '对照实际改文与原始意见，确认事实、引用及其他段落没有受到错误影响。' : '补齐真实记录或作者决定后，再核对该问题；文字润色不能代替完成。')}`),
      h('p', null, `模型提供的依据：${item.evidence || '尚缺可核验依据；不能据此声明已经完成。'}`),
      h('details', null, h('summary', null, '查看原始意见出处'), item.source
        ? h(React.Fragment, null, h('p', null, [item.source.path, item.source.reviewer, item.source.commentId, item.source.location].filter(Boolean).join(' · ') || '尚未定位出处'), h('blockquote', { style: { margin: '8px 0', whiteSpace: 'pre-wrap' } }, item.source.quote || '尚未提取原文'), h('small', null, '出处由模型提取，必要时对照原文件确认。'))
        : h('p', null, '这份记录未保留原文件出处。可查看来源回复；要核对原始意见，请从意见文件重新整理。')),
      selectable ? h('label', null, h('input', { type: 'checkbox', 'aria-label': `选择修改 ${item.id}`, checked: selected.includes(item.id),
        disabled: !selected.includes(item.id) && selected.length >= limit,
        onChange: e => onSelect(e.target.checked ? [...selected, item.id] : selected.filter(id => id !== item.id)) }), ' 本轮处理这一项') : null);
  }));
}

export function ReviewEvidencePanel({ manuscript, revised, inspectChanges, disabled }) {
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const generation = React.useRef(0);
  React.useEffect(() => { generation.current++; setResult(null); setError(''); setBusy(false); return () => { generation.current++; }; }, [manuscript, revised, inspectChanges]);
  return h('section', { 'aria-label': '实际文件对照' },
    h('button', { type: 'button', style: { boxSizing: 'border-box', width: '100%', padding: 10, minHeight: 42, border: '1px solid var(--dsw-alias-border-l2,#dde1e8)', borderRadius: 8, font: 'inherit', cursor: 'pointer', color: 'inherit', background: 'var(--dsw-alias-bg-layer-1,#fff)' }, disabled: disabled || busy || !manuscript || !revised || typeof inspectChanges !== 'function',
      onClick: async () => {
        const epoch = ++generation.current;
        setBusy(true); setResult(null); setError('');
        try { const value = await inspectChanges({ manuscript, revised }); if (generation.current === epoch) setResult(value); }
        catch (failure) { if (generation.current === epoch) setError(failure.message); }
        finally { if (generation.current === epoch) setBusy(false); }
      } }, busy ? '正在读取文件…' : '查看实际文件差异（不调用模型）'),
    !inspectChanges ? h('small', null, '当前宿主未提供内容对照，请升级插件后重新加载。') : null,
    error ? h('p', { role: 'alert' }, `未完成文件对照：${error}`) : null,
    result ? h(React.Fragment, null,
      h('p', { role: 'status' }, result.status === 'unsupported' ? '当前格式无法在此对照' : result.same ? '当前两份文件内容相同，尚未看到内容修改。' : '当前两份文件存在内容差异，以下供你逐项检查。'),
      h('small', null, result.notice),
      result.status === 'available' && !result.same ? h(React.Fragment, null, ...[['before', '原稿'], ['after', '修订稿']].map(([key, label]) => h('div', { key },
        h('p', null, `${label} · ${result[key].endLine < result[key].startLine ? '此处没有对应行' : `第 ${result[key].startLine}–${result[key].endLine} 行`}`),
        h('pre', { style: block }, result[key].text || '（空）'),
        result[key].truncated ? h('strong', null, '内容已截断，请在编辑器查看完整差异。') : null))) : null,
      result.status === 'available' ? h('details', null, h('summary', null, '本次读取的文件指纹'), h('p', { style: { overflowWrap: 'anywhere' } }, `原稿 SHA-256：${result.originalHash}`), h('p', { style: { overflowWrap: 'anywhere' } }, `修订稿 SHA-256：${result.revisedHash}`)) : null) : null);
}

export function reviewChecklist(loop, result) {
  return [`# 返修检查清单`, '', '此清单记录模型报告和待核验事项，不是已完成返修的声明或自动生成的学术证据。', '',
    `原稿：${result.manuscript}`, `修订稿：${result.revised || loop.recoveryRevised || '尚未确认'}`, `本轮状态：${loop.status}`, '',
    ...result.issues.flatMap(item => [`## ${item.id} · ${stateLabels[item.status]}`, '', item.comment, '',
      `类别：${kindLabels[item.kind]}`, `位置：${item.location}`, `下一步：${item.action}`, `完成条件：${item.completionCheck || '需对照原意见和真实材料核验'}`,
      `模型提供的依据：${item.evidence || '待补充'}`,
      `来源：${item.source ? [item.source.path, item.source.reviewer, item.source.commentId, item.source.location].filter(Boolean).join(' · ') : '仅有来源回复，尚未定位原文件'}`,
      ...(item.source?.quote ? ['原文：', item.source.quote] : []), '', '- [ ] 作者已对照实际稿件和证据检查', '', '**逐条回复草稿（由作者依据实际完成情况填写）**', '处理方式：待填写；实际修改位置与内容：待填写；尚未完成事项或未采纳理由：待填写。', '']),
    ...(loop.message ? ['当前阻碍：', loop.message, ''] : [])].join('\n');
}
