// Zero-dependency test suite.  node --test test/run.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, validateSkill } from '../src/frontmatter.js';
import { resolveRef } from '../src/source.js';
import { searchIndex, findInIndex, entryToSpec, fetchIndex } from '../src/registry.js';
import { addSkill, listSkills, removeSkill, updateSkill } from '../src/install.js';

const HELLO = fileURLToPath(new URL('../examples/skills/hello-world', import.meta.url));
const INDEX = fileURLToPath(new URL('../registry/index.json', import.meta.url));
const tmpProj = () => fs.mkdtempSync(join(os.tmpdir(), 'skillet-test-'));

// ----------------------------------------------------------- frontmatter ---
test('parses scalars, quotes, inline arrays and block lists', () => {
  const { data, body } = parseFrontmatter(
    [
      '---',
      'name: web-scraper',
      'description: "Scrape, carefully: respect robots"',
      'version: 1.2.0',
      'enabled: true',
      'keywords: [scrape, http, html]',
      'authors:',
      '  - alice',
      '  - bob',
      '---',
      '# body here',
    ].join('\n')
  );
  assert.equal(data.name, 'web-scraper');
  assert.equal(data.description, 'Scrape, carefully: respect robots');
  assert.equal(data.version, '1.2.0'); // semver stays a string
  assert.equal(data.enabled, true);
  assert.deepEqual(data.keywords, ['scrape', 'http', 'html']);
  assert.deepEqual(data.authors, ['alice', 'bob']);
  assert.match(body, /# body here/);
});

test('returns empty data when no frontmatter', () => {
  const { data, body } = parseFrontmatter('# just markdown\nhello');
  assert.deepEqual(data, {});
  assert.match(body, /just markdown/);
});

test('validateSkill: required fields, kebab name, warnings', () => {
  assert.equal(validateSkill({ name: 'ok-skill', description: 'd', version: '1', license: 'MIT' }).valid, true);

  const missing = validateSkill({ name: 'x' });
  assert.equal(missing.valid, false);
  assert.match(missing.errors.join(), /description/);

  const badName = validateSkill({ name: 'Bad Name', description: 'd' });
  assert.equal(badName.valid, false);
  assert.match(badName.errors.join(), /kebab-case/);

  const warns = validateSkill({ name: 'ok', description: 'd' });
  assert.ok(warns.warnings.some((w) => /version/.test(w)));
});

// -------------------------------------------------------------- resolveRef ---
test('resolveRef distinguishes local / github / registry', () => {
  assert.equal(resolveRef('./my-skill').kind, 'local');
  assert.equal(resolveRef('/abs/path').kind, 'local');

  const gh = resolveRef('anthropics/skills/skills/pdf#main');
  assert.deepEqual(
    { kind: gh.kind, owner: gh.owner, repo: gh.repo, path: gh.path, ref: gh.ref },
    { kind: 'github', owner: 'anthropics', repo: 'skills', path: 'skills/pdf', ref: 'main' }
  );

  const gh2 = resolveRef('owner/repo');
  assert.equal(gh2.path, '');
  assert.equal(gh2.ref, null);

  assert.deepEqual(resolveRef('pdf'), { kind: 'registry', name: 'pdf' });
});

// --------------------------------------------------------------- registry ---
test('registry: fetch local index, search, resolve entry', async () => {
  const index = await fetchIndex(INDEX);
  assert.ok(index.skills.length >= 5);

  assert.equal(searchIndex(index, 'powerpoint').length, 1);
  assert.ok(searchIndex(index, 'document').length >= 1);
  assert.equal(searchIndex(index, '').length, index.skills.length);

  const entry = findInIndex(index, 'pdf');
  assert.ok(entry);
  const spec = entryToSpec(entry);
  assert.deepEqual(
    { kind: spec.kind, owner: spec.owner, repo: spec.repo, path: spec.path },
    { kind: 'github', owner: 'anthropics', repo: 'skills', path: 'skills/pdf' }
  );
});

// ---------------------------------------------------------------- install ---
test('install from a local folder: copy + lockfile + list + remove', async () => {
  const cwd = tmpProj();
  const cfg = { skillsDir: '.claude/skills', registry: INDEX };

  const r = await addSkill(cwd, cfg, HELLO);
  assert.equal(r.name, 'hello-world');
  assert.equal(r.version, '1.0.0');
  assert.ok(fs.existsSync(join(cwd, '.claude/skills/hello-world/SKILL.md')));

  const lock = JSON.parse(fs.readFileSync(join(cwd, 'skillet.lock.json'), 'utf8'));
  assert.equal(lock.skills['hello-world'].kind, 'local');
  assert.equal(lock.skills['hello-world'].version, '1.0.0');

  const list = listSkills(cwd, cfg);
  assert.equal(list.length, 1);
  assert.equal(list[0].name, 'hello-world');

  // re-install without --force fails
  await assert.rejects(() => addSkill(cwd, cfg, HELLO), /already installed/);
  // with force it succeeds
  await assert.doesNotReject(() => addSkill(cwd, cfg, HELLO, { force: true }));
  // update (tracked, local) works
  const u = await updateSkill(cwd, cfg, 'hello-world');
  assert.equal(u.name, 'hello-world');

  removeSkill(cwd, cfg, 'hello-world');
  assert.equal(fs.existsSync(join(cwd, '.claude/skills/hello-world')), false);
  const lock2 = JSON.parse(fs.readFileSync(join(cwd, 'skillet.lock.json'), 'utf8'));
  assert.equal(lock2.skills['hello-world'], undefined);

  fs.rmSync(cwd, { recursive: true, force: true });
});

test('install rejects a folder without SKILL.md', async () => {
  const cwd = tmpProj();
  const empty = fs.mkdtempSync(join(os.tmpdir(), 'skillet-empty-'));
  await assert.rejects(() => addSkill(cwd, { skillsDir: '.claude/skills', registry: INDEX }, empty), /SKILL\.md/);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(empty, { recursive: true, force: true });
});

// ------------------------------------------- network (opt-in) install test ---
test('install from GitHub registry (network)', { skip: process.env.SKILLET_E2E !== '1' }, async () => {
  const cwd = tmpProj();
  const cfg = { skillsDir: '.claude/skills', registry: INDEX };
  const r = await addSkill(cwd, cfg, 'pdf');
  assert.equal(r.name, 'pdf');
  assert.ok(fs.existsSync(join(cwd, '.claude/skills/pdf/SKILL.md')));
  fs.rmSync(cwd, { recursive: true, force: true });
});
