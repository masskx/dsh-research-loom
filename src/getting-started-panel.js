import * as React from 'react';
import { ENTRY_SCENARIOS, buildEntryPrompt } from './getting-started.js';
const h = React.createElement;

export const GUIDE_STYLES = `
/* The host may collapse its details column after a session/layout transition.
   Reserve space only while our panel is mounted and the native column is gone. */
@media(min-width:768px){[data-details-collapsed]:has(.research-workbench){box-sizing:border-box;padding-right:340px!important}}
.research-workbench{font-family:"Segoe UI","Microsoft YaHei",system-ui,sans-serif}
.research-workbench :is(button,input,select,textarea){font-family:inherit}
.research-guide{display:grid;gap:22px;padding:12px 2px}
.research-guide h2{font-size:21px;line-height:1.4;font-weight:600;letter-spacing:-.4px;margin:0;color:var(--dsw-alias-label-primary,#20242c)}
.research-guide p{margin:8px 0 0;line-height:1.75;color:var(--dsw-alias-label-secondary,#60646f)}
.research-guide small{font-size:12px!important;line-height:1.7;color:var(--dsw-alias-label-secondary,#60646f)}
.research-guide button{cursor:pointer}
.research-guide .guide-options{display:grid}
.research-guide .guide-option{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 4px;border:0;border-bottom:1px solid var(--dsw-alias-border-l2,#e6e8ed);border-radius:0;background:transparent;text-align:left;color:inherit}
.research-guide .guide-option:hover{background:var(--dsw-alias-bg-layer-2,#f7f8fb)}
.research-guide .guide-option strong{display:block;font-weight:600}
.research-guide .guide-option small{display:block;margin-top:5px}
.research-guide .guide-arrow{color:var(--dsw-alias-label-secondary,#60646f)}
.research-guide .guide-link{background:none;border:0;padding:5px 0;color:var(--dsw-alias-label-secondary,#60646f);text-align:left;text-decoration:underline;text-underline-offset:4px}
.research-guide .guide-topline{display:flex;justify-content:space-between;align-items:center;gap:12px}
.research-guide .guide-field{display:grid;gap:8px}
.research-guide :is(input,select){box-sizing:border-box;width:100%;min-width:0;padding:10px;border:1px solid var(--dsw-alias-border-l2,#dde1e8);border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font:inherit}
.research-guide .guide-step-select{border:0;border-bottom:1px solid var(--dsw-alias-border-l2,#e6e8ed);border-radius:0;padding:8px 0;color:var(--dsw-alias-label-secondary,#60646f)}
.research-guide .guide-primary{width:100%;min-height:42px;border:0;border-radius:8px;background:var(--dsw-alias-brand-primary,#4d6bfe);color:white;font-weight:600;padding:10px 14px}
.research-guide .guide-primary:hover{filter:brightness(.96)}
.research-guide .guide-action{display:grid;gap:10px}
.research-guide .guide-note{border-left:2px solid var(--dsw-alias-border-l2,#dde1e8);padding-left:12px}
.research-guide details summary{color:var(--dsw-alias-label-secondary,#60646f);cursor:pointer}
.research-guide details[open] .guide-field{margin-top:14px}
.research-guide .guide-feedback{display:grid;gap:6px;padding:12px 14px;border-radius:8px;background:var(--dsw-alias-bg-layer-2,#f7f8fb)}
.research-guide .guide-footer{padding-top:16px;border-top:1px solid var(--dsw-alias-border-l2,#e6e8ed)}
`;

