// dsh-academic-research-skills — startup plugin.
//
// Registers the ported Academic Research Skills (ARS) suite into ctx.skills:
//   - 4 model-invocable skills  : deep-research, academic-paper,
//                                 academic-paper-reviewer, academic-pipeline
//   - 16 user-invocable commands: /ars-3w ... /ars-unmark-read
//
// Dependency-free by design (no runtime imports beyond node:fs/path), so the
// package installs offline and the loader has nothing extra to resolve.
//
// Skill bodies are read from the package's own skills/ and commands/
// directories at mount time, and each registration carries a directory
// resourceBase so relative references (references/, agents/, templates/,
// examples/) resolve against the bundled files.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import z from '@deepseek-ai/schemastery';

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SKILL_DIRS = [
  'skills/deep-research',
  'skills/academic-paper',
  'skills/academic-paper-reviewer',
  'skills/academic-pipeline',
];

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const SETTINGS_NAMESPACE = 'academic-research';

const ProjectState = z.object({
  entryScenario: z.union(['', 'paper', 'start', 'revision']).default(''),
  entryStep: z.number().default(0),
  stage: z.string().default('topic'),
  updatedAt: z.string().default(''),
  source: z.union(['auto', 'manual']).default('manual'),
  lastScannedAt: z.string().default(''),
  workflowMode: z.union(['auto', 'empirical', 'theoretical', 'review', 'custom']).default('auto'),
  workflow: z.array(z.string()).default([]),
  standard: z.union(['general', 'sci', 'ei']).default('general'),
  kickoffMode: z.union(['auto', 'local', 'web', 'hybrid']).default('auto'),
  researchTopic: z.string().default(''),
  researchBrief: z.string().default(''),
  searchWindow: z.union(['recent2', 'recent5', 'all']).default('recent5'),
  researchMemory: z.string().default(''),
  reviewLoop: z.string().default(''),
  venue: z.string().default(''),
  venueGuidelines: z.string().default(''),
  scanRoot: z.string().default(''),
  excludedFolders: z.array(z.string()).default([]),
  assignments: z.dict(z.string()).default({}),
  stageStates: z.dict(z.string()).default({}),
  tasks: z.array(z.object({
    id: z.string(), sessionId: z.string(), stageId: z.string(), status: z.string(),
    startedAt: z.string(), endSeq: z.number().default(0),
    baseline: z.array(z.string()).default([]), outputs: z.array(z.string()).default([]),
  })).default([]),
});

export const Config = z.object({
  enabled: z.boolean().default(true),
  projects: z.dict(ProjectState).default({}),
});

/**
 * Minimal frontmatter reader: line-based `key: value` extraction sufficient
 * for the ARS skill files (single-line name/description, nested metadata
 * blocks skipped). No YAML dependency.
 */
function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line || /^\s/.test(line) || line.trim().startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    if (fields[key] !== undefined) continue; // first occurrence wins
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
  }
  return fields;
}

/**
 * Load one skill bundle (<dir>/SKILL.md) from the package root.
 * @param {string} rel - package-relative directory, e.g. 'skills/deep-research'.
 * @returns {{ name: string, description: string, content: string,
 *             resourceBase: { kind: 'directory', path: string } } | null}
 */
function loadSkill(rel) {
  const skillDir = join(PACKAGE_ROOT, rel);
  const file = join(skillDir, 'SKILL.md');
  if (!existsSync(file) || !statSync(file).isFile()) return null;
  const text = readFileSync(file, 'utf8');
  const fm = parseFrontmatter(text);
  if (!fm) return null;
  const name = fm.name;
  const description = fm.description;
  if (typeof name !== 'string' || !NAME_RE.test(name)) return null;
  if (typeof description !== 'string' || description.length === 0) return null;
  const content = text.slice(text.indexOf('---', 3) + 3).replace(/^\r?\n/, '');
  return {
    name,
    description,
    content,
    resourceBase: { kind: 'directory', path: skillDir },
  };
}

/**
 * Cordis plugin body. `ctx.skills` is injected by the bundle patch row
 * (`inject: [skills, settings]`); the guard keeps the module safe if mounted without it.
 */
export default function apply(ctx) {
  if (!ctx?.skills || !ctx?.settings) {
    console.warn(
      '[dsh-academic-research-skills] ctx.skills or ctx.settings unavailable — skills not registered',
    );
    return;
  }

  const definitions = [];
  for (const rel of SKILL_DIRS) {
    const skill = loadSkill(rel);
    if (!skill) {
      console.warn(`[dsh-academic-research-skills] failed to load ${rel}`);
      continue;
    }
    definitions.push({ ...skill, source: 'runtime' });
  }

  const commandsDir = join(PACKAGE_ROOT, 'commands');
  if (existsSync(commandsDir)) {
    for (const entry of readdirSync(commandsDir)) {
      if (!statSync(join(commandsDir, entry)).isDirectory()) continue;
      const skill = loadSkill(`commands/${entry}`);
      if (!skill) continue;
      definitions.push({
        ...skill,
        source: 'runtime',
        invocation: { modelInvocable: false, userInvocable: true },
      });
    }
  }

  const settings = ctx.settings.register(SETTINGS_NAMESPACE, Config, {
    base: { enabled: true, projects: {} },
  });
  let registrations = [];

  const setEnabled = (enabled) => {
    if (enabled && registrations.length === 0) {
      registrations = definitions.map((skill) => ctx.skills.register(skill));
      console.log(
        `[dsh-academic-research-skills] registered ${registrations.length} skills (enabled)`,
      );
      return;
    }
    if (!enabled && registrations.length > 0) {
      const current = registrations;
      registrations = [];
      for (const dispose of current.reverse()) dispose();
      console.log('[dsh-academic-research-skills] unregistered all skills (disabled)');
    }
  };

  setEnabled(settings.get().enabled);
  ctx.effect(
    () => settings.watch((next) => setEnabled(next.enabled)),
    'dsh-academic-research-skills: live enabled setting',
  );
}
