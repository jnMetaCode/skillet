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

// Fetch a github skill into a temp checkout. Returns { dir, resolved, cleanup }.
function fetchGithub(spec) {
  if (!hasGit()) die('git is required to install from GitHub. Install git, or use a local path.');
  const tmp = mkTmp();
  const url = `https://github.com/${spec.owner}/${spec.repo}.git`;
  const args = ['clone', '--depth', '1', '--filter=blob:none'];
  if (spec.ref) args.push('--branch', spec.ref);
  args.push(url, tmp);

  let r = run('git', args);
  if (!r.ok) {
    // --filter not supported on very old git; retry plain shallow clone
    const fallback = ['clone', '--depth', '1'];
    if (spec.ref) fallback.push('--branch', spec.ref);
    fallback.push(url, tmp);
    r = run('git', fallback);
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
