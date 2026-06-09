# Ecosystem & prior art

skillet sits on top of the open `SKILL.md` skill format and complements — rather
than competes with — the projects below. This is an honest map.

## The format & skill sources

| Project | What | Notes |
| --- | --- | --- |
| [anthropics/skills](https://github.com/anthropics/skills) | Anthropic's public Agent Skills (pdf, pptx, docx, xlsx, skill-creator, …) | The reference corpus; seeded into our registry. Some are source-available. |
| Claude Agent Skills / Claude Code | The runtime that loads `.claude/skills/*/SKILL.md` | skillet's default install target. |
| [MCP](https://modelcontextprotocol.io) | Model Context Protocol — tools/servers, a *different* extension axis | Complementary: MCP = live tools; skills = instructions/knowledge. |

## Adjacent "install a thing into your repo" tools

skillet's model is closest to these (copy-into-project + registry), applied to skills:

| Project | Domain | Why it's relevant |
| --- | --- | --- |
| [shadcn/ui](https://ui.shadcn.com) | React components | The "registry + copy into your project, not node_modules" pattern skillet borrows. |
| [Homebrew taps](https://docs.brew.sh/Taps) | CLI packages | Git-backed, server-less distribution. |
| npm / pnpm | JS packages | Lockfile + semver mental model, minus the runtime linking. |

## Where skillet fits

```
   authoring            distribution (skillet)             runtime
  ┌──────────┐   skillet new / validate   ┌───────────┐   reads SKILL.md
  │ SKILL.md │ ─────────────────────────▶ │ registry  │ ─────────────────▶  Claude Code
  │  folder  │   skillet add / lockfile   │ (JSON+Git)│   .claude/skills/   & compatible
  └──────────┘                            └───────────┘                     runtimes
```

skillet owns the **middle**: discovery, install, pinning, sharing. It does not
define the skill format (that's open) and does not run skills (that's the agent
runtime). Contributions that improve interop — more runtimes' skill dirs, an
`mcp`-aware mode, richer registry metadata — are especially welcome.
