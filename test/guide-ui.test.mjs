import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GettingStartedPanel } from '../src/getting-started-panel.js';
import { normalizeProjectState, analyzePaperArtifacts } from '../src/paper-state.js';

const render = (state = {}) => renderToStaticMarkup(React.createElement(GettingStartedPanel, {
  project: normalizeProjectState(state), report: analyzePaperArtifacts([]), language: 'zh', cwd: '/fixture',
  writable: true, disabled: false, saveConfig: async () => true, submitPrompt: async () => true,
}));

test('first screen has three plain choices without forms, scores or a settings stack', () => {
  const markup = render();
  assert.equal((markup.match(/class="guide-option"/g) ?? []).length, 3);
  assert.ok(markup.includes('从这里开始'));
  assert.ok(!markup.includes('<input'));
  assert.ok(!markup.includes('guide-primary'));
  assert.ok(!markup.includes('项目记忆'));
});

test('selected task has one primary action, an optional topic and step navigation', () => {
  const markup = render({ entryScenario: 'revision', entryStep: 2 });
  assert.equal((markup.match(/class="guide-primary"/g) ?? []).length, 1);
  assert.ok(markup.includes('核对回复信'));
  assert.ok(markup.includes('不会自动发送'));
  assert.ok(markup.includes('aria-label="引导步骤"'));
  assert.ok(markup.includes('补充研究主题（可选）'));
  assert.ok(!markup.includes('<details open'));
});

test('source gathering keeps topic and source selection immediately accessible', () => {
  const markup = render({ entryScenario: 'start', entryStep: 1, researchTopic: 'Example topic' });
  assert.ok(markup.includes('value="Example topic"'));
  assert.ok(markup.includes('aria-label="资料来源"'));
  assert.ok(!markup.includes('补充研究主题（可选）'));
});
