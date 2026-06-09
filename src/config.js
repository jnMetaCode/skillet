// Project config (skillet.json) and lockfile (skillet.lock.json).
import { join } from 'node:path';
import { readJson, writeJson, exists } from './util.js';

export const CONFIG_FILE = 'skillet.json';
export const LOCK_FILE = 'skillet.lock.json';

// Bundled default registry index (raw GitHub). Replace USER on publish.
const FALLBACK_REGISTRY = 'https://raw.githubusercontent.com/USER/skillet/main/registry/index.json';

export const DEFAULTS = {
  // Where skills get installed. `.claude/skills` is the common 2026 convention.
  skillsDir: '.claude/skills',
  registry: FALLBACK_REGISTRY,
};

export function loadConfig(cwd = process.cwd()) {
  const p = join(cwd, CONFIG_FILE);
  const user = exists(p) ? readJson(p, {}) : {};
  // Precedence: project skillet.json > SKILLET_REGISTRY env (read at call time) > fallback.
  const registry = user.registry || process.env.SKILLET_REGISTRY || DEFAULTS.registry;
  return { ...DEFAULTS, ...user, registry, _path: p, _exists: exists(p) };
}

export function saveConfig(cwd, cfg) {
  const { _path, _exists, ...clean } = cfg;
  writeJson(join(cwd, CONFIG_FILE), clean);
}

export function loadLock(cwd = process.cwd()) {
  const p = join(cwd, LOCK_FILE);
  return readJson(p, { version: 1, skills: {} });
}

export function saveLock(cwd, lock) {
  writeJson(join(cwd, LOCK_FILE), lock);
}
