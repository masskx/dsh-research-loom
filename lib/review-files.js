import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep, win32 } from 'node:path';

const FIELDS = ['phase', 'manuscript', 'expectedManuscript', 'revised', 'previousRevised'];
const within = (root, path) => {
  const rel = relative(root, path);
  return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
};
const sameFile = (a, b) => a.real === b.real
  || (a.info.ino !== 0n && a.info.dev === b.info.dev && a.info.ino === b.info.ino);

/** Resolve model-supplied paths against the receiving session, using actual file identity. */
export async function validateReviewFiles(root, request, signal = new AbortController().signal) {
  if (!root || !isAbsolute(root)) throw new Error('A session workspace is required');
  if (!request || typeof request !== 'object' || Array.isArray(request)
    || Object.keys(request).length !== FIELDS.length
    || FIELDS.some(field => typeof request[field] !== 'string' || request[field].length > 4000 || request[field].includes('\0'))
    || !['plan', 'revise', 'verify'].includes(request.phase)) {
    throw new Error('Invalid review file validation request');
  }
  signal.throwIfAborted();
  const workspace = resolve(root);
  const base = await realpath(workspace);
  if (!(await stat(base)).isDirectory()) throw new Error('A session workspace directory is required');

  async function file(value, label, required = false) {
    signal.throwIfAborted();
    if (!value.trim()) {
      if (required) throw new Error(`Missing ${label} path`);
      return null;
    }
    // A foreign drive path must never be interpreted as a local relative filename.
    if (process.platform !== 'win32' && win32.isAbsolute(value) && !isAbsolute(value)) {
      throw new Error(`${label} must be inside the workspace`);
    }
    const path = resolve(workspace, value.replace(/\\/g, '/'));
    if (!within(workspace, path) && !within(base, path)) throw new Error(`${label} must be inside the workspace`);
    const real = await realpath(path);
    if (!within(base, real)) throw new Error(`${label} must be inside the workspace`);
    const info = await stat(real, { bigint: true });
    if (!info.isFile()) throw new Error(`${label} must be a regular file`);
    signal.throwIfAborted();
    return { real, info, path: relative(base, real).split(sep).join('/') };
  }

  const manuscript = await file(request.manuscript, 'manuscript', true);
  const expected = await file(request.expectedManuscript, 'expected manuscript');
  if (expected && !sameFile(manuscript, expected)) throw new Error('Manuscript differs from the specified original');
  const revised = await file(request.revised, 'revised manuscript', request.phase !== 'plan');
  const previous = await file(request.previousRevised, 'previous revised manuscript', request.phase === 'verify');
  if (request.phase !== 'plan' && sameFile(manuscript, revised)) throw new Error('Revised manuscript must be a separate file from the original');
  if (request.phase === 'revise' && previous && sameFile(revised, previous)) throw new Error('Revision must preserve the previous version and create a new file');
  if (request.phase === 'verify' && !sameFile(revised, previous)) throw new Error('Verification must use the previous revised manuscript');
  signal.throwIfAborted();
  return { manuscript: manuscript.path, revised: revised?.path ?? '' };
}
