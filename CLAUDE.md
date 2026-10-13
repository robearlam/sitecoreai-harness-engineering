# CLAUDE.md

## Project Overview

This repository is a reference implementation of a **custom AI development harness** on top of a **SitecoreAI (XM Cloud)** project, built on Claude Code. It demonstrates a stage-based workflow (Specification → Design → Implementation Planning → Build → QA → CMS Configuration → Approval → Complete) for delivering features with AI coding agents, with full traceability of every stage's inputs and outputs.

This is a monorepo with two distinct concerns:

- **`harness/` and `.claude/`** — the workflow itself: stage agents, skills, hooks, templates, tasks, artifacts, and run state. This is the primary subject of this repo.
- **`src/headapps/rob-harness-engineering/`** — the Sitecore Content SDK / Next.js application the harness builds features into. It has its own nested [`AGENTS.md`](src/headapps/rob-harness-engineering/AGENTS.md) with app-specific guidance (App Router structure, middleware, i18n, component maps). **When editing code in that app, its AGENTS.md takes precedence over this file.**

## How work flows through this repo

Every feature is delivered through the harness. `/run-task TASKID` makes the main session the orchestrator: it dispatches one stage agent per stage from `.claude/agents/`, and the human closes the gates with `/approve`. Before doing feature work, read `harness/README.md`.

| You want to… | Read… |
|---|---|
| Understand the workflow | `harness/README.md` |
| See how the orchestrator decides | `.claude/skills/run-task/SKILL.md` |
| Understand *why* the harness looks the way it does | `harness/decisions.md` |
| See what each stage agent does and may read | `.claude/agents/*.md` |
| See the coding, testing, or UI design standards | `.claude/skills/*/SKILL.md` |
| See the current live workflow state | `harness/run-state.md` |

## Repository Structure

```
.claude/agents/      Stage agents — role, input contract, model, tools, preloaded skills
.claude/skills/      /run-task (orchestrator + state script), /approve, and the standards
.claude/hooks/       SessionStart (run-state context) and SubagentStop (artifact verification)
.claude/settings.json  Governance: permission allow/deny rules and hook wiring
harness/             Templates, tasks, artifacts, run reports, run state, decisions
src/headapps/…       Next.js App Router head application (has its own AGENTS.md)
src/authoring/       Sitecore platform items and serialized content
.github/workflows/   CI (test/lint) pipeline
```

## Setup, Build, and Test Commands

All application commands run from `src/headapps/rob-harness-engineering/`:

```bash
npm install
npm run dev          # dev server
npm run build        # production build
npm run lint         # ESLint
npm test             # Jest suite
```

There are no repo-root build/test commands.

## Operating rules

**Workflow state lives in `harness/run-state.md` and only there.** Only the `harness-state` script updates it — never by hand, and never from a stage agent. Task files under `harness/tasks/` are durable definitions and change only when the human asks.

**Governance is enforced by `.claude/settings.json`.** Edits to agents, skills, templates, and run-state are denied. Change the harness only when the human explicitly asks for a harness change — and the human, not Claude, lifts the relevant deny rule.

**Stay within your stage's input contract.** Each stage agent's Inputs section lists what it may read. If a required input is missing, escalate — do not search the codebase to fill the gap.

**Artifacts are verified, not narrated.** A stage is done only when its artifact exists at the canonical path and passes `harness/verify-stage.sh`. A hook runs it when each stage agent finishes, and the state script runs it again before advancing.

**Use the canonical artifact paths.**

- Specs → `harness/artifacts/specs/TASKID-feature-spec.md`
- Design notes → `harness/artifacts/design/TASKID-design-note.md`
- Plans → `harness/artifacts/plans/TASKID-implementation-plan.md`
- QA reviews → `harness/artifacts/qa/TASKID-qa-review.md`
- CMS configuration guides → `harness/artifacts/cms-config/TASKID-cms-config.md`
- Run reports → `harness/runs/TASKID-run-report.md`

**CMS changes are manual.** The CMS Configuration agent writes the guide and adds missing serialization includes; the human creates the items in XM Cloud and runs `dotnet sitecore ser pull`. Pushing serialized items or publishing is never done by Claude.

## Security Considerations

- Never commit `.env` or `.env.local` files; `.claude/settings.json` denies reading and editing them (see the head app's `AGENTS.md` for environment variable handling).
- Never hardcode Sitecore API keys, editing secrets, or host URLs.
- This repository currently has no automated dependency or secret scanning in CI (`.github/workflows/ci.yml` only runs tests and lint) — flag this if asked to harden the pipeline.
