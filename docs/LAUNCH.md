# Launch playbook (internal)

English | [简体中文](./LAUNCH.zh-CN.md)

Go-to-market checklist for skillet. Move this out of the repo before/after launch
if you prefer to keep it private.

## Pre-flight

- [x] Replace `USER` in `package.json`, `src/config.js`, and docs with the real
      GitHub org/user (the default registry URL points there) → **jnMetaCode**. *(done)*
- [x] **npm name decided → `@jnmetacode/skillet`** (unscoped `skillet` is taken;
      scoped keeps the brand, bin stays `skillet`). Claim the `jnmetacode` npm
      username/org before publishing — see engram's `docs/LAUNCH.md` for the
      scope-claim steps. *(name set in package.json + docs)*
- [x] Seed `registry/index.json` — **26 skills**: all 17 from anthropics/skills
      plus 9 first-party skills hosted in this repo (`skills/`). Every entry
      verified to resolve; live `search`+`add` tested. *(done)*
- [x] Record the hero GIF (script below) → `docs/demo.gif`, linked in README.
      *(done — vhs-recorded; re-record any time with `docs/demo.tape`)*
- [x] **Published**: `@jnmetacode/skillet` live on npm (v0.1.0, tag + release).
      Clean-cache `npx @jnmetacode/skillet add …` verified. *(done; `NPM_TOKEN`
      secret still optional, for future CI publishes)*
- [x] Verified from a clean npm cache: `npx @jnmetacode/skillet add …` installs
      and SHA-pins. *(done)*

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
> It installs real skills today — 26 in the seed registry: all of Anthropic's
> (pdf/pptx/docx/xlsx, mcp-builder, …) plus first-party ones like
> conventional-commits, systematic-debugging and repo-onboarding. I'd love
> feedback on the registry format and what skills you'd want listed.
> Repo: https://github.com/jnMetaCode/skillet · browse the registry:
> https://jnmetacode.github.io/skillet/

Post Tue/Wed ~8am PT. Reply to every comment for 3 hours.

## Other channels — ready-to-paste drafts

**r/ClaudeAI / r/LLMDevs** (1–2 days after HN):

> **Title:** skillet: npm for agent skills — install SKILL.md skills with SHA pinning, registry is just a JSON file in a Git repo
>
> Skills (a SKILL.md folder that teaches an agent a capability) are great, but
> sharing them is copy-paste with no versioning. skillet gives them the npm
> treatment: `npx @jnmetacode/skillet add pdf` resolves a registry name, shallow-clones,
> copies the folder into `.claude/skills/`, and pins the commit SHA in a
> lockfile — `skillet install` reproduces the exact set on a teammate's
> machine. No backend: the registry is one JSON file served over raw GitHub.
> 26 skills seeded (all of Anthropic's + first-party ones). Browse:
> https://jnmetacode.github.io/skillet/ · Repo: https://github.com/jnMetaCode/skillet
> Also runs as an MCP server, so the agent can find and install skills for itself.

**X thread**: 1/ "skills are taking over, sharing them hasn't caught up — I
built npm for SKILL.md" [GIF] · 2/ install = copy into your repo + SHA pin
(shadcn-style, not node_modules-style) · 3/ the registry is a JSON file in a
Git repo, publishing is a PR · 4/ MCP server: "find a PDF skill and install
it" just works in Claude.

A "how to publish a skill" post doubles as the registry-growth funnel.
GitHub topics (already set): `ai-agents`, `agent-skills`, `claude`,
`package-manager`, `skills`, `mcp`, `cli`.

## Flywheel (this is the real growth engine)

The registry is the moat. Every author who PRs a skill brings their users.
Prioritize, in order:
1. Make `skillet new → validate → PR` frictionless (lower the publish barrier).
2. ~~Recruit quality skills before launch day~~ → **done: 26 seeded (9
   first-party + all 17 of Anthropic's), every entry verified to resolve.**
3. ~~A browsable gallery from the JSON~~ → **done:
   https://jnmetacode.github.io/skillet/ (auto-redeploys on registry change).**
4. Post-launch: convert the `skill-submission` issue template traffic into
   PRs; feature new community skills in the gallery.

## After traction

- GitHub Sponsors once there are stars/issues (the stated goal).
- A hosted gallery + "skill of the week" for ongoing attention.
- Possible open-core seam later: private/team registries as a paid hosted option
  — but only after the open registry has momentum.
