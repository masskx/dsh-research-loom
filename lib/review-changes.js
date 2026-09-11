import { open, realpath, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, extname, relative, isAbsolute, sep } from 'node:path';
import { validateReviewFiles } from './review-files.js';

const MAX_BYTES = 512 * 1024;
const MAX_PREVIEW = 8000;
const TEXT_TYPES = new Set(['.tex', '.ltx', '.md', '.txt', '.rst', '.typ', '.bib']);

// One enclosing changed region keeps this preview deterministic and bounded.
// It may contain unchanged lines between edits; it is not an added/deleted count.
export function changedRegion(before, after) {
  const left = before.split('\n');
  const right = after.split('\n');
  let start = 0;
  while (start < left.length && start < right.length && left[start] === right[start]) start++;
  let suffix = 0;
  while (suffix < left.length - start && suffix < right.length - start
    && left[left.length - suffix - 1] === right[right.length - suffix - 1]) suffix++;
  const part = (lines) => {
    const body = lines.slice(start, lines.length - suffix).join('\n');
    return { startLine: start + 1, endLine: lines.length - suffix, text: body.slice(0, MAX_PREVIEW), truncated: body.length > MAX_PREVIEW };
  };
  return { before: part(left), after: part(right) };
}

/** Read-only comparison. The host supplies the session workspace, not the client. */
export async function inspectReviewChanges(root, request, signal = new AbortController().signal) {
  if (!request || typeof request !== 'object' || Array.isArray(request) || Object.keys(request).length !== 2
    || !['manuscript', 'revised'].every(key => typeof request[key] === 'string' && request[key].trim() && request[key].length <= 1000)) {
    throw new Error('Invalid manuscript comparison request');
  }
  const paths = await validateReviewFiles(root, { phase: 'verify', manuscript: request.manuscript,
    expectedManuscript: request.manuscript, revised: request.revised, previousRevised: request.revised }, signal);
  const base = await realpath(root);
  const empty = { startLine: 0, endLine: 0, text: '', truncated: false };
  const unsupported = notice => ({ ...paths, status: 'unsupported', same: false, originalHash: '', revisedHash: '', before: empty, after: empty, notice });
  if (![paths.manuscript, paths.revised].every(path => TEXT_TYPES.has(extname(path).toLowerCase()))) {
    return unsupported('当前只支持 UTF-8 文本稿件（LaTeX、Markdown、TXT 等）的内容对照；Word/PDF 请在对应编辑器检查。文件存在不表示内容已核验。');
  }
  async function read(path) {
    signal.throwIfAborted();
    const absolute = resolve(base, path);
    const handle = await open(absolute, 'r');
    try {
      const before = await handle.stat();
      if (!before.isFile()) throw new Error('Comparison requires regular files');
      const current = await realpath(absolute);
      const rel = relative(base, current);
      if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error('Manuscript must stay inside the workspace');
      const identity = await stat(current);
      if (before.dev !== identity.dev || before.ino !== identity.ino) throw new Error('稿件路径在读取时发生变化，请重试');
      if (before.size > MAX_BYTES) return null;
      // Bounded even if another process grows the file after stat.
      const buffer = Buffer.alloc(MAX_BYTES + 1);
      let size = 0;
      while (size < buffer.length) {
        signal.throwIfAborted();
        const { bytesRead } = await handle.read(buffer, size, buffer.length - size, size);
        if (!bytesRead) break;
        size += bytesRead;
      }
      const after = await handle.stat();
      if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) throw new Error('稿件在读取时发生变化，请等待编辑结束后重试');
      if (size > MAX_BYTES) return null;
      const bytes = buffer.subarray(0, size);
      let content;
      try { content = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { return null; }
      if (content.includes('\0')) return null;
      return { content, hash: createHash('sha256').update(bytes).digest('hex') };
    } finally { await handle.close(); }
  }
  const original = await read(paths.manuscript);
  const revised = await read(paths.revised);
  signal.throwIfAborted();
  if (!original || !revised) return unsupported('文件超过 512 KiB，或不是可读取的 UTF-8 文本；未完成内容对照，请使用编辑器检查。');
  const region = changedRegion(original.content, revised.content);
  return { ...paths, status: 'available', same: original.hash === revised.hash, originalHash: original.hash,
    revisedHash: revised.hash, ...region,
    notice: '显示当前两份文件首处至末处变化的覆盖区域，区域内可能有未变行。每侧最多显示 8,000 字符；仅核对所选文件，不包含 LaTeX 引用的其他文件，不代表学术正确性或原稿从未被改动。' };
}
