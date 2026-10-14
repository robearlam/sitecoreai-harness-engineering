---
name: approve
description: Human approval gate for the active harness task — clears a before-Build gate, or records the reviewer's decision at Awaiting Approval and marks the task Complete.
argument-hint: "[decision, reviewer, notes]"
disable-model-invocation: true
model: sonnet
allowed-tools: Bash(.claude/skills/run-task/scripts/harness-state *), Bash(harness/verify-stage.sh *), Bash(git add harness/*), Bash(git commit *)
---

The human is acting at a harness approval gate. Run `.claude/skills/run-task/scripts/harness-state status` first.

## Before-Build gate

If the run is at `Build` and awaiting human action, run `harness-state approve`, then continue the stage loop from `.claude/skills/run-task/SKILL.md`.

## Awaiting Approval

The human has reviewed the QA review and the CMS Configuration Guide (if the task has one). Take their decision from `$ARGUMENTS` and the conversation. If no explicit decision was given, ask for it and stop. Do not infer approval.

Record **exactly what the human stated** and nothing more.

- **Approved:**
  1. Fill in the task file's Approval section: reviewer, decision, and notes as given.
  2. Run `harness-state approve`. The task is now Complete.
  3. Commit the task's remaining harness files (task file, run-state, run report, and any uncommitted artifacts) with a message like `T006: complete task (approved)`. Do not push — tell the human the branch is ready for a pull request.
- **Corrective build work requested:** run `harness-state return-to-build --reason "<the human's requested corrections>"`, then continue the stage loop from `.claude/skills/run-task/SKILL.md` with those corrections as the Build carry-forward.
- **Specification or design changes requested:** follow the mid-flight amendment steps in `.claude/skills/run-task/SKILL.md`.
