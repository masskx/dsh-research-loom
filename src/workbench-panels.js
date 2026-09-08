import * as React from 'react';
import { PAPER_STAGES, STAGE_MATERIALS, normalizeRelativeRoot, exportProjectSnapshot, importProjectSnapshot } from './paper-state.js';

const h = React.createElement;
const box = { display: 'grid', gap: 12, border: '1px solid var(--dsw-alias-border-l2, #dde1e8)', borderRadius: 12, padding: 14 };
const field = { boxSizing: 'border-box', width: '100%', padding: '9px 10px', font: 'inherit', color: 'inherit', background: 'var(--dsw-alias-bg-layer-1, #fff)', border: '1px solid #cbd0da', borderRadius: 8 };
const button = { ...field, width: 'auto', cursor: 'pointer', fontSize: 13 };
export const STAGE_LABELS = {
  auto: ['自动 · 待核验', 'Auto · unverified'], 'not-started': ['未开始', 'Not started'], working: ['进行中', 'In progress'],
  review: ['待核验', 'To verify'], confirmed: ['研究者已确认', 'Researcher confirmed'], na: ['不适用', 'Not applicable'],
};
const TASK_LABELS = { awaiting: ['等待执行 / 尚未确认接收', 'Awaiting execution'], running: ['对话正在执行', 'Conversation running'], checking: ['正在检查产物', 'Checking outputs'], review: ['待检查结果', 'Review results'], failed: ['执行失败 · 请查看对话', 'Failed · inspect conversation'], confirmed: ['研究者已验收', 'Researcher accepted'] };

function Editor({ label, value, onSave, multiline = false }) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);
  return h('label', { style: { display: 'grid', gap: 6 } }, label,
    h(multiline ? 'textarea' : 'input', { 'aria-label': label, style: field, value: draft, rows: multiline ? 4 : undefined,
      onChange: (e) => setDraft(e.target.value), onBlur: () => { if (draft !== value) void onSave(draft); } }));
}

export function StageControl({ stageId, project, saveConfig, language, allowNA = true }) {
  const en = language === 'en';
  return h('label', { style: { display: 'grid', gap: 6 } }, en ? 'Research status' : '研究状态（独立于材料清单）',
    project.stageStates[stageId] === 'na' ? h('strong', null, PAPER_STAGES.find((stage) => stage.id === stageId)[language]) : null,
    h('select', { style: field, 'aria-label': en ? 'Research status' : '研究状态', value: project.stageStates[stageId] ?? 'auto',
      onChange: (e) => { const state = e.target.value; void saveConfig((latest) => { const next = { ...latest.stageStates }; if (state === 'auto') delete next[stageId]; else next[stageId] = state; return { stageStates: next }; }); } },
    Object.entries(STAGE_LABELS).filter(([id]) => id !== 'na' || allowNA).map(([id, text]) => h('option', { key: id, value: id }, text[en ? 1 : 0]))));
}

