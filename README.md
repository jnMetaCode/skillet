<div align="center">

# 🍳 skillet

### A package manager for AI agent skills

**Find, install, version and share `SKILL.md` skills — from a Git-backed registry.**
No server, no account, no lock-in. Just `npx skillet add <skill>`.

```bash
npx skillet add pdf
```

<!-- TODO: replace with a real screen recording before launch -->
<!-- ![skillet demo](docs/demo.gif) -->

</div>

---

Agent **Skills** are taking over — a `SKILL.md` folder that teaches an agent a new
capability (read PDFs, build slide decks, scrape the web…). But sharing them is a
mess: you copy-paste from random repos, pin nothing, and have no way to discover
what exists.

**skillet** is `npm`/`brew` for skills. One command to install a skill into your
project, a lockfile so it's reproducible, and a registry that's just a JSON file
in a Git repo — so there's nothing to host and anyone can contribute with a PR.

```bash
npx skillet search pdf            # discover
npx skillet add pdf               # install into .claude/skills/
npx skillet list                  # see what's installed
npx skillet new my-skill          # scaffold your own
```

## Why skillet

- **Skills are files, not dependencies.** Like [shadcn/ui](https://ui.shadcn.com),
  skillet *copies the skill into your repo* (`.claude/skills/<name>/`) where you
  can read and tweak it — not into an opaque `node_modules`.
- **Pinnable & tracked.** Every install records the exact commit SHA it resolved
  to in `skillet.lock.json`. Pin to an exact commit with `add owner/repo#<sha>`;
  `skillet update` re-resolves a branch/tag to its latest.
- **Zero infrastructure.** The registry is a JSON index in a Git repo, served
  over raw GitHub. No backend, no database, no API keys. Adding a skill is a PR.
- **Install from anywhere.** A registry name, any `owner/repo[/path][#ref]`, or a
  local folder.
- **Zero dependencies.** Pure Node built-ins + your system `git`. The whole CLI
  is a few hundred readable lines.

## Install targets

```bash
npx skillet add pdf                              # from the registry
npx skillet add anthropics/skills/skills/pptx    # any GitHub repo + subpath
npx skillet add owner/repo#v2.1.0                # a tag/branch
npx skillet add owner/repo#<commit-sha>          # pin to an exact commit
npx skillet add ./skills/my-local-skill          # a local folder
```

Skills install into `.claude/skills/` by default (the common 2026 convention).
Change it per-project with `skillet init` or `--dir`.

## Browse the registry

```bash
npx skillet gallery        # builds a static, searchable HTML gallery → site/
```

`skillet gallery` renders [`registry/index.json`](registry/index.json) into a
single self-contained page (search, copy-to-install, links) — zero backend. The
included GitHub Pages workflow rebuilds and publishes it automatically whenever
the registry changes, so the registry has a shareable home.

## Authoring a skill

```bash
npx skillet new web-scraper      # creates web-scraper/SKILL.md from a template
# edit it…
npx skillet validate ./web-scraper
```

A skill is just a folder with a `SKILL.md`:

```markdown
---
name: web-scraper
description: Scrape pages and extract structured data; use when the user wants web content.
version: 0.1.0
license: MIT
keywords: [scrape, http]
---

# web-scraper
Instructions the agent reads… plus any supporting scripts in the same folder.
```

Push it to GitHub, then open a PR adding one entry to
[`registry/index.json`](registry/index.json) — see [docs/SPEC.md](docs/SPEC.md).

## Commands

| | |
| --- | --- |
| `skillet search [query]` | search the registry |
| `skillet add <ref>` | install a skill (registry name / `owner/repo[/path][#ref]` / `./local`) |
| `skillet list` | list installed skills |
| `skillet remove <name>` | uninstall |
| `skillet update [name]` | re-install tracked skill(s) at the latest ref |
| `skillet new <name>` | scaffold a new skill |
| `skillet validate [path]` | validate a `SKILL.md` |
| `skillet init` | write `skillet.json` config |

Flags: `--force`, `--dir <path>`, `--registry <url|path>`, `--json`.

## How it works

```
  skillet add pdf
        │  resolve name in registry index (raw GitHub JSON)
        ▼
  git clone --depth 1 anthropics/skills      ← your system git, partial clone
        │  copy skills/pdf/ → .claude/skills/pdf/
        ▼
  pin commit SHA in skillet.lock.json
```

The "registry" is [one JSON file](registry/index.json). That's the whole backend.

## Compatibility

Works with anything that reads `SKILL.md` skill folders (Claude Code / Claude
Agent Skills and compatible runtimes). skillet is just discovery + install +
versioning around the open `SKILL.md` format — it doesn't lock you to a runtime.

## Status

Early MVP — discovery, install (registry / GitHub / local), lockfile pinning,
authoring and validation all work today. Star/watch to follow along; PRs and new
registry entries are the most useful contribution right now.

## Sibling projects

Part of a small, local-first, zero-dependency toolkit for building AI agents:

- 🍳 **skillet** — a package manager for agent skills *(this repo)*
- 🔭 **[tracelet](https://github.com/USER/tracelet)** — local DevTools to debug agent runs
- 🧠 **[engram](https://github.com/USER/engram)** — a local, private memory layer for agents (and you)

## License

MIT — see [LICENSE](LICENSE). (Skills installed *through* skillet keep their own
licenses.)
