#!/usr/bin/env node
import fs from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { c, log, ok, info, warn, UserError } from './util.js';
import { loadConfig, saveConfig, DEFAULTS } from './config.js';
import { fetchIndex, searchIndex } from './registry.js';
import { addSkill, removeSkill, listSkills, updateSkill, installFromLock } from './install.js';
import { parseFrontmatter, validateSkill } from './frontmatter.js';
import { generateGallery } from './gallery.js';
import { startMcp } from './mcp.js';

function parseArgs(argv) {
  const flags = {};
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--force' || a === '-f') flags.force = true;
    else if (a === '--json') flags.json = true;
    else if (a === '--dir') flags.dir = argv[++i];
    else if (a === '--registry') flags.registry = argv[++i];
    else if (a === '--out') flags.out = argv[++i];
    else if (a === '-h' || a === '--help') flags.help = true;
    else if (a === '-v' || a === '--version') flags.version = true;
    else pos.push(a);
  }
  return { flags, pos };
}

const HELP = `${c.bold('skillet')} — a package manager for AI agent skills

${c.bold('Usage')}
  skillet <command> [args] [flags]

${c.bold('Commands')}
  ${c.cyan('search')} [query]        search the registry for skills
  ${c.cyan('add')} <ref>            install a skill (registry name, owner/repo[/path][#ref], or ./local)
  ${c.cyan('install')}              install all skills from skillet.lock.json at their pinned commits
  ${c.cyan('list')}                 list installed skills
  ${c.cyan('remove')} <name>        uninstall a skill
  ${c.cyan('update')} [name]        re-install tracked skill(s) at the latest ref
  ${c.cyan('new')} <name>           scaffold a new SKILL.md skill folder
  ${c.cyan('validate')} [path]      validate a SKILL.md (default: ./)
  ${c.cyan('gallery')}              build a static, browsable HTML gallery of the registry
  ${c.cyan('mcp')}                  run as an MCP server over stdio (Claude/agents)
  ${c.cyan('init')}                 create skillet.json in this project

${c.bold('Flags')}
  -f, --force          overwrite / ignore validation errors
      --dir <path>     skills directory (default: ${DEFAULTS.skillsDir})
      --registry <url> registry index URL or local path
      --json           machine-readable output (search/list)
  -h, --help           show help
  -v, --version        show version

${c.bold('Examples')}
  npx @jnmetacode/skillet search pdf
  npx @jnmetacode/skillet add pdf-extractor
  npx @jnmetacode/skillet add anthropics/skills/skills/pdf
  npx @jnmetacode/skillet add ./my-skill
  npx @jnmetacode/skillet new web-scraper`;

function cfgWith(flags) {
  const cwd = process.cwd();
  const cfg = loadConfig(cwd);
  if (flags.dir) cfg.skillsDir = flags.dir;
  if (flags.registry) cfg.registry = flags.registry;
  return { cwd, cfg };
}

function pkgVersion() {
  const p = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  return p.version;
}

const SKILL_TEMPLATE = (name) => `---
name: ${name}
description: One sentence on what this skill does and when to use it.
version: 0.1.0
license: MIT
keywords: []
---

# ${name}

Describe the capability here. This file is the skill — the agent reads it.

## Instructions

1. ...
2. ...

## Notes

Put any supporting files (scripts, templates) alongside this SKILL.md; they are
installed together.
`;

