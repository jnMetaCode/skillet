---
name: self-evolve
description: Make the agent improve with every task — review the run, distill lessons into durable memory, and reinforce what worked. Use at the end of any non-trivial task, or when the user asks the agent to "learn from this".
version: 1.0.0
license: MIT
keywords: [self-improvement, memory, reflection, engram, tracelet, feedback, evolution]
homepage: https://github.com/jnMetaCode/local-agent-toolkit
---

# self-evolve

An agent that doesn't learn repeats its mistakes at full price. This skill is
the improvement loop: **observe the run → distill the lesson → store it →
reinforce what worked → recall it next time.** It uses local tools
([engram](https://github.com/jnMetaCode/engram) for memory,
[tracelet](https://github.com/jnMetaCode/tracelet) for observation), so the
learning stays on the user's machine.

## The loop (run it at the end of each non-trivial task)

1. **Observe what actually happened.** Don't trust your memory of the run —
   check it. If tracing is on (`npx @jnmetacode/tracelet`), look at the trace:
   which tool calls failed or were retried, where the time and tokens went,
   which approach was abandoned. Without a trace, review your own steps: what
   did you try first that didn't work?

2. **Distill at most 1–3 lessons.** A lesson is durable knowledge that would
   change how you act *next* time, not a diary entry:
   - a root cause ("the staging DB rejects connections without SSL")
   - a working recipe ("build fails unless `npm ci` runs before codegen")
   - a user preference revealed by a correction ("they want diffs, not files")
   Skip anything the repo/docs already record.

3. **Store each lesson** (one fact per memory, dated, with the why):
   ```
   engram_remember: "2026-06-12: deploys to staging need SSL_MODE=require —
   the pooler silently drops non-SSL connections (cost us 40 min)."
   ```
   (CLI: `npx @jnmetacode/engram remember …` via the HTTP API, or the
   `engram_remember` MCP tool.)

4. **Reinforce retrievals that proved right.** If you recalled a memory during
   the task and it turned out to be the correct answer, say so — recall gets
   measurably better with use:
   ```
   engram_reinforce: { query: "staging deploy fails", source: "deploys" }
   ```
   Future similar queries will rank that source higher. Only reinforce what
   was *verified* (the fix worked, the user confirmed) — reinforcing guesses
   trains the memory to be confidently wrong.

5. **Close the loop next task: recall before you act.** Start non-trivial
   tasks with a recall of the relevant area (`engram_recall: "staging
   deploy"`). The loop only pays off if stored lessons actually get read.

## Calibration

- **Don't hoard.** One sharp lesson beats ten vague ones; if everything is a
  lesson, nothing is. When a memory turns out to be wrong, delete it
  (`engram forget <source>`) rather than stacking corrections on top.
- **Promote recurring lessons into skills.** The third time a lesson is about
  *procedure* ("always do X before Y in this kind of task"), it has outgrown
  memory — write it into a SKILL.md (`npx @jnmetacode/skillet new <name>`) so
  every future session starts with it instead of having to recall it.
- **Stay honest.** The loop measures itself: if reinforced recalls keep
  surfacing the wrong source, the lessons are badly written — rewrite them
  more concretely instead of reinforcing harder.
