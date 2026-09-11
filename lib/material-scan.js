import { opendir, lstat, realpath } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { scanHost } from './material-scan-contract.js';
import { validateReviewFiles } from './review-files.js';
import { inspectReviewChanges } from './review-changes.js';

const EXCLUDED = new Set(['.git', 'node_modules', '.venv', 'venv', '__pycache__', '.research-loom']);
const within = (root, path) => { const rel = relative(root, path); return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel); };

function scopePath(value, label) {
  if (typeof value !== 'string' || value.includes('\0')) throw new Error(`Invalid ${label}`);
  const path = value.trim().replace(/\\/g, '/');
  if (/^(\/|[a-z]:)/i.test(path) || path.split('/').includes('..')) throw new Error(`${label} must be relative to the workspace`);
  return path.split('/').filter(part => part && part !== '.').join('/');
}

async function unlinkedDirectory(base, path, signal) {
  if (!within(base, path)) return false;
  // Check every component, including a configured scan root or a queued ancestor replaced by a link.
  let current = base;
  for (const part of relative(base, path).split(sep).filter(Boolean)) {
    signal.throwIfAborted();
    current = join(current, part);
    const info = await lstat(current);
    if (info.isSymbolicLink()) return false;
    if (!info.isDirectory()) throw new Error('Scan root must be a directory');
  }
  return !(await lstat(path)).isSymbolicLink() && within(base, await realpath(path));
}

/** Enumerate current paths on every call, without reading paper contents or the @file index. */
export async function scanMaterialFiles(root, { signal = new AbortController().signal, scanRoot = '', excludedFolders = [], maxEntries = 10000, maxFiles = 2000, maxDirectories = 2000, maxDepth = 32 } = {}) {
  if (!root || !isAbsolute(root)) throw new Error('A session workspace is required');
  for (const limit of [maxEntries, maxFiles, maxDirectories, maxDepth]) {
    if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('Invalid scan limit');
  }
  signal.throwIfAborted();
  const scopedRoot = scopePath(scanRoot, 'scan root');
  if (!Array.isArray(excludedFolders)) throw new Error('Invalid excluded folders');
  const excluded = excludedFolders.map(folder => scopePath(folder, 'excluded folder')).filter(Boolean).map(folder => resolve(root, folder));
  const excludedPath = path => path.split('/').some(part => EXCLUDED.has(part.toLowerCase()))
    || excluded.some(folder => within(folder, resolve(root, path)));
  const base = await realpath(root);
  const start = resolve(base, scopedRoot);
  if (!await unlinkedDirectory(base, start, signal)) throw new Error('Scan root must not contain linked directories');
  signal.throwIfAborted();
  if (scopedRoot && excludedPath(scopedRoot)) return { files: [], incomplete: false, warnings: [] };
  const queue = [{ path: start, prefix: scopedRoot ? `${scopedRoot}/` : '', depth: 0 }];
  const files = [];
  const warnings = new Set();
  let entries = 0;
  let exhausted = false;
  for (let cursor = 0; cursor < queue.length && !exhausted; cursor++) {
    signal.throwIfAborted();
    const directory = queue[cursor];
    try {
      // Re-check queued directories: do not follow a symlink/junction swapped in after enumeration.
      if (!await unlinkedDirectory(base, directory.path, signal)) {
        warnings.add('linked-directory'); continue;
      }
      const handle = await opendir(directory.path);
      for await (const entry of handle) {
        signal.throwIfAborted();
        const path = directory.prefix + entry.name;
        // Out-of-scope paths do not consume limits or enter the traversal queue.
        if (excludedPath(path)) continue;
        if (++entries > maxEntries) { warnings.add('entry-limit'); exhausted = true; break; }
        if (entry.isSymbolicLink()) { warnings.add('symbolic-link'); continue; }
        if (entry.isDirectory()) {
          if (directory.depth >= maxDepth) { warnings.add('depth-limit'); continue; }
          if (queue.length >= maxDirectories) { warnings.add('directory-limit'); continue; }
          queue.push({ path: join(directory.path, entry.name), prefix: `${path}/`, depth: directory.depth + 1 });
        } else if (entry.isFile()) {
          if (files.length >= maxFiles) { warnings.add('file-limit'); exhausted = true; break; }
          files.push({ path, kind: 'file' });
        }
      }
    } catch (error) {
      signal.throwIfAborted();
      if (cursor === 0) throw error;
      warnings.add('unreadable-directory');
    }
  }
  signal.throwIfAborted();
  files.sort((a, b) => a.path.localeCompare(b.path));
  return { files, incomplete: warnings.size > 0, warnings: [...warnings] };
}

/** Host-bound endpoint: the caller supplies a session ID, never an arbitrary filesystem root. */
export function registerMaterialScanner(ctx, settings) {
  const service = {
    async scan(agent, signal) {
      const value = settings.get();
      if (!value.enabled) throw new Error('Research Loom is disabled');
      const root = agent?.session?.header?.cwd;
      if (!root || !isAbsolute(root)) throw new Error('A session workspace is required');
      const key = root.trim().replace(/\\/g, '/').replace(/\/+$/, '');
      const project = value.projects?.[key];
      return scanMaterialFiles(resolve(root), { signal, scanRoot: project?.scanRoot ?? '', excludedFolders: project?.excludedFolders ?? [] });
    },
    async validateReviewFiles(agent, request, signal) {
      if (!settings.get().enabled) throw new Error('Research Loom is disabled');
      return validateReviewFiles(agent?.session?.header?.cwd, request, signal);
    },
    async inspectReviewChanges(agent, request, signal) {
      if (!settings.get().enabled) throw new Error('Research Loom is disabled');
      return inspectReviewChanges(agent?.session?.header?.cwd, request, signal);
    },
  };
  service.typertRemote = Object.freeze({ service, serviceKey: 'researchLoom', namespace: 'researchLoom' });
  ctx.provide('researchLoom', service);
  ctx.effect(() => ctx.typert.register(scanHost), 'research-loom: live material scan');
}
