#!/usr/bin/env node
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const id = 'dsh-academic-research-skills';

await mkdir(new URL('../lib/', import.meta.url), { recursive: true });
await build({
  entryPoints: [fileURLToPath(new URL('../src/client.js', import.meta.url))],
  outfile: fileURLToPath(new URL('../lib/client.js', import.meta.url)),
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  charset: 'utf8',
  sourcemap: true,
  legalComments: 'none',
  external: ['react'],
  banner: {
    js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => { var module = { exports: {} }; var exports = module.exports;`,
  },
  footer: {
    js: 'return module.exports; } });',
  },
});

console.log('built lib/client.js');
