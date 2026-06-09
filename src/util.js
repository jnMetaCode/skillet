// Tiny zero-dependency helpers: fs, logging, and a git/process runner.
import fs from 'node:fs';
import { dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const NO_COLOR = process.env.NO_COLOR || !process.stdout.isTTY;
const paint = (code) => (s) => (NO_COLOR ? s : `\x1b[${code}m${s}\x1b[0m`);
export const c = {
  dim: paint('2'),
  bold: paint('1'),
  red: paint('31'),
  green: paint('32'),
  yellow: paint('33'),
  blue: paint('34'),
  cyan: paint('36'),
};

export const log = (...a) => console.log(...a);
export const info = (...a) => console.log(c.cyan('•'), ...a);
export const ok = (...a) => console.log(c.green('✓'), ...a);
export const warn = (...a) => console.warn(c.yellow('!'), ...a);
export class UserError extends Error {}
export const die = (msg) => {
  throw new UserError(msg);
};

export const exists = (p) => fs.existsSync(p);
export const isDir = (p) => exists(p) && fs.statSync(p).isDirectory();

export function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    if (fallback !== undefined && (e.code === 'ENOENT' || e instanceof SyntaxError)) return fallback;
    throw e;
  }
}

export function writeJson(p, obj) {
  fs.mkdirSync(dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

export const rmrf = (p) => fs.rmSync(p, { recursive: true, force: true });
export const copyDir = (src, dst) => {
  fs.mkdirSync(dst, { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
};

// Run a command, capturing output. Returns {ok, stdout, stderr, code}.
export function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  return {
    ok: r.status === 0,
    code: r.status,
    stdout: (r.stdout || '').trim(),
    stderr: (r.stderr || '').trim(),
    error: r.error,
  };
}

export function hasGit() {
  return run('git', ['--version']).ok;
}