const commands = {
  async search([query], flags) {
    const { cfg } = cfgWith(flags);
    const index = await fetchIndex(cfg.registry);
    const results = searchIndex(index, query);
    if (flags.json) return log(JSON.stringify(results, null, 2));
    if (!results.length) return warn(`no skills match "${query || ''}"`);
    log('');
    for (const s of results) {
      log(`  ${c.bold(c.green(s.name))}${s.version ? c.dim(' @' + s.version) : ''}`);
      log(`    ${s.description || ''}`);
      log(`    ${c.dim(s.repo + (s.path ? '/' + s.path : ''))}`);
      log('');
    }
    log(c.dim(`  ${results.length} skill(s). Install with: skillet add <name>`));
  },

  async add([ref], flags) {
    if (!ref) throw new UserError('usage: skillet add <ref>');
    const { cwd, cfg } = cfgWith(flags);
    info(`installing ${c.bold(ref)} → ${cfg.skillsDir}/`);
    const r = await addSkill(cwd, cfg, ref, { force: flags.force });
    ok(`installed ${c.bold(r.name)}${r.version ? ' @' + r.version : ''} → ${cfg.skillsDir}/${r.name}`);
    if (r.resolved && r.resolved !== 'local') log(c.dim(`  pinned ${r.resolved.slice(0, 10)} in skillet.lock.json`));
    for (const w of r.warnings || []) warn(w);
  },

  async install(_args, flags) {
    const { cwd, cfg } = cfgWith(flags);
    info(`installing skills from skillet.lock.json → ${cfg.skillsDir}/`);
    const { installed, failed } = await installFromLock(cwd, cfg, { force: true });
    if (installed.length) ok(`installed ${installed.length} skill(s): ${installed.join(', ')}`);
    for (const f of failed) warn(`skipped ${f.name}: ${f.reason}`);
    if (failed.length) throw new UserError(`${failed.length} of ${installed.length + failed.length} skill(s) failed to install`);
  },

  list(_args, flags) {
    const { cwd, cfg } = cfgWith(flags);
    const skills = listSkills(cwd, cfg);
    if (flags.json) return log(JSON.stringify(skills, null, 2));
    if (!skills.length) return info(`no skills installed in ${cfg.skillsDir}/. Try: skillet search`);
    log('');
    for (const s of skills) {
      log(`  ${c.bold(s.name)}${s.version ? c.dim(' @' + s.version) : ''}  ${c.dim(s.source)}`);
      if (s.description) log(`    ${c.dim(s.description)}`);
    }
    log('');
  },

  remove([name], flags) {
    if (!name) throw new UserError('usage: skillet remove <name>');
    const { cwd, cfg } = cfgWith(flags);
    removeSkill(cwd, cfg, name);
    ok(`removed ${c.bold(name)}`);
  },

  async update([name], flags) {
    const { cwd, cfg } = cfgWith(flags);
    if (name) {
      const r = await updateSkill(cwd, cfg, name);
      return ok(`updated ${c.bold(r.name)}${r.version ? ' @' + r.version : ''}`);
    }
    const installed = listSkills(cwd, cfg);
    for (const s of installed) {
      try {
        const r = await updateSkill(cwd, cfg, s.name);
        ok(`updated ${c.bold(r.name)}${r.version ? ' @' + r.version : ''}`);
      } catch (e) {
        warn(`skip ${s.name}: ${e.message}`);
      }
    }
  },

  new([name], flags) {
    if (!name) throw new UserError('usage: skillet new <name>');
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new UserError('name must be kebab-case [a-z0-9-]');
    const dir = join(process.cwd(), name);
    if (fs.existsSync(dir) && !flags.force) throw new UserError(`${name}/ already exists (use --force)`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(join(dir, 'SKILL.md'), SKILL_TEMPLATE(name));
    ok(`created ${c.bold(name + '/SKILL.md')}`);
    log(c.dim(`  edit it, then test locally:  skillet add ./${name}`));
    log(c.dim(`  publish:  push to GitHub and PR an entry to the registry`));
  },

  validate([path = '.'], flags) {
    const file = path.endsWith('SKILL.md') ? path : join(path, 'SKILL.md');
    if (!fs.existsSync(file)) throw new UserError(`no SKILL.md at ${file}`);
    const { data } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
    const { valid, errors, warnings } = validateSkill(data);
    for (const e of errors) log(c.red('✗ ' + e));
    for (const w of warnings) warn(w);
    if (valid) ok(`${file} is a valid skill${warnings.length ? ' (with warnings)' : ''}`);
    if (!valid) process.exitCode = 1;
  },

  async gallery(_args, flags) {
    // Default to the bundled registry file so `skillet gallery` works in-repo.
    const bundled = fileURLToPath(new URL('../registry/index.json', import.meta.url));
    const source = flags.registry || bundled;
    const index = await fetchIndex(source);
    const html = generateGallery(index);
    const outDir = flags.out || 'site';
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = join(outDir, 'index.html');
    fs.writeFileSync(outFile, html);
    ok(`wrote ${outFile} (${index.skills.length} skills)`);
    log(c.dim(`  preview: open ${outFile}  ·  deploy the "${outDir}" folder to GitHub Pages`));
  },

  mcp() {
    // stdio is the protocol channel — do not print to stdout.
    startMcp();
  },

  init(_args, flags) {
    const { cwd, cfg } = cfgWith(flags);
    if (cfg._exists && !flags.force) throw new UserError('skillet.json already exists (use --force)');
    saveConfig(cwd, { skillsDir: cfg.skillsDir, registry: cfg.registry });
    ok(`wrote skillet.json (skillsDir: ${cfg.skillsDir})`);
  },
};

async function main() {
  const { flags, pos } = parseArgs(process.argv.slice(2));
  const cmd = pos.shift();
  if (flags.version) return log(pkgVersion());
  if (!cmd || flags.help || cmd === 'help') return log(HELP);
  const handler = commands[cmd];
  if (!handler) {
    log(c.red(`unknown command: ${cmd}`));
    log(HELP);
    process.exitCode = 1;
    return;
  }
  await handler(pos, flags);
}

main().catch((e) => {
  if (e instanceof UserError) console.error(c.red('✗ ') + e.message);
  else console.error(e);
  process.exitCode = 1;
});
