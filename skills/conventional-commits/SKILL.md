---
name: conventional-commits
description: Write precise Conventional Commits messages from the actual staged diff. Use whenever committing code or asked to write/fix a commit message.
version: 1.0.0
license: MIT
keywords: [git, commits, conventional-commits, changelog, workflow]
---

# conventional-commits

Write the message from the **diff**, not from the conversation. The reader is a
stranger running `git log` in two years.

## Procedure

1. Read what is actually staged: `git diff --cached --stat` then the diff itself.
2. Classify the change — pick ONE primary type:
   - `feat` new user-visible capability · `fix` corrects wrong behavior
   - `refactor` no behavior change · `perf` faster, same behavior
   - `docs` · `test` · `build` · `ci` · `chore` (only when nothing else fits)
3. Scope = the subsystem a reader would filter by: `feat(parser): …`. Omit if
   the repo doesn't use scopes (check `git log --oneline -20` and match style).
4. Subject line: imperative, lowercase, no period, ≤ 72 chars, and it must state
   the **effect**, not the activity — "fix: reject expired tokens" not
   "fix: update token check".
5. Body (when the why isn't obvious): 1–3 sentences on **why** the change was
   needed and any non-obvious consequence. Wrap at 72. Never narrate the diff.
6. Breaking change → footer `BREAKING CHANGE: <what breaks and the migration>`,
   and add `!` after the type: `feat(api)!: …`.

## Anti-patterns to reject

- One commit doing two unrelated things — split it (`git add -p`).
- "update", "misc fixes", "address comments" — say what changed.
- Restating the conversation ("as discussed…") — the log has no conversation.
- Explaining that the change is correct — that belongs in the PR, not the log.

## Example

```
fix(ingest): treat mtime regressions as edits, not new files

Restored backups can move mtime backwards; we indexed those as fresh
documents, duplicating every chunk. Key on inode+path instead.
```
