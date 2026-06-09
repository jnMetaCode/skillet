# Launch playbook (internal)

Go-to-market checklist for skillet. Move this out of the repo before/after launch
if you prefer to keep it private.

## Pre-flight

- [ ] Replace `USER` in `package.json`, `src/config.js`, and docs with the real
      GitHub org/user (the default registry URL points there).
- [ ] Confirm npm name `skillet` is free (`npm view skillet`); fallbacks:
      `skillet-cli`, `agent-skillet`, `skillpm`, `skld`.
- [ ] Seed `registry/index.json` with 8–15 genuinely useful skills (more than the
      5 Anthropic ones) — registries live or die on day-one content.
- [ ] Record the hero GIF (script below) → `docs/demo.gif`, uncomment in README.
- [ ] Add `NPM_TOKEN` secret; `git tag v0.1.0 && git push --tags` to publish.
- [ ] Verify `npx skillet add pdf` works from a clean machine.

## Hero GIF (15–25s) — highest-leverage asset

1. `npx skillet search pdf` → clean list of results.
2. `npx skillet add pdf` → "✓ installed pdf → .claude/skills/pdf · pinned <sha>".
3. `ls .claude/skills/pdf` → real files appear.
4. `npx skillet new my-skill` → scaffold, then `skillet validate ./my-skill` ✓.

No narration, loop-friendly. Tools: Kap / QuickTime + Gifski.

## Show HN post

**Title:**
> Show HN: Skillet – npm for AI agent skills (zero-infra, Git-backed registry)

**Body:**
> Agent "Skills" (a SKILL.md folder that teaches an agent a capability) are
> everywhere now, but sharing them is copy-paste from random repos with no
> versioning or discovery.
>
> Skillet is a package manager for them. `npx skillet add pdf` finds the skill in
> a registry, `git clone --depth 1`s it, copies the folder into your
> `.claude/skills/`, and pins the commit SHA in a lockfile. `skillet new` +
> `skillet validate` help you author your own; publishing is a PR that appends one
> line to a JSON index.
>
> The thing I like: there's no backend. The "registry" is a single JSON file in a
> Git repo served over raw GitHub — like a Homebrew tap, or shadcn/ui's registry,
> applied to skills. Zero runtime deps (Node built-ins + your git), MIT.
>
> It installs real skills today (Anthropic's pdf/pptx/docx/xlsx are seeded). I'd
> love feedback on the registry format and what skills you'd want listed.
> Repo: <link>

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
