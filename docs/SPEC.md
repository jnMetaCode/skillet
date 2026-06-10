# The skillet skill format & registry spec

skillet deliberately does **not** invent a new skill format. A skill is a folder
containing a `SKILL.md` with YAML frontmatter — the same shape the agent-skills
ecosystem already uses. skillet adds discovery, install, and versioning around it.

## A skill

```
my-skill/
├── SKILL.md          # required — metadata + instructions
├── scripts/          # optional — supporting files, installed together
└── reference.md      # optional
```

### SKILL.md frontmatter

| field | required | notes |
| --- | :-: | --- |
| `name` | ✅ | kebab-case `[a-z0-9-]`; this is the install folder name |
| `description` | ✅ | one sentence — what it does **and when to use it** (shown in search) |
| `version` | ➖ | semver recommended for reproducible installs |
| `license` | ➖ | SPDX id (e.g. `MIT`) |
| `keywords` | ➖ | array, improves search |
| `homepage` | ➖ | URL |

Everything after the frontmatter is the instruction body the agent reads.

Validate yours:

```bash
npx skillet validate ./my-skill
```

## The registry

The registry is a single JSON file in a Git repo, served over
`raw.githubusercontent.com`. There is no server. To add your skill, open a PR
that appends one entry to [`registry/index.json`](../registry/index.json):

```json
{
  "name": "web-scraper",
  "description": "Scrape pages and extract structured data; use for web content.",
  "repo": "your-org/your-repo",
  "path": "skills/web-scraper",
  "ref": "main",
  "keywords": ["scrape", "http"],
  "license": "MIT"
}
```

| field | meaning |
| --- | --- |
| `name` | unique registry id (usually matches the skill's `name`) |
| `repo` | `owner/repo` on GitHub |
| `path` | subdirectory holding the `SKILL.md` (omit if repo root) |
| `ref` | branch or tag to install from |

### Private / alternate registries

Point skillet at any index URL or local file:

```bash
skillet add my-skill --registry https://example.com/my-registry.json
skillet add my-skill --registry ./local-registry.json
# or persist it:
skillet init   # then edit skillet.json -> "registry"
```

## Lockfile

`skillet.lock.json` records, per installed skill: the original `ref`, the source
`repo`/`path`/`gitRef`, the resolved commit `resolved` (SHA), the `version`, and
`installedAt`. Commit it, then anyone can reproduce the exact set with
`skillet install` (no args), which reinstalls every entry at its pinned `resolved`
SHA — the `npm ci` of skills. `skillet add owner/repo#<sha>` pins a single
install; branches/tags track their latest until you `skillet update`.

## Config

`skillet.json` (optional, created by `skillet init`):

```json
{
  "skillsDir": ".claude/skills",
  "registry": "https://raw.githubusercontent.com/jnMetaCode/skillet/main/registry/index.json"
}
```
