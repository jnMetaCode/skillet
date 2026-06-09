// Resolve a skill reference string and fetch its files into a temp dir.
//
// Accepted reference forms:
//   ./path/to/skill            local folder (great for authoring/testing)
//   owner/repo                 GitHub repo root is the skill
//   owner/repo/sub/dir         skill lives in a subdirectory
//   owner/repo#v1.2.0          pin to a branch or tag
//   some-name                  bare name -> looked up in the registry index
import os from 'node:os';
import fs from 'node:fs';
import { join, isAbsolute, resolve } from 'node:path';
import { run, hasGit, die, isDir } from './util.js';

export function resolveRef(ref) {
  if (
    ref.startsWith('./') ||
    ref.startsWith('../') ||
    ref.startsWith('/') ||
    ref.startsWith('~') ||
    ref === '.' ||
    isAbsolute(ref) ||
    isDir(ref)
  ) {
    return { kind: 'local', path: ref.replace(/^~/, os.homedir()) };
  }
  const [pathPart, gitRef] = ref.split('#');
  const segs = pathPart.split('/').filter(Boolean);
  if (segs.length >= 2) {
    return {
      kind: 'github',
      owner: segs[0],
      repo: segs[1],
      path: segs.slice(2).join('/'),
      ref: gitRef || null,
    };
  }
  return { kind: 'registry', name: pathPart };
}

function mkTmp() {
  return fs.mkdtempSync(join(os.tmpdir(), 'skillet-'));
}

const isSha = (ref) => /^[0-9a-f]{7,40}$/i.test(ref);

// Validate the parts we interpolate into git args / a URL. Defense in depth:
// spawnSync runs with no shell, but this rejects anything weird up front.
function validateSpec(spec) {
  const okName = /^[A-Za-z0-9._-]+$/;
  if (!okName.test(spec.owner) || !okName.test(spec.repo)) {
    die(`invalid repo "${spec.owner}/${spec.repo}"`);
  }
  if (spec.ref && !/^[A-Za-z0-9._/-]+$/.test(spec.ref)) die(`invalid ref "${spec.ref}"`);
  if (spec.path && (spec.path.includes('..') || spec.path.startsWith('/'))) {
    die(`invalid path "${spec.path}"`);
  }
}

// Fetch a github skill into a temp checkout. Returns { dir, resolved, cleanup }.
function fetchGithub(spec) {
  if (!hasGit()) die('git is required to install from GitHub. Install git, or use a local path.');
  validateSpec(spec);
  const tmp = mkTmp();
  const url = `https://github.com/${spec.owner}/${spec.repo}.git`;
  // A commit SHA can't be used with `git clone --branch`; clone the default
  // branch, then fetch + checkout the exact commit (real pinning).
  const branchRef = spec.ref && !isSha(spec.ref) ? spec.ref : null;

  const cloneArgs = ['clone', '--depth', '1', '--filter=blob:none'];
  if (branchRef) cloneArgs.push('--branch', branchRef);
  cloneArgs.push(url, tmp);

  let r = run('git', cloneArgs);
  if (!r.ok) {
    // --filter not supported on very old git; retry plain shallow clone
    const fallback = ['clone', '--depth', '1'];
    if (branchRef) fallback.push('--branch', branchRef);
    fallback.push(url, tmp);
    r = run('git', fallback);
  }
  if (r.ok && spec.ref && isSha(spec.ref)) {
    // Pin to an exact commit.
    const fetched = run('git', ['-C', tmp, 'fetch', '--depth', '1', 'origin', spec.ref]);
    const co = run('git', ['-C', tmp, 'checkout', '--detach', fetched.ok ? 'FETCH_HEAD' : spec.ref]);
    if (!co.ok) {
      fs.rmSync(tmp, { recursive: true, force: true });
      die(`could not check out commit ${spec.ref} in ${spec.owner}/${spec.repo}\n  ${co.stderr || ''}`);
    }
  }
  if (!r.ok) {
    fs.rmSync(tmp, { recursive: true, force: true });
    die(`failed to fetch ${spec.owner}/${spec.repo}${spec.ref ? '#' + spec.ref : ''}\n  ${r.stderr || r.error?.message || ''}`);
  }
  const sha = run('git', ['-C', tmp, 'rev-parse', 'HEAD']).stdout || null;
  const dir = spec.path ? join(tmp, spec.path) : tmp;
  if (!isDir(dir)) {
    fs.rmSync(tmp, { recursive: true, force: true });
    die(`path "${spec.path}" not found in ${spec.owner}/${spec.repo}`);
  }
  return {
    dir,
    resolved: sha,
    version: spec.ref || null,
    cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }),
  };
}

function fetchLocal(spec) {
  const dir = resolve(spec.path);
  if (!isDir(dir)) die(`local path not found: ${spec.path}`);
  return { dir, resolved: 'local', version: null, cleanup: () => {} };
}

export function fetchSource(spec) {
  if (spec.kind === 'local') return fetchLocal(spec);
  if (spec.kind === 'github') return fetchGithub(spec);
  die(`cannot fetch unresolved reference of kind "${spec.kind}"`);
}
