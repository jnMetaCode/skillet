---
name: repo-onboarding
description: Systematically map an unfamiliar codebase before changing it — entry points, build/test loop, conventions, data flow. Use when starting work in a repo you haven't seen, or asked "how does this codebase work?".
version: 1.0.0
license: MIT
keywords: [onboarding, codebase, exploration, architecture, conventions]
---

# repo-onboarding

Resist editing until you can answer: *how do I run it, how do I test it, where
does the change go, and what style does this house write in?*

## Procedure (15 minutes, in order)

1. **The README + manifest first.** `README.md`, then the manifest
   (`package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml`): name, scripts,
   dependencies. The `scripts` block is the repo telling you its verbs.
2. **Find the entry points.** `bin`/`main` fields, `src/index.*`, `cmd/`,
   `__main__.py`. Trace one request/command end-to-end at skim depth — names
   only, no line-reading.
3. **Establish the test loop before touching anything.** Run the test command;
   record how long it takes and whether it's green at HEAD. A red baseline
   changes everything you conclude later.
4. **Map the directories** (one line each, only top two levels). Mark the ones
   that are generated/vendored so you never read them again.
5. **Sample the house style.** Open the 2–3 most-recently-changed source files
   (`git log --name-only -10`): error handling pattern, naming, comment density,
   test structure. Your changes should be indistinguishable from these.
6. **Find the seams.** Where does config enter? Where is I/O isolated? What is
   the one module everything imports? That module is load-bearing — changes
   there need the most care.
7. **Check the repo's own rules:** `CONTRIBUTING.md`, `CLAUDE.md`, `.github/`
   workflows (what CI actually enforces), lint configs.

## Output

Write a short map (10–20 lines) before starting the actual task:

```
run:   npm start (src/cli.js)        test: npm test, ~6s, green at HEAD
flow:  cli.js → commands/* → store.js (all persistence) → index.json
style: ESM, no deps, errors thrown as plain Error, tests in test/*.test.js
care:  store.js is imported everywhere; schema changes ripple
rules: CI runs lint+test on 3 OS; commits are conventional
```

Keep it honest — list what you *didn't* look at, so later-you knows where the
map has blank spots.
