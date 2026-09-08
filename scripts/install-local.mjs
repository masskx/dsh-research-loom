#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function run(command, args, cwd = process.cwd()) {
  let executable = command;
  let executableArgs = args;
  if (process.platform === 'win32' && command === 'pnpm' && process.env.npm_execpath) {
    executable = process.execPath;
    executableArgs = [process.env.npm_execpath, ...args];
  } else if (process.platform === 'win32') {
    const shim = (process.env.PATH || '')
      .split(';')
      .map((entry) => join(entry, `${command}.ps1`))
      .find((entry) => existsSync(entry));
    if (!shim) throw new Error(`Cannot find ${command}.ps1 on PATH`);
    executable = 'pwsh.exe';
    executableArgs = ['-NoLogo', '-NoProfile', '-File', shim, ...args];
  }
  const result = spawnSync(executable, executableArgs, {
    cwd,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const profile = option('--profile', 'web');
if (!/^[a-zA-Z0-9._-]+$/.test(profile)) {
  throw new Error(`Invalid DSH profile name: ${profile}`);
}
const dshHome = resolve(process.env.DSH_HOME || join(homedir(), '.dsh'));
const packDir = join(dshHome, 'profiles', profile, '.local-packages');
mkdirSync(packDir, { recursive: true });

run('pnpm', ['run', 'build']);
run('pnpm', ['pack', '--pack-destination', packDir]);

const tarballs = readdirSync(packDir)
  .filter((name) => /^dsh-academic-research-skills-.*\.tgz$/.test(name))
  .sort((left, right) => statSync(join(packDir, right)).mtimeMs - statSync(join(packDir, left)).mtimeMs);
const tarball = tarballs[0];
if (!tarball) throw new Error(`No plugin tarball found in ${packDir}`);

// pnpm keys local file dependencies by path. Repacking the same version to the
// same path can therefore leave an older development build in node_modules,
// even with --force. Give each distinct tarball content a stable unique path.
const tarballPath = join(packDir, tarball);
const digest = createHash('sha256').update(readFileSync(tarballPath)).digest('hex').slice(0, 12);
const cachebustedTarball = tarball.replace(/\.tgz$/, `-${digest}.tgz`);
const cachebustedPath = join(packDir, cachebustedTarball);
if (!existsSync(cachebustedPath)) copyFileSync(tarballPath, cachebustedPath);

run('dsh', ['plugin', '--profile', profile, 'add', cachebustedPath, '--force']);
console.log(`installed ${cachebustedTarball} into the ${profile} profile`);
