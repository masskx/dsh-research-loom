import { opendir, lstat, realpath } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { scanHost } from './material-scan-contract.js';

const EXCLUDED = new Set(['.git', 'node_modules', '.venv', 'venv', '__pycache__', '.research-loom']);
const within = (root, path) => { const rel = relative(root, path); return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel); };

/** Enumerate current paths on every call, without reading paper contents or the @file index. */
export async function scanMaterialFiles(root, { signal = new AbortController().signal, maxEntries = 10000, maxFiles = 2000, maxDirectories = 2000, maxDepth = 32 } = {}) {
  if (!root || !isAbsolute(root)) throw new Error('A session workspace is required');
  for (const limit of [maxEntries, maxFiles, maxDirectories, maxDepth]) {
    if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('Invalid scan limit');
  }
  signal.throwIfAborted();
  const base = await realpath(root);
  const queue = [{ path: base, prefix: '', depth: 0 }];
  const files = [];
  const warnings = new Set();
  let entries = 0;
  let exhausted = false;
  for (let cursor = 0; cursor < queue.length && !exhausted; cursor++) {
    signal.throwIfAborted();
    const directory = queue[cursor];
    try {
      // Re-check queued directories: do not follow a symlink/junction swapped in after enumeration.
      if ((await lstat(directory.path)).isSymbolicLink() || !within(base, await realpath(directory.path))) {
        warnings.add('linked-directory'); continue;
      }
      const handle = await opendir(directory.path);
      for await (const entry of handle) {
        signal.throwIfAborted();
        if (++entries > maxEntries) { warnings.add('entry-limit'); exhausted = true; break; }
        const path = directory.prefix + entry.name;
        if (entry.isSymbolicLink()) { warnings.add('symbolic-link'); continue; }
        if (entry.isDirectory()) {
          if (EXCLUDED.has(entry.name.toLowerCase())) continue;
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
      if (!settings.get().enabled) throw new Error('Research Loom is disabled');
      const root = agent?.session?.header?.cwd;
      if (!root || !isAbsolute(root)) throw new Error('A session workspace is required');
      return scanMaterialFiles(resolve(root), { signal });
    },
  };
  service.typertRemote = Object.freeze({ service, serviceKey: 'researchLoom', namespace: 'researchLoom' });
  ctx.provide('researchLoom', service);
  ctx.effect(() => ctx.typert.register(scanHost), 'research-loom: live material scan');
}
