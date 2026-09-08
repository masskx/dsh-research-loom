import { build } from 'esbuild';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const result = await build({ entryPoints: [fileURLToPath(new URL('../test/workbench-fixture.jsx', import.meta.url))], bundle: true, write: false, format: 'iife', platform: 'browser', define: { 'process.env.NODE_ENV': '"development"' } });
const js = result.outputFiles[0].contents;
const server = createServer((req, res) => {
  if (req.url === '/app.js') { res.writeHead(200, { 'Content-Type': 'text/javascript' }); res.end(js); }
  else { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<!doctype html><html lang="zh"><meta charset="utf-8"><title>Research Loom isolated QA</title><div id="root"></div><script src="/app.js"></script></html>'); }
});
server.listen(0, '127.0.0.1', () => console.log(`Fixture: http://127.0.0.1:${server.address().port}/`));
