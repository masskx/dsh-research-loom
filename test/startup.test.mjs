import test from 'node:test';
import assert from 'node:assert/strict';
import apply, { SETTINGS_NAMESPACE } from '../lib/startup.js';

function harness(initialEnabled = true) {
  const active = new Map();
  const watchers = new Set();
  const effects = [];
  let current = { enabled: initialEnabled, projects: {} };
  const ctx = {
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

test('enabled by default registers four skills and sixteen commands', () => {
  const app = harness();
  apply(app.ctx);
  assert.equal(app.active.size, 20);
  const modelInvocable = [...app.active.values()]
    .filter((skill) => skill.invocation?.modelInvocable !== false);
  const commands = [...app.active.values()]
    .filter((skill) => skill.invocation?.modelInvocable === false);
  assert.equal(modelInvocable.length, 4);
  assert.equal(commands.length, 16);
  assert(app.active.has('academic-pipeline'));
  assert(app.active.has('ars-full'));
});

test('soft switch unregisters and restores all skills without duplicates', () => {
  const app = harness();
  apply(app.ctx);
  app.setEnabled(false);
  assert.equal(app.active.size, 0);
  app.setEnabled(false);
  assert.equal(app.active.size, 0);
  app.setEnabled(true);
  assert.equal(app.active.size, 20);
  app.setEnabled(true);
  assert.equal(app.active.size, 20);
});

test('disabled persisted setting starts with an empty catalog', () => {
  const app = harness(false);
  apply(app.ctx);
  assert.equal(app.active.size, 0);
});
