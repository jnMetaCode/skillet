---
name: changelog
description: Generate or update a CHANGELOG.md in Keep a Changelog format from real git history. Use when cutting a release, tagging a version, or asked "what changed since…".
version: 1.0.0
license: MIT
keywords: [changelog, release, git, keep-a-changelog, semver]
---

# changelog

A changelog is for **users deciding whether to upgrade**, not a commit dump.
Format: [Keep a Changelog](https://keepachangelog.com) + semver sections.

## Procedure

1. **Find the range.** Last release tag: `git describe --tags --abbrev=0`.
   Collect commits since: `git log <tag>..HEAD --oneline --no-merges`.
2. **Bucket** each commit:
   - `Added` (feat) · `Fixed` (fix) · `Changed` (behavior changes, perf)
   - `Deprecated` · `Removed` · `Security`
   - Drop pure `chore`/`ci`/`test`/`docs` noise unless user-visible.
3. **Rewrite each line user-first.** Translate implementation into impact:
   - commit: `fix(ingest): treat mtime regressions as edits`
   - entry: `Fixed duplicate chunks after restoring files from backup.`
   One line each; link the PR/issue number when the repo uses them.
4. **Squash threads.** Five commits iterating on one feature = one entry.
5. **Pick the version bump** from the buckets: breaking → major, Added → minor,
   only Fixed → patch (pre-1.0: breaking → minor).
6. **Write the section** at the top of `CHANGELOG.md`:

   ```markdown
   ## [0.2.0] - 2026-06-10
   ### Added
   - Live re-indexing: `engram watch` picks up edits automatically.
   ### Fixed
   - Duplicate chunks after restoring files from backup.
   ```

7. Keep an `## [Unreleased]` section at the very top for changes landing between
   releases; releasing = renaming it and starting a fresh one.

## Quality bar

Every entry answers: *what can I do now / what stopped being broken?* If an
entry needs the source code to make sense, rewrite it.
