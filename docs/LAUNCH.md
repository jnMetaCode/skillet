# Launch playbook (internal)

Go-to-market checklist for skillet. Move this out of the repo before/after launch
if you prefer to keep it private.

## Pre-flight

- [x] Replace `USER` in `package.json`, `src/config.js`, and docs with the real
      GitHub org/user (the default registry URL points there) → **jnMetaCode**. *(done)*
- [x] **npm name decided → `@jnmetacode/skillet`** (unscoped `skillet` is taken;
      scoped keeps the brand, bin stays `skillet`). Claim the `jnmetacode` npm
      username/org before publishing — see engram's `docs/LAUNCH.md` for the
      scope-claim steps. *(name set in package.json + docs)*
- [x] Seed `registry/index.json` — **22 skills**: all 17 from anthropics/skills
      plus 5 first-party skills hosted in this repo (`skills/`): engram-memory,
      tracelet-instrument, conventional-commits, changelog, repo-onboarding.
      Every entry verified to resolve; live `search`+`add` tested. *(done)*
- [ ] Record the hero GIF (script below) → `docs/demo.gif`, uncomment in README.
- [ ] Add `NPM_TOKEN` secret; `git tag v0.1.0 && git push --tags` to publish.
- [ ] Verify `npx @jnmetacode/skillet add pdf` works from a clean machine.

## Hero GIF (15–25s) — highest-leverage asset

1. `npx @jnmetacode/skillet search pdf` → clean list of results.
2. `npx @jnmetacode/skillet add pdf` → "✓ installed pdf → .claude/skills/pdf · pinned <sha>".
3. `ls .claude/skills/pdf` → real files appear.
4. `npx @jnmetacode/skillet new my-skill` → scaffold, then `skillet validate ./my-skill` ✓.

No narration, loop-friendly. Tools: Kap / QuickTime + Gifski.

## Show HN post

**Title:**
> Show HN: Skillet – npm for AI agent skills (zero-infra, Git-backed registry)

**Body:**
> Agent "Skills" (a SKILL.md folder that teaches an agent a capability) are
> everywhere now, but sharing them is copy-paste from random repos with no
> versioning or discovery.
>
> Skillet is a package manager for them. `npx @jnmetacode/skillet add pdf` finds the skill in
> a registry, `git clone --depth 1`s it, copies the folder into your
> `.claude/skills/`, and pins the commit SHA in a lockfile. `skillet new` +
> `skillet validate` help you author your own; publishing is a PR that appends one
> line to a JSON index.
>
> The thing I like: there's no backend. The "registry" is a single JSON file in a
> Git repo served over raw GitHub — like a Homebrew tap, or shadcn/ui's registry,
> applied to skills. Zero runtime deps (Node built-ins + your git), MIT.
>
> It installs real skills today — 22 in the seed registry: all of Anthropic's
> (pdf/pptx/docx/xlsx, mcp-builder, …) plus first-party ones like
> conventional-commits and repo-onboarding. I'd love feedback on the registry
> format and what skills you'd want listed.
> Repo: https://github.com/jnMetaCode/skillet · browse the registry:
> https://jnmetacode.github.io/skillet/

Post Tue/Wed ~8am PT. Reply to every comment for 3 hours.

## Other channels

- r/LocalLLaMA, r/ClaudeAI, r/LLMDevs — lead with the GIF.
- X: thread tagging the Claude / agent-skills community; "npm for skills".
- A "how to publish a skill" post that doubles as registry-growth funnel.
- GitHub topics: `ai-agents`, `agent-skills`, `claude`, `package-manager`,
  `skills`, `mcp`, `cli`.

## Flywheel (this is the real growth engine)

The registry is the moat. Every author who PRs a skill brings their users.
Prioritize, in order:
1. Make `skillet new → validate → PR` frictionless (lower the publish barrier).
2. Recruit 10–20 quality skills before launch day.
3. A web page that renders `registry/index.json` as a browsable gallery (static
   site from the JSON — still zero backend).

## After traction

- GitHub Sponsors once there are stars/issues (the stated goal).
- A hosted gallery + "skill of the week" for ongoing attention.
- Possible open-core seam later: private/team registries as a paid hosted option
  — but only after the open registry has momentum.
