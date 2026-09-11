import test from 'node:test';
import assert from 'node:assert/strict';
import apply, { SETTINGS_NAMESPACE } from '../lib/startup.js';
import { DSH_COMPATIBILITY, UNAVAILABLE_COMMANDS } from '../lib/skill-compatibility.js';

function harness(initialEnabled = true) {
  const active = new Map();
  const watchers = new Set();
  const effects = [];
  let current = { enabled: initialEnabled, projects: {} };
  const ctx = {
    provide(name, value) { ctx[name] = value; },
    typert: { register: () => () => {} },
    skills: {
      register(skill) {
        assert(!active.has(skill.name), `duplicate skill ${skill.name}`);
        active.set(skill.name, skill);
        let disposed = false;
        return () => {
          if (disposed) return;
          disposed = true;
          active.delete(skill.name);
        };
      },
    },
    settings: {
      register(namespace, _schema, options) {
        assert.equal(namespace, SETTINGS_NAMESPACE);
        assert.deepEqual(options.base, { enabled: true, projects: {} });
        return {
          get: () => current,
          watch(callback) {
            watchers.add(callback);
            return () => watchers.delete(callback);
          },
        };
      },
    },
    effect(setup) {
      const dispose = setup();
      effects.push(dispose);
      return dispose;
    },
  };
  return {
    ctx,
    active,
    setEnabled(enabled) {
      const previous = current;
      current = { ...current, enabled };
      for (const watcher of watchers) watcher(current, previous);
    },
    dispose() {
      for (const effect of effects.reverse()) effect?.();
    },
  };
}

test('enabled by default registers four skills and thirteen runnable commands', () => {
  const app = harness();
  apply(app.ctx);
  assert.equal(app.active.size, 17);
  const modelInvocable = [...app.active.values()]
    .filter((skill) => skill.invocation?.modelInvocable !== false);
  const commands = [...app.active.values()]
    .filter((skill) => skill.invocation?.modelInvocable === false);
  assert.equal(modelInvocable.length, 4);
  assert.equal(commands.length, 13);
  assert(app.active.has('academic-pipeline'));
  assert(app.active.has('ars-full'));
  for (const name of Object.keys(UNAVAILABLE_COMMANDS)) assert.equal(app.active.has(name), false, name);
  for (const skill of app.active.values()) assert.ok(skill.content.startsWith(DSH_COMPATIBILITY));
});

test('soft switch unregisters and restores all skills without duplicates', () => {
  const app = harness();
  apply(app.ctx);
  app.setEnabled(false);
  assert.equal(app.active.size, 0);
  app.setEnabled(false);
  assert.equal(app.active.size, 0);
  app.setEnabled(true);
  assert.equal(app.active.size, 17);
  app.setEnabled(true);
  assert.equal(app.active.size, 17);
});

test('disabled persisted setting starts with an empty catalog', () => {
  const app = harness(false);
  apply(app.ctx);
  assert.equal(app.active.size, 0);
});
