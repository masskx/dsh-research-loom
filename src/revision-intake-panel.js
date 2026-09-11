import * as React from 'react';
import { normalizeRevisionIntake, inspectRevisionIntake, revisionIntakeCandidates, normalizeRevisionPath } from './revision-intake.js';
const h = React.createElement;
const formOf = value => {
  const intake = normalizeRevisionIntake(value);
  return { ...intake, reviewText: intake.reviewFiles.join('\n') };
};
const intakeOf = form => normalizeRevisionIntake({ ...form, reviewFiles: form.reviewText.split(/\r?\n/u).map(path => path.trim()).filter(Boolean) });

// Mounted with a workspace key by the guide, so a draft from another project
// can never become the new workspace's selected manuscript.
export function RevisionIntakePanel({ project, report, saveConfig, onStartReview, onPrepare, language, disabled, writable }) {
  const en = language === 'en';
  const [form, setForm] = React.useState(() => formOf(project.revisionIntake));
  const formRef = React.useRef(form);
  const [pending, setPending] = React.useState(0);
  const pendingRef = React.useRef(0);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const mounted = React.useRef(true);
  React.useEffect(() => () => { mounted.current = false; }, []);
  const incoming = JSON.stringify(project.revisionIntake);
  React.useEffect(() => {
    if (pendingRef.current) return;
    const next = formOf(project.revisionIntake);
    formRef.current = next; setForm(next);
  }, [incoming]);
  const state = inspectRevisionIntake(intakeOf(form), project, report);
  const candidates = revisionIntakeCandidates(project, report);
  const rawPaths = [form.manuscript, ...form.reviewText.split(/\r?\n/u)].filter(path => path.trim());
  const invalid = rawPaths.some(path => !normalizeRevisionPath(path)) || rawPaths.length > 21;
  const locked = !writable || busy || disabled;
  const persist = async (next) => {
    pendingRef.current++; setPending(pendingRef.current);
    try {
      const saved = await saveConfig({ revisionIntake: intakeOf(next) });
      if (mounted.current && !saved) setMessage(en ? 'Could not save the source selection. Retry before continuing.' : '材料选择保存失败，请重试后继续。');
      return saved === true;
    } catch {
      if (mounted.current) setMessage(en ? 'Could not save the source selection. Retry before continuing.' : '材料选择保存失败，请重试后继续。');
      return false;
    } finally {
      pendingRef.current--;
      if (mounted.current) setPending(pendingRef.current);
    }
  };
  const edit = (field, value) => {
    const next = { ...formRef.current, [field]: value, confirmed: false };
    formRef.current = next; setForm(next); setMessage('');
    void persist(next);
  };
  const confirm = async () => {
    if (!state.ready || invalid || pending || locked) return;
    setBusy(true); setMessage('');
    try {
      // Save edits first; confirmation is a separate, explicit state change.
      // This also makes retry safe after an earlier settings write failed.
      const draft = { ...formRef.current, confirmed: false };
      if (!await persist(draft) || !mounted.current) return;
      const next = { ...draft, confirmed: true };
      if (await persist(next) && mounted.current) { formRef.current = next; setForm(next); }
    } finally { if (mounted.current) setBusy(false); }
  };
  const start = async () => {
    if (!state.confirmed || invalid || pending || locked) return;
    setBusy(true); setMessage('');
    try {
      const result = onStartReview ? await onStartReview(state.intake) : await onPrepare(state.intake);
      if (result === false && mounted.current) setMessage(en ? 'The task was not started. Check the notice in the workbench and try again.' : '任务未启动，请查看工作台提示后重试。');
    } catch {
      if (mounted.current) setMessage(en ? 'The task could not start. Your source selection is saved; retry when the model is available.' : '任务未能启动。材料选择已保存，可在模型可用后重试。');
    } finally { if (mounted.current) setBusy(false); }
  };
  const addReview = value => {
    if (!value) return;
    const files = [...new Set([...formRef.current.reviewText.split(/\r?\n/u).filter(Boolean), value])];
    edit('reviewText', files.join('\n'));
  };
  return h('div', { className: 'guide-intake', 'data-testid': 'revision-intake' },
    h('div', { className: 'guide-note' }, h('strong', null, en ? 'Choose this round’s sources' : '确认本轮使用的材料'),
      h('p', null, en ? 'Choose a manuscript and the original reviews. Multiple versions are candidates; none is selected automatically. Unknown round or version mapping is a valid starting point.'
        : '选择一份主稿和原始审稿意见。多个版本只作候选，不会自动替你决定；轮次或版本对应关系不知道也可以继续。')),
    candidates.manuscripts.length ? h('label', { className: 'guide-field' }, en ? 'Manuscript candidates' : '主稿候选',
      h('select', { 'aria-label': en ? 'Manuscript candidates' : '主稿候选', value: '', disabled: locked,
        onChange: e => { if (e.target.value) edit('manuscript', e.target.value); } },
      h('option', { value: '' }, en ? 'Choose a candidate or enter its path below' : '选择候选，或在下方填写路径'),
      candidates.manuscripts.map(path => h('option', { key: path, value: path }, path)))) : null,
    h('label', { className: 'guide-field' }, en ? 'Manuscript path' : '本轮主稿路径',
      h('input', { 'aria-label': en ? 'Manuscript path' : '本轮主稿路径', value: form.manuscript, maxLength: 1000, disabled: locked,
        placeholder: 'paper/main.tex', onChange: e => edit('manuscript', e.target.value) })),
    candidates.reviews.length ? h('label', { className: 'guide-field' }, en ? 'Original review candidates' : '原始意见候选',
      h('select', { 'aria-label': en ? 'Original review candidates' : '原始意见候选', value: '', disabled: locked,
        onChange: e => addReview(e.target.value) },
      h('option', { value: '' }, en ? 'Add a review or decision letter' : '添加意见文件或编辑决定信'),
      candidates.reviews.map(path => h('option', { key: path, value: path }, path)))) : null,
    h('label', { className: 'guide-field' }, en ? 'Original reviews / decision letters (one path per line)' : '原始意见／决定信路径（每行一个）',
      h('textarea', { 'aria-label': en ? 'Original review paths' : '原始意见路径', value: form.reviewText, rows: 3, maxLength: 40000, disabled: locked,
        placeholder: 'reviews/review1.txt', onChange: e => edit('reviewText', e.target.value) })),
    h('small', null, en ? 'Use paths relative to this workspace, up to 20 review files. Candidate names are not proof of contents. Supply original reviews; author response drafts must be identified separately when reading.'
      : '填写相对当前工作区的路径，最多 20 份意见文件。候选名称不代表已核验内容；请提供原始意见，阅读时还会区分其中混入的作者回复草稿。'),
    h('label', { className: 'guide-field' }, en ? 'Review round (optional)' : '审稿轮次（可选）',
      h('input', { 'aria-label': en ? 'Review round' : '审稿轮次', value: form.round, maxLength: 200, disabled: locked,
        placeholder: en ? 'Unknown is fine' : '不知道可以留空，例如：第一轮／2024 年历史意见', onChange: e => edit('round', e.target.value) })),
    h('label', { className: 'guide-field' }, en ? 'Do these reviews refer to this manuscript?' : '这些意见对应这份稿件吗？',
      h('select', { 'aria-label': en ? 'Review relationship' : '意见与主稿的对应关系', value: form.relationship, disabled: locked,
        onChange: e => edit('relationship', e.target.value) },
      [['unknown', '不知道，先帮我核对', 'Unknown; help me check'], ['current', '我认为对应这份稿件', 'I believe they refer to this manuscript'], ['historical', '历史意见，需要检查是否仍适用', 'Historical reviews; check applicability']]
        .map(([id, zh, english]) => h('option', { key: id, value: id }, en ? english : zh)))),
    invalid ? h('small', { role: 'alert' }, en ? 'Use valid relative paths within this workspace, without ../, and at most 20 review files.' : '请填写工作区内的有效相对路径，不使用绝对路径或 ../，且意见文件不超过 20 份。') : null,
    state.sameSource ? h('small', { role: 'alert' }, en ? 'The manuscript and original review must be different files.' : '主稿与原始意见不能选择同一个文件。') : null,
    state.excluded.length ? h('small', { role: 'alert' }, `${en ? 'These files are excluded by the material settings; adjust the selection or exclusions first' : '以下材料被当前材料设置排除，请先调整选择或排除规则'}: ${state.excluded.join('、')}`) : null,
    state.unscanned.length ? h('small', { className: 'guide-note' }, `${en ? 'Not found in the scan; the task must check existence and readability' : '扫描未找到以下手填材料，任务会先核验是否存在且可读'}: ${state.unscanned.join('、')}`) : null,
    state.confirmed && !invalid ? h('div', { className: 'guide-feedback', role: 'status' },
      h('strong', null, en ? 'Source selection saved' : '本轮材料选择已确认'),
      h('small', null, en ? 'Next: read the original comments, retain their sources, and check applicability against the manuscript. Confirmation does not mean the files have been read. Editing any field requires confirmation again.'
        : '下一步：读取原始意见，保留来源，并核对意见在当前稿中是否仍适用。确认选择不代表已读全文；修改任一字段后需重新确认。'),
      h('button', { className: 'guide-primary', disabled: locked || pending > 0, onClick: start }, busy ? (en ? 'Starting…' : '正在启动…')
        : onStartReview ? (en ? 'Read original reviews and build the revision list' : '读取原始意见并建立返修清单') : (en ? 'Prepare review task in chat' : '准备原始意见任务到对话框')))
      : h('button', { className: 'guide-primary', disabled: locked || pending > 0 || !state.ready || invalid, onClick: confirm },
        busy || pending ? (en ? 'Saving…' : '正在保存…') : (en ? 'Confirm these sources' : '确认本轮材料')),
    message ? h('small', { role: 'alert' }, message) : null,
    !state.ready && !invalid && !state.excluded.length && !state.sameSource ? h('small', null, en ? 'Choose one manuscript and at least one review file to continue.' : '选择一份主稿和至少一份原始意见后即可继续。') : null,
    h('small', null, onStartReview ? (en ? 'Starting uses the configured model and host reading tools. It creates a review list; it does not edit the manuscript.' : '启动后使用当前模型和宿主读取工具建立意见清单，此步骤不修改主稿。')
      : (en ? 'The prepared prompt stays editable in chat until you send it.' : '准备的提示词会留在对话框供你检查，点击发送后才开始。')));
}