export function OverviewPanel({ project, report, workflow, nextStage, onStage, saveConfig, checkResults, language }) {
  const en = language === 'en';
  const stage = PAPER_STAGES.find((s) => s.id === nextStage);
  const gaps = report.modules[nextStage].materialChecks.filter((m) => m.status === 'missing');
  const complete = workflow.filter((id) => project.stageStates[id] === 'confirmed').length;
  return h('div', { style: { display: 'grid', gap: 14 }, 'data-testid': 'workbench-overview' },
    h('section', { style: box },
      h('strong', null, en ? 'Next recommended step' : '下一步建议'),
      h('span', { style: { fontSize: 19, fontWeight: 650 } }, stage[language]),
      h('span', null, stage[en ? 'nextEn' : 'nextZh']),
      h('span', null, `${en ? 'Researcher-confirmed stages' : '已确认阶段'} ${complete}/${workflow.length}`),
      h('span', null, gaps.length ? `${en ? 'Not yet found: ' : '尚未发现：'}${gaps.map((m) => m[language]).join('、')}` : en ? 'Expected material types found; verify content before confirming.' : '预期材料类型已发现，请核验内容后再确认阶段。'),
      h('button', { style: button, onClick: () => onStage(nextStage) }, en ? 'Open module' : '查看并推进此模块')),
    h('section', { style: box },
      h('strong', null, en ? 'Research context' : '项目记忆'),
      h(Editor, { label: en ? 'Research topic' : '研究主题', value: project.researchTopic, onSave: (researchTopic) => saveConfig({ researchTopic }) }),
      h(Editor, { label: en ? 'Confirmed decisions and unresolved questions' : '已确定方向、关键结论与待解决问题', value: project.researchMemory, multiline: true, onSave: (researchMemory) => saveConfig({ researchMemory }) }),
      h('small', null, en ? 'Saved context accompanies subsequent module tasks.' : '保存后会随后续模块任务一起提交，作为研究者记录供模型核验。')),
    h('section', { style: box },
      h('strong', null, en ? 'Recent tasks' : '最近任务'),
      !project.tasks.length ? h('span', null, en ? 'Tasks started from this workbench will appear here.' : '从工作台启动任务后，这里会记录执行状态和新增候选产物。') : null,
      project.tasks.slice(0, 6).map((task) => h('article', { key: task.id, style: { display: 'grid', gap: 7, borderTop: '1px solid #ddd', paddingTop: 10 } },
        h('strong', null, `${PAPER_STAGES.find((s) => s.id === task.stageId)[language]} · ${TASK_LABELS[task.status][en ? 1 : 0]}`),
        h('small', null, `${task.startedAt} · ${en ? 'Session' : '会话'} ${task.sessionId.slice(0, 8)}`),
        h('span', null, task.outputs.length ? `${en ? 'New candidates' : '新增候选文件'}：${task.outputs.length}` : en ? 'No new path recorded. Check conversation for in-place edits or text results.' : '未记录新增路径；原文件修改或纯对话结果请在对话中检查。'),
        task.outputs.slice(0, 8).map((path) => h('code', { key: path, style: { overflowWrap: 'anywhere' } }, path)),
        h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          h('button', { style: button, disabled: task.status === 'running', onClick: () => checkResults(task.id) }, en ? 'Check outputs' : '检查产物'),
          h('button', { style: button, disabled: ['awaiting', 'running', 'checking', 'confirmed'].includes(task.status), onClick: () => saveConfig((latest) => ({ tasks: latest.tasks.map((item) => item.id === task.id ? { ...item, status: 'confirmed' } : item) })) }, en ? 'Accept result' : '验收结果')))),
      h('small', null, en ? 'New paths are candidates, not proof of completion or authorship. Accepting a task does not confirm a whole stage.' : '新增路径是候选产物，不代表任务已完成或由该任务生成；验收任务不会自动确认整个阶段。')),
    h('details', { style: box }, h('summary', { style: { cursor: 'pointer' } }, en ? 'Target venue and author guidelines' : '具体投稿目标与作者指南'),
      h(Editor, { label: en ? 'Journal or conference' : '期刊或会议名称', value: project.venue, onSave: (venue) => saveConfig({ venue }) }),
      h(Editor, { label: en ? 'Guidelines URL, date and requirements' : '指南链接、日期与关键要求', value: project.venueGuidelines, multiline: true, onSave: (venueGuidelines) => saveConfig({ venueGuidelines }) }),
      h('small', null, en ? 'SCI/EI presets are advisory rubrics, not a venue compliance certification.' : 'SCI/EI 预设是建议量表；具体投稿符合度需核验目标刊会的作者指南。')));
}

