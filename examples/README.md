# skillet — a worked example

`skillet` is a package manager for **AI agent skills** (`SKILL.md` folders). This
folder has a tiny local skill (`skills/hello-world`) so you can try installing,
authoring, and the MCP server in under a minute.

## What it does

- **search / add** skills from a Git-backed registry (a JSON file in a repo — no
  server), or from any `owner/repo[/path][#ref]`, or a local folder.
- **install** copies the skill into your project (`.claude/skills/<name>/`) and
  pins the exact commit in `skillet.lock.json` — so `skillet install` reproduces
  it byte-for-byte later (the `npm ci` of skills).

## Try it

From the repo root:

```bash
# discover what's in the registry
npx skillet search pdf
#   pdf — Extract text and tables from PDFs, fill forms, merge/split, OCR…

# install a real skill from the registry (clones anthropics/skills, pins the SHA)
npx skillet add pdf
#   ✓ installed pdf → .claude/skills/pdf   (pinned <sha> in skillet.lock.json)

# install the bundled LOCAL example skill (offline — no git needed)
npx skillet add ./examples/skills/hello-world
npx skillet list

# reproduce everything from the lockfile (e.g. on a teammate's machine)
npx skillet install
```

## Author your own

```bash
npx skillet new my-skill          # scaffolds my-skill/SKILL.md
npx skillet validate ./my-skill   # checks the frontmatter
# push to GitHub, then PR one line into registry/index.json (see docs/SPEC.md)
```

## Browse the registry as a web page

```bash
npx skillet gallery               # → site/index.html (searchable, zero backend)
```

## Use it from your AI assistant (MCP)

```json
{ "mcpServers": { "skillet": { "command": "npx", "args": ["-y", "skillet", "mcp"] } } }
```

Now an assistant can `skillet_search` and `skillet_install` skills for itself.
See the main [README](../README.md) for the full reference.
