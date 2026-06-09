// A minimal, zero-dependency MCP (Model Context Protocol) stdio server so Claude
// / any MCP client can search and install agent skills directly.
//
// JSON-RPC 2.0, newline-delimited, one object per line. stdout carries ONLY
// protocol messages; logging goes to stderr. Spec revision 2025-06-18.
import fs from 'node:fs';
import { loadConfig } from './config.js';
import { fetchIndex, searchIndex } from './registry.js';
import { addSkill, listSkills } from './install.js';

const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const LATEST = '2025-06-18';

function pkgVersion() {
  try {
    return JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
  } catch {
    return '0.0.0';
  }
}

export const TOOLS = [
  {
    name: 'skillet_search',
    description:
      'Search the skillet registry for AI agent skills (SKILL.md). Returns matching skills with ' +
      'their name, description and source repo. Use before installing to find the right skill.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search terms (e.g. "pdf", "slides")' } },
    },
  },
  {
    name: 'skillet_install',
    description:
      'Install a skill from the registry into this project (.claude/skills/). Pass the registry ' +
      'name from skillet_search. The skill folder is copied in and pinned in skillet.lock.json.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Registry skill name (from skillet_search)' },
        force: { type: 'boolean', description: 'Overwrite if already installed' },
      },
      required: ['name'],
    },
  },
  {
    name: 'skillet_list',
    description: 'List the skills currently installed in this project.',
    inputSchema: { type: 'object', properties: {} },
  },
];

function makeTools() {
  const cwd = process.cwd();
  const cfg = loadConfig(cwd);
  return {
    async skillet_search(a) {
      const index = await fetchIndex(cfg.registry);
      const results = searchIndex(index, (a && a.query) || '');
      if (!results.length) return text(`No skills match "${(a && a.query) || ''}".`);
      return text(
        results
          .map((s) => `• ${s.name} — ${s.description || ''}\n  install: skillet_install { name: "${s.name}" }  [${s.repo}${s.path ? '/' + s.path : ''}]`)
          .join('\n')
      );
    },
    async skillet_install(a) {
      if (!a || !a.name) throw new Error('name is required');
      // Registry name only (no arbitrary owner/repo or local paths over MCP);
      // install.js additionally validates the resolved skill name is safe.
      if (!/^[a-z0-9][a-z0-9._-]*$/i.test(a.name)) throw new Error(`invalid skill name "${a.name}"`);
      const r = await addSkill(cwd, cfg, a.name, { force: !!a.force });
      return text(`Installed ${r.name}${r.version ? ' @' + r.version : ''} → ${cfg.skillsDir}/${r.name}` + (r.resolved && r.resolved !== 'local' ? ` (pinned ${String(r.resolved).slice(0, 10)})` : ''));
    },
    async skillet_list() {
      const skills = listSkills(cwd, cfg);
      if (!skills.length) return text('No skills installed.');
      return text(skills.map((s) => `• ${s.name}${s.version ? ' @' + s.version : ''} — ${s.description || ''}`).join('\n'));
    },
  };
}

const text = (t) => ({ content: [{ type: 'text', text: t }] });
const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

export function createHandler() {
  const tools = makeTools();
  const version = pkgVersion();
  return async function handle(msg) {
    if (msg == null || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
      return msg && 'id' in msg ? fail(msg.id, -32600, 'Invalid Request') : null;
    }
    if (!('id' in msg)) return null; // notification — never reply
    const { id, method, params } = msg;
    try {
      switch (method) {
        case 'initialize':
          return ok(id, {
            protocolVersion: SUPPORTED_VERSIONS.includes(params && params.protocolVersion) ? params.protocolVersion : LATEST,
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: 'skillet', version },
          });
        case 'ping':
          return ok(id, {});
        case 'tools/list':
          return ok(id, { tools: TOOLS });
        case 'tools/call': {
          const tool = tools[params && params.name];
          if (!tool) return fail(id, -32602, `Unknown tool: ${params && params.name}`);
          try {
            return ok(id, await tool((params && params.arguments) || {}));
          } catch (e) {
            return ok(id, { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true });
          }
        }
        default:
          return fail(id, -32601, `Method not found: ${method}`);
      }
    } catch (e) {
      return fail(id, -32603, `Internal error: ${e.message}`);
    }
  };
}

export function startMcp() {
  const handle = createHandler();
  const send = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
        continue;
      }
      Promise.resolve(handle(msg))
        .then((res) => res && send(res))
        .catch((e) => process.stderr.write(`skillet mcp: ${e.message}\n`));
    }
  });
  process.stdin.on('end', () => process.exit(0));
  process.stderr.write('skillet MCP server ready on stdio\n');
}