export function GettingStartedPanel({ project, report, saveConfig, submitPrompt, language, cwd, disabled, writable }) {
  const en = language === 'en';
  const [choosing, setChoosing] = React.useState(false);
  const [topic, setTopic] = React.useState(project.researchTopic);
  const [prepared, setPrepared] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => setTopic(project.researchTopic), [project.researchTopic]);
  React.useEffect(() => setPrepared(false), [project.entryScenario, project.entryStep, topic, project.kickoffMode]);
  const scenario = ENTRY_SCENARIOS[project.entryScenario];
  const step = scenario?.steps[project.entryStep];
  const gathering = project.entryScenario === 'start' && project.entryStep === 1;
  const topicField = h('label', { className: 'guide-field' }, en ? 'Research topic' : '研究主题',
    h('input', { 'aria-label': en ? 'Guide research topic' : '引导研究主题', value: topic, maxLength: 500, disabled: !writable,
      placeholder: en ? 'Leave blank if unsure' : '没想好可以留空',
      onChange: (e) => setTopic(e.target.value),
      onBlur: () => { if (topic !== project.researchTopic) void saveConfig({ researchTopic: topic }); } }));
  return h('section', { 'data-testid': 'getting-started', className: 'research-guide' },
    !scenario || choosing ? h(React.Fragment, null,
      h('div', null, h('h2', null, en ? 'Let’s start here' : '从这里开始'),
        h('p', null, en ? 'Choose your situation. We will prepare your first message together.' : '选一个符合你的情况，帮你准备第一条对话。')),
      h('div', { className: 'guide-options' }, Object.entries(ENTRY_SCENARIOS).map(([id, item]) => h('button', {
        key: id, className: 'guide-option', disabled: !writable || busy,
        onClick: async () => { setBusy(true); try { if (await saveConfig({ entryScenario: id, entryStep: 0 })) setChoosing(false); } finally { setBusy(false); } },
      }, h('span', null, h('strong', null, item[language]), h('small', null, item[en ? 'hintEn' : 'hintZh'])), h('span', { className: 'guide-arrow', 'aria-hidden': true }, '→')))),
      scenario ? h('button', { className: 'guide-link', onClick: () => setChoosing(false) }, en ? 'Back to current task' : '返回当前任务') : null,
      h('small', null, en ? 'You can change this later. Your files will not be changed.' : '之后可以随时切换，不会改动你的论文文件。'))
    : h(React.Fragment, null,
      h('div', { className: 'guide-topline' }, h('small', null, scenario[language]),
        h('button', { className: 'guide-link', onClick: () => setChoosing(true) }, en ? 'Change scenario' : '切换场景')),
      h('div', null, h('h2', null, step[language]), h('p', null, step[en ? 'outputEn' : 'outputZh'])),
      h('div', { className: 'guide-note' }, h('small', null, en ? 'You will need' : '需要准备'), h('p', null, step[en ? 'needEn' : 'needZh'])),
      gathering ? topicField : h('details', null, h('summary', null, en ? 'Add a topic (optional)' : '补充研究主题（可选）'), topicField),
      gathering ? h(React.Fragment, null, h('label', { className: 'guide-field' }, en ? 'Sources' : '资料来源',
        h('select', { 'aria-label': en ? 'Source approach' : '资料来源', value: project.kickoffMode, disabled: !writable, onChange: (e) => { void saveConfig({ kickoffMode: e.target.value }); } },
          [['auto', '自动选择', 'Automatic'], ['local', '整理我提供的论文', 'Supplied papers'], ['web', '联网查找论文', 'Web search'], ['hybrid', '本地论文 + 联网补充', 'Local + web']].map(([id, zh, english]) => h('option', { key: id, value: id }, en ? english : zh)))),
        h('small', null, en ? 'Automatic uses local candidates when present. Web search requires host tools.' : '自动模式：有候选资料先整理，没有则检索。联网需要宿主提供工具。')) : null,
      h('div', { className: 'guide-action' },
        h('button', { className: 'guide-primary', disabled: disabled || busy,
          onClick: async () => {
            setBusy(true);
            try { setPrepared(await submitPrompt(buildEntryPrompt({ ...project, researchTopic: topic }, report, { language, cwd }), false, step.stage) === true); }
            finally { setBusy(false); }
          } }, busy ? (en ? 'Preparing…' : '正在准备…') : prepared ? (en ? 'Prepare again' : '重新准备任务') : (en ? 'Prepare task in chat' : '准备任务到对话框')),
        prepared ? h('div', { className: 'guide-feedback', role: 'status' },
          h('strong', null, en ? 'Your draft is ready' : '已放入对话框'),
          h('small', null, en ? 'Next: review the text in the main chat and press Send. Results will appear there.' : '下一步：到主对话框检查内容，点击发送。结果会出现在对话中。'))
        : h('small', null, en ? 'Prepares an editable draft, without sending it.' : '先生成可编辑的提示词，不会自动发送。')),
      h('label', { className: 'guide-field guide-footer' }, h('small', null, en ? 'After reviewing results, choose another step' : '核验结果后，可以切换下一步'),
        h('select', { className: 'guide-step-select', 'aria-label': en ? 'Guide step' : '引导步骤', value: project.entryStep, disabled: !writable,
          onChange: (e) => { void saveConfig({ entryStep: Number(e.target.value) }); } },
          scenario.steps.map((item, index) => h('option', { key: index, value: index }, `${index + 1} / 3 · ${item[language]}`)))),
      h('small', null, en ? 'Changing steps does not confirm research completion.' : '切换步骤不代表研究阶段已完成。')),
    !writable ? h('small', { role: 'status' }, en ? 'Settings are read-only; changes cannot be saved.' : '当前设置只读，无法保存选择。') : null,
    h('details', { className: 'guide-footer' }, h('summary', null, en ? 'How does this work?' : '不知道怎么操作？'),
      h('p', null, en ? '1. Choose a task. 2. Prepare its draft. 3. Review and send it in the main chat. Check the response and files before continuing.' : '① 选择任务 → ② 准备提示词 → ③ 在主对话中发送。阅读回复、检查文件后，再继续下一步。'),
      h('p', null, en ? 'Use a working DSH model. Document reading and web search require host tools and may use model quota.' : '需要普通 DSH 对话能正常使用模型；全文读取和联网检索依赖宿主工具，发送后可能使用模型额度。')));
}
