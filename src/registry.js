// The registry is just a JSON index file living in a Git repo (served over
// raw.githubusercontent.com) — no server, no database. Adding a skill = a PR
// that appends an entry. The CLI can also read a local index file for testing.
import { readJson, die } from './util.js';

export async function fetchIndex(registry) {
  if (/^https?:\/\//.test(registry)) {
    let res;
    try {
      res = await fetch(registry, { headers: { accept: 'application/json' } });
    } catch (e) {
      die(`could not reach registry: ${registry}\n  ${e.message}`);
    }
    if (!res.ok) die(`registry returned ${res.status} for ${registry}`);
    const json = await res.json().catch(() => die('registry index is not valid JSON'));
    return normalize(json);
  }
  // local file path (used in tests / private registries)
  const json = readJson(registry, null);
  if (!json) die(`registry index not found: ${registry}`);
  return normalize(json);
}

function normalize(json) {
  const skills = Array.isArray(json) ? json : json.skills || [];
  return { version: json.version || 1, skills };
}

export function searchIndex(index, query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return index.skills;
  return index.skills.filter((s) => {
    const hay = [s.name, s.description, ...(s.keywords || [])].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

export function findInIndex(index, name) {
  return index.skills.find((s) => s.name === name) || null;
}

// Turn a registry entry ("repo": "owner/repo", "path", "ref") into a source spec.
export function entryToSpec(entry) {
  const [owner, repo, ...rest] = String(entry.repo || '').split('/');
  if (!owner || !repo) die(`registry entry "${entry.name}" has an invalid repo field`);
  return {
    kind: 'github',
    owner,
    repo,
    path: entry.path || rest.join('/') || '',
    ref: entry.ref || null,
  };
}