export function MaterialsPanel({ project, report, saveConfig, rescan, scanning, language, fillFile }) {
  const en = language === 'en';
  const [query, setQuery] = React.useState('');
  const [limit, setLimit] = React.useState(30);
  const [error, setError] = React.useState('');
  const files = report.allFiles.filter((path) => path.toLowerCase().includes(query.toLowerCase()));
  const active = new Set(report.sourceFiles);
  return h('section', { style: { display: 'grid', gap: 12 }, 'data-testid': 'workbench-materials' },
    h('p', { style: { margin: 0 } }, en ? 'Path/type inventory only. Content has not been verified. Manual classification does not mean the file was read.' : '这是路径与类型清单，尚未核验正文。手动归类也不代表已读取或验证内容。'),
    h('details', { style: box }, h('summary', { style: { cursor: 'pointer' } }, en ? 'Scan scope' : '扫描范围与排除目录'),
      h(Editor, { label: en ? 'Paper subfolder (blank = workspace)' : '论文子目录（留空为整个工作区）', value: project.scanRoot, onSave: (value) => {
        const scanRoot = normalizeRelativeRoot(value);
        if (value.trim() && value.trim() !== '.' && !scanRoot) { setError(en ? 'Use a workspace-relative subfolder.' : '请输入工作区内相对子目录，不支持绝对路径或 ..。'); return; }
        setError(''); return saveConfig({ scanRoot });
      } }),
      h(Editor, { label: en ? 'Excluded subfolders, one per line' : '排除子目录，每行一个', multiline: true, value: project.excludedFolders.join('\n'), onSave: (value) => {
        const lines = value.split('\n').map((s) => s.trim()).filter(Boolean);
        if (lines.some((s) => !normalizeRelativeRoot(s))) { setError(en ? 'Invalid relative folder.' : '排除目录必须是有效的相对路径。'); return; }
        setError(''); return saveConfig({ excludedFolders: lines.map(normalizeRelativeRoot) });
      } })),
    error ? h('p', { role: 'alert' }, error) : null,
    h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
      h('span', null, `${en ? 'Included' : '纳入'} ${report.candidateCount} · ${en ? 'Excluded' : '排除'} ${report.excludedCount}`),
      h('button', { style: button, disabled: scanning, onClick: rescan }, en ? 'Rescan' : '重新扫描')),
    h('input', { style: field, type: 'search', 'aria-label': en ? 'Find materials' : '搜索材料', placeholder: en ? 'Filter by filename' : '按文件名筛选', value: query, onChange: (e) => { setQuery(e.target.value); setLimit(30); } }),
    files.slice(0, limit).map((path) => {
      const matches = Object.entries(report.modules).flatMap(([id, module]) => module.materialChecks.filter((m) => m.artifacts.includes(path)).map((m) => `${PAPER_STAGES.find((s) => s.id === id)[language]} · ${m[language]}`));
      return h('article', { key: path, style: box },
        h('strong', { style: { overflowWrap: 'anywhere' } }, path),
        h('small', null, !active.has(path) ? en ? 'Excluded' : '已排除' : project.assignments[path] ? en ? 'Manually classified · content unverified' : '人工归类 · 正文待核验' : en ? 'Path match · content unverified' : '路径匹配 · 正文待核验'),
        h('span', null, matches.join('；') || (en ? 'No material type matched' : '尚未匹配具体材料类型')),
        h('select', { style: field, 'aria-label': `${en ? 'Classify' : '归类'} ${path}`, value: project.assignments[path] ?? 'auto', onChange: (e) => {
          const value = e.target.value;
          void saveConfig((latest) => { const assignments = { ...latest.assignments }; if (value === 'auto') delete assignments[path]; else assignments[path] = value; return { assignments }; });
        } }, h('option', { value: 'auto' }, en ? 'Automatic' : '自动匹配'), h('option', { value: 'ignore' }, en ? 'Exclude file' : '排除此文件'),
        PAPER_STAGES.map((stage) => h('optgroup', { key: stage.id, label: stage[language] }, STAGE_MATERIALS[stage.id].map((m) => h('option', { key: m.id, value: `${stage.id}:${m.id}` }, m[language]))))),
        active.has(path) ? h('button', { style: button, onClick: () => fillFile(path) }, en ? 'Prepare content review' : '填入材料核验任务') : null);
    }),
    !files.length ? h('p', null, en ? 'No matching candidate files.' : '没有匹配的候选文件。') : null,
    files.length > limit ? h('button', { style: button, onClick: () => setLimit((n) => n + 30) }, en ? 'Show more' : '显示更多') : null);
}

export function ProjectTransfer({ project, saveConfig, language }) {
  const [message, setMessage] = React.useState('');
  const [pending, setPending] = React.useState(null);
  const en = language === 'en';
  return h('details', { style: box }, h('summary', { style: { cursor: 'pointer' } }, en ? 'Export / import project memory' : '导出 / 导入项目记忆'),
    h('p', null, en ? 'Save the JSON with your paper for migration. Source documents and session task logs are not included.' : '将 JSON 和论文一起保存，换电脑后可以导入。快照不含论文正文及会话任务记录。'),
    h('button', { style: button, onClick: () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(exportProjectSnapshot(project), null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'research-loom-project.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } }, en ? 'Export project memory' : '导出项目记忆'),
    h('label', { style: { display: 'grid', gap: 8 } }, en ? 'Choose a snapshot to preview' : '选择快照并预览',
      h('input', { type: 'file', accept: '.json', 'aria-label': en ? 'Import project memory' : '导入项目记忆', onChange: async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        try { if (file.size > 2_000_000) throw new Error('too large'); setPending(importProjectSnapshot(JSON.parse(await file.text()))); setMessage(''); }
        catch { setPending(null); setMessage(en ? 'Invalid snapshot or larger than 2 MB.' : '快照格式无效，或文件超过 2 MB。'); }
        e.target.value = '';
      } })),
    pending ? h('div', { style: box },
      h('span', null, `${en ? 'Topic' : '主题'}：${pending.researchTopic || '—'}`),
      h('span', null, en ? 'Applying replaces project preferences, classifications and memory; current task history is preserved.' : '应用后将替换本项目偏好、归类和记忆；保留当前任务记录。'),
      h('button', { style: button, onClick: async () => { if (await saveConfig({ ...pending, tasks: project.tasks }) !== false) { setPending(null); setMessage(en ? 'Imported.' : '已导入。'); } } }, en ? 'Apply snapshot' : '应用此快照'),
      h('button', { style: button, onClick: () => setPending(null) }, en ? 'Cancel' : '取消')) : null,
    message ? h('p', { role: 'status' }, message) : null);
}
