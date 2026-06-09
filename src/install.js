import fs from 'node:fs';
import { join, basename, resolve, sep } from 'node:path';
import { exists, isDir, copyDir, rmrf, die } from './util.js';
import { parseFrontmatter, validateSkill } from './frontmatter.js';
import { loadLock, saveLock } from './config.js';
import { resolveRef, fetchSource } from './source.js';
import { fetchIndex, findInIndex, entryToSpec } from './registry.js';

const SKIP = new Set(['.git', 'node_modules', '.DS_Store']);

export function readSkillMeta(dir) {
  const p = join(dir, 'SKILL.md');
  if (!exists(p)) return null;
  const { data } = parseFrontmatter(fs.readFileSync(p, 'utf8'));
  return data;
}

// Resolve a reference (possibly a registry name) into a concrete source spec.
async function toSpec(ref, cfg) {
  const r = resolveRef(ref);
  if (r.kind !== 'registry') return { spec: r, originalRef: ref };
  const index = await fetchIndex(cfg.registry);
  const entry = findInIndex(index, r.name);
  if (!entry) die(`"${r.name}" is not in the registry. Try: skillet search ${r.name}`);
  return { spec: entryToSpec(entry), originalRef: ref, entry };
}

export async function addSkill(cwd, cfg, ref, { force = false } = {}) {
  const { spec, originalRef } = await toSpec(ref, cfg);
  const src = fetchSource(spec);
  try {
    const meta = readSkillMeta(src.dir);
    if (!meta) die(`no SKILL.md found at ${ref}. Is this a skill folder?`);
    const check = validateSkill(meta);
    if (!check.valid && !force) {
      die(`"${ref}" has an invalid SKILL.md:\n  - ${check.errors.join('\n  - ')}\n(use --force to install anyway)`);
    }

    const name = String(meta.name || basename(spec.path || spec.repo || src.dir));
    // SECURITY: name comes from untrusted SKILL.md frontmatter (or a remote
    // repo). Never let it escape skillsDir via "..", "/", or an absolute path —
    // and don't let --force bypass this check.
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(name) || name.includes('..')) {
      die(`unsafe skill name "${name}" — names must be a single path segment (letters, digits, . _ -)`);
    }
    const skillsRoot = resolve(join(cwd, cfg.skillsDir));
    const target = join(cwd, cfg.skillsDir, name);
    if (resolve(target) !== join(skillsRoot, name) || !resolve(target).startsWith(skillsRoot + sep)) {
      die(`refusing to install "${name}" outside ${cfg.skillsDir}/`);
    }
    if (exists(target) && !force) {
      die(`skill "${name}" is already installed. Use --force to overwrite, or: skillet update ${name}`);
    }
    if (exists(target)) rmrf(target);

    fs.mkdirSync(target, { recursive: true });
    fs.cpSync(src.dir, target, {
      recursive: true,
      filter: (s) => !SKIP.has(basename(s)),
    });

    const lock = loadLock(cwd);
    lock.skills[name] = {
      ref: originalRef,
      kind: spec.kind,
      repo: spec.kind === 'github' ? `${spec.owner}/${spec.repo}` : undefined,
      path: spec.path || undefined,
      gitRef: spec.ref || undefined,
      resolved: src.resolved,
      version: meta.version || src.version || undefined,
      installedAt: new Date().toISOString(),
    };
    saveLock(cwd, lock);

    return { name, target, version: meta.version, resolved: src.resolved, warnings: check.warnings };
  } finally {
    src.cleanup();
  }
}

export function removeSkill(cwd, cfg, name) {
  const target = join(cwd, cfg.skillsDir, name);
  const lock = loadLock(cwd);
  const known = !!lock.skills[name];
  if (!exists(target) && !known) die(`skill "${name}" is not installed`);
  rmrf(target);
  delete lock.skills[name];
  saveLock(cwd, lock);
  return { name };
}

export function listSkills(cwd, cfg) {
  const dir = join(cwd, cfg.skillsDir);
  const lock = loadLock(cwd);
  const out = [];
  if (isDir(dir)) {
    for (const name of fs.readdirSync(dir)) {
      const sdir = join(dir, name);
      if (!isDir(sdir)) continue;
      const meta = readSkillMeta(sdir) || {};
      out.push({
        name: meta.name || name,
        description: meta.description || '',
        version: meta.version || lock.skills[name]?.version || '',
        source: lock.skills[name]?.ref || '(local/untracked)',
      });
    }
  }
  return out;
}

export async function updateSkill(cwd, cfg, name) {
  const lock = loadLock(cwd);
  const entry = lock.skills[name];
  if (!entry) die(`skill "${name}" is not tracked in ${'skillet.lock.json'}; install it first`);
  return addSkill(cwd, cfg, entry.ref, { force: true });
}
