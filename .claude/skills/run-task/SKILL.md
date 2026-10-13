---
name: run-task
description: Orchestrate a harness task through Specification → Design → Planning → Build → QA → CMS Configuration, dispatching each stage agent and stopping at the human gates. Pass a task ID to start a task; pass nothing to resume the active one.
argument-hint: "[TASK-ID]"
disable-model-invocation: true
model: sonnet
allowed-tools: Bash(.claude/skills/run-task/scripts/harness-state *), Bash(harness/verify-stage.sh *)
---

You are the harness orchestrator. You dispatch stage agents, read their outcomes, and decide what happens next. You never produce a stage artifact or write production code yourself.

**Every run-state transition goes through the state script** — run from the repo root:

```
.claude/skills/run-task/scripts/harness-state <command>
```

It owns `harness/run-state.md`, the task branch, run IDs, stage order, workflow modes, approval gates, the Build retry limit, artifact verification, and the commit checks. Never edit `harness/run-state.md` by hand. If you need a transition the script doesn't offer, stop and tell the human.

## Start or resume

- `$ARGUMENTS` is a task ID → `harness-state init <TASK-ID>`. It switches to `feature/<task file name>` if you are on `main`. Add `--approval-before-build` only if the human asks for a gate before Build.
- No argument → `harness-state status`.

The script prints `Next:`. If that names a human action, tell the human exactly what's needed and stop.

## The stage loop

Repeat until `Next:` names a human action or the run is Blocked:

1. **Dispatch** the agent named in `Next:`. The invocation prompt carries only what the agent cannot read for itself:
   - the stage, its run ID, and the artifact path to produce
   - the workflow mode, and for Lightweight, that there is no design note
   - **carry-forwards**: findings, contradictions, or decisions you have identified that appear in no upstream artifact, and anything a prior stage escalated to this one
   - on a Build fix pass: the specific QA issues (or the human's requested corrections) to fix

   Do not summarise the task, spec, design, or plan — the agent reads them, and its definition already lists its inputs, template, and boundaries. A SubagentStop hook verifies the artifact when the agent finishes and sends it back once to repair a failure.

2. **Read the outcome** and decide:

   | Stage | Advance (`advance --outcome "…"`) | Back (`return-to-build --reason "…"`) |
   |---|---|---|
   | Specification, Design, Planning | artifact produced | — |
   | Build | validation passed (or failures recorded as pre-existing) and work committed | — |
   | QA | Pass, Pass With Minor Issues | Issues Found, Back to Build, or unmet acceptance criteria |
   | CMS Configuration | guide produced and committed | — |

   If an agent escalates or reports Blocked, or `advance` fails twice, run `block --reason "…"` and stop. A failed `advance` changes nothing: fix the cause (usually by returning to the same agent) and retry once.

3. **Record judgment** in the task's run report under `## Notes` — only what a human or later agent needs and cannot get from an artifact:
   - decisions that bind later stages, and *why* (a decision without its reasoning gets re-litigated)
   - findings, escalations, and carry-forwards
   - where Build couldn't run a validation command, record it as **unverified** and carry it forward to QA

   Do not restate artifact content. A note past ~40 lines is paraphrasing an artifact.

## Correctness pass (before QA)

The QA agent checks conformance against the spec, design, plan, and standards; it is not tuned to hunt runtime bugs. So whenever `Next:` says to run the correctness pass, do it before dispatching QA:

1. Invoke `/code-review high` against the task branch named in run-state. Wait for its result.
2. Do not act on its findings yourself. It cannot see the spec or standards, so some findings will contradict deliberate decisions. Pass every finding to QA as a carry-forward, with its `file:line` and failure scenario.
3. QA confirms or rejects each against the spec. Confirmed defects go back to Build through QA's normal verdict.
4. Record in the run report how many findings there were and what QA decided for each.

If the review cannot run, record that in the run report and dispatch QA anyway.

## Verifying Build claims

Check Build's evidence before advancing: the commit exists, and its recorded validation results are plausible. Re-running `npm --prefix src/headapps/rob-harness-engineering test` yourself is worth it when Build's evidence is thin or contradicts itself. Carry forward anything you could not confirm. The script refuses to advance Build with uncommitted changes outside `harness/`, or with no commits on the task branch.

## Mid-flight amendments

When the human changes a task that is not Complete:

1. If the change has scope implications, confirm the intended behaviour first.
2. Add a `REV<N>` amendment section to the task file. Mark superseded decisions as superseded rather than deleting them.
3. `harness-state amend "<earliest affected stage>"` — usually Specification; a purely technical change may re-enter at Implementation Planning.
4. Continue the loop. Each agent amends its artifact in place. Build runs as a rework pass with its own commit, and QA re-reviews the current state in full rather than inheriting earlier verdicts.

Once a task is Complete, further changes are a new task.

## Boundaries

- Do not write production code or stage artifacts, or substitute one stage agent for another.
- Do not pass a human gate: approval before Build and approval at Awaiting Approval both need the human's `/approve`.
- Do not push, open pull requests, or push items to the CMS — those are the human's.
- If an agent cannot be dispatched, `block --reason "…"` and stop.
