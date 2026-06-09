// Minimal YAML-frontmatter parser for SKILL.md — supports the flat subset the
// skill spec uses: scalars (string/number/bool/null), quoted strings, inline
// arrays [a, b], and block lists (- item). No nested maps, on purpose.

function coerce(raw) {
  const v = raw.trim();
  if (v === '' || v === '~' || v === 'null') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

function parseInlineArray(v) {
  const inner = v.slice(1, -1).trim();
  if (!inner) return [];
  // naive split on commas not inside quotes
  const parts = [];
  let buf = '';
  let q = null;
  for (const ch of inner) {
    if (q) {
      if (ch === q) q = null;
      else buf += ch;
    } else if (ch === '"' || ch === "'") q = ch;
    else if (ch === ',') {
      parts.push(buf);
      buf = '';
    } else buf += ch;
  }
  parts.push(buf);
  return parts.map((p) => coerce(p)).filter((x) => x !== null || true);
}

/**
 * Split a markdown document into { data, body, raw }.
 * Returns data:{} when there is no frontmatter block.
 */
export function parseFrontmatter(text) {
  const norm = text.replace(/^﻿/, '');
  const m = norm.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: norm, raw: '' };
  const [, raw, body] = m;
  const data = {};
  const lines = raw.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) {
      i++;
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/);
    if (!kv) {
      i++;
      continue;
    }
    const key = kv[1];
    const rest = kv[2];
    if (rest === '') {
      // possibly a block list on following indented "- " lines
      const items = [];
      let j = i + 1;
      while (j < lines.length && /^\s*-\s+/.test(lines[j])) {
        items.push(coerce(lines[j].replace(/^\s*-\s+/, '')));
        j++;
      }
      data[key] = items.length ? items : null;
      i = items.length ? j : i + 1;
    } else if (rest.startsWith('[') && rest.endsWith(']')) {
      data[key] = parseInlineArray(rest);
      i++;
    } else {
      data[key] = coerce(rest);
      i++;
    }
  }
  return { data, body: body || '', raw };
}

const REQUIRED = ['name', 'description'];

/**
 * Validate a parsed SKILL.md against the spec. Returns { valid, errors[], warnings[] }.
 */
export function validateSkill(data) {
  const errors = [];
  const warnings = [];
  for (const k of REQUIRED) {
    if (!data[k] || String(data[k]).trim() === '') errors.push(`missing required field: ${k}`);
  }
  if (data.name && !/^[a-z0-9][a-z0-9-]*$/.test(String(data.name))) {
    errors.push(`name must be kebab-case [a-z0-9-]: "${data.name}"`);
  }
  if (data.description && String(data.description).length > 280) {
    warnings.push('description is long (>280 chars); keep it a one-liner for search results');
  }
  if (!data.version) warnings.push('no version field; consider semver for reproducible installs');
  if (!data.license) warnings.push('no license field');
  return { valid: errors.length === 0, errors, warnings };
}
