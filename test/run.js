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
import { generateGallery } from '../src/gallery.js';
import { createHandler } from '../src/mcp.js';
import { spawn } from 'node:child_process';

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

// --------------------------------------------------------------- gallery ---
test('gallery: renders all skills, escapes HTML, includes install commands', async () => {
  const index = await fetchIndex(INDEX);
  const html = generateGallery(index, { title: 'skillet' });
  assert.match(html, /<!doctype html>/i);
  // every skill name and its install command appears
  for (const s of index.skills) {
    assert.ok(html.includes(`>${s.name}</h3>`), `missing card for ${s.name}`);
    assert.ok(html.includes(`npx skillet add ${s.name}`), `missing install cmd for ${s.name}`);
  }
  // count is reflected
  assert.ok(html.includes(`${index.skills.length} skills`));
});

test('gallery: escapes injection in skill fields', () => {
  const html = generateGallery({
    skills: [{ name: 'x', description: '<img src=x onerror=alert(1)>', keywords: ['"</style>'] }],
  });
  assert.ok(!html.includes('<img src=x onerror'), 'description must be escaped');
  assert.ok(html.includes('&lt;img src=x onerror'));
});

test('install refuses a skill whose name escapes skillsDir (even with --force)', async () => {
  const cwd = tmpProj();
  const evil = fs.mkdtempSync(join(os.tmpdir(), 'skillet-evil-'));
  fs.writeFileSync(join(evil, 'SKILL.md'), '---\nname: ../../pwned\ndescription: x\n---\nbody\n');
  await assert.rejects(
    () => addSkill(cwd, { skillsDir: '.claude/skills', registry: INDEX }, evil, { force: true }),
    /unsafe skill name|outside/
  );
  assert.equal(fs.existsSync(join(cwd, '..', 'pwned')), false);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(evil, { recursive: true, force: true });
});

test('gallery tolerates malformed registry entries (missing name/repo)', () => {
  const html = generateGallery({
    skills: [{ description: 'no name — should be skipped' }, { name: 'ok-skill', description: 'fine' }],
  });
  assert.ok(html.includes('>ok-skill</h3>'));
  assert.ok(!html.includes('github.com/"')); // no broken repo link
  assert.ok(!html.includes('>undefined<'));
});

// -------------------------------------------------------------------- mcp ---
test('skillet MCP handler: initialize, tools/list, search, install error', async () => {
  process.env.SKILLET_REGISTRY = INDEX; // offline registry
  const h = createHandler();

  const init = await h({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } });
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.equal(init.result.serverInfo.name, 'skillet');

  assert.equal(await h({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);

  const list = await h({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  assert.deepEqual(list.result.tools.map((t) => t.name).sort(), ['skillet_install', 'skillet_list', 'skillet_search']);

  const search = await h({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'skillet_search', arguments: { query: 'powerpoint' } } });
  assert.match(search.result.content[0].text, /pptx/);

  // unknown registry skill -> tool error (not a protocol error)
  const bad = await h({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'skillet_install', arguments: { name: 'no-such-skill-xyz' } } });
  assert.equal(bad.result.isError, true);

  // unknown tool -> JSON-RPC error
  const unk = await h({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'nope', arguments: {} } });
  assert.equal(unk.error.code, -32602);

  delete process.env.SKILLET_REGISTRY;
});

test('skillet MCP stdio: real spawned handshake (pure-JSON stdout)', async () => {
  const cli = fileURLToPath(new URL('../src/cli.js', import.meta.url));
  const child = spawn(process.execPath, [cli, 'mcp'], {
    env: { ...process.env, SKILLET_REGISTRY: INDEX, NO_COLOR: '1' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const lines = [];
  let buf = '';
  const got = new Promise((resolve, reject) => {
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (d) => {
      buf += d;
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (line) {
          lines.push(JSON.parse(line));
          if (lines.length >= 2) resolve();
        }
      }
    });
    child.on('error', reject);
    setTimeout(() => reject(new Error('timeout')), 5000);
  });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }) + '\n');
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) + '\n');
  await got;
  child.kill();
  assert.equal(lines.find((l) => l.id === 1).result.serverInfo.name, 'skillet');
  assert.ok(lines.find((l) => l.id === 2).result.tools.some((t) => t.name === 'skillet_search'));
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
