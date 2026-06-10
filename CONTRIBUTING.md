# Contributing to skillet

Two very different kinds of contribution — both welcome.

## 1. Add a skill to the registry (no code)

This is the most valuable contribution right now. Open a PR appending one entry
to [`registry/index.json`](registry/index.json). See
[docs/SPEC.md](docs/SPEC.md) for the entry format. Requirements:

- The skill lives in a public Git repo and has a valid `SKILL.md`
  (`npx skillet validate <path>` passes).
- `name` is unique in the registry and kebab-case.
- `description` says what it does **and when to use it** (it's what people search).

CI validates new entries. Keep the list alphabetical-ish; quality over quantity.

## 2. Improve the CLI (code)

Ground rules, same spirit as the tool:

- **No runtime dependencies.** Node built-ins + the user's `git` only. Anything
  in `dependencies` needs a very strong reason.
- **Target Node 18+.** Keep it readable — the whole CLI should be skimmable.
- **Tests required.** `npm test` runs the Node built-in runner against `test/`.
  Parser/registry/install changes need a fixture-based test. The real-GitHub
  install test runs when `SKILLET_E2E=1`.

### Dev loop

```bash
git clone https://github.com/jnMetaCode/skillet && cd skillet
node src/cli.js --help
node src/cli.js add ./examples/skills/hello-world   # local install
npm test
SKILLET_E2E=1 npm test                              # include the network test
```

### Where things live

- `src/frontmatter.js` — SKILL.md parsing + validation
- `src/registry.js` — the JSON index: fetch + search + resolve
- `src/source.js` — resolve a ref and fetch it (local / GitHub via git)
- `src/install.js` — add/remove/list/update + lockfile
- `src/cli.js` — commands + help
