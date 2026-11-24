# Harness

This directory defines the multi-agent SDLC harness used to deliver every feature in this project: a Sitecore Content SDK rendering host built with Next.js App Router, in `src/headapps/rob-harness-engineering`.

The harness exists so that features are built in small, predictable, well-evidenced slices. It runs on Claude Code: the main session is the orchestrator, and each stage is a subagent in `.claude/agents/`.

---

## The workflow at a glance

```
Task definition
       ↓
   Specification         ← po-spec              → feature-spec.md
       ↓
   Design                ← feature-design       → design-note.md       (skipped in Lightweight mode)
       ↓
   Implementation Plan   ← tech-lead            → implementation-plan.md
       ↓
   Build                 ← build                → code + tests + validation evidence (committed)
       ↓
   Correctness pass      ← built-in /code-review high → findings carried forward to QA
       ↓
   QA                    ← qa                   → qa-review.md
       ↓
   CMS Configuration     ← cms-config           → items in XM Cloud via MCP + cms-config.md record   (skipped when Not Required)
       ↓
   Awaiting Approval     ← human gate (/approve)
       ↓
   Complete
```

Every stage produces an artifact at a canonical path. The next stage reads only the artifacts it needs.

---

## Directory map

| Path | What's in it |
|---|---|
| `../.claude/agents/` | The stage agents — each one's role, input contract, model, tools, and preloaded skills in a single file. |
| `../.claude/skills/` | `new-task` (creates task definitions), `run-task` (the orchestrator, with its `harness-state` script), the `approve` gate command, and the coding, testing, and UI design-system standards preloaded into the stage agents. |
| `../.claude/hooks/` | SessionStart loads the live run-state; SubagentStop verifies each stage's artifact. |
| `../.claude/settings.json` | Governance: what agents may and may not edit or run, including which Sitecore MCP tools are allowed, need approval, or are blocked. |
| `../.mcp.json` | The Sitecore Developer and Marketer MCP servers the CMS Configuration stage writes through. |
| `templates/` | The blueprint for every artifact (feature spec, design note, plan, QA review, CMS record, run state, run report, task). |
| `tasks/` | Durable task definitions — one per feature, named `T001-feature-name.md`. |
| `artifacts/` | Generated artifacts per task per stage: `specs/`, `design/`, `plans/`, `qa/`, `cms-config/`. |
| `runs/` | Per-task run reports — `TASKID-run-report.md`. |
| `backlog/` | Task intake and backlog tracking. |
| `run-state.md` | The single source of truth for live execution state (created when the first task runs). Written only by the `harness-state` script. |
| `verify-stage.sh` | Deterministic stage-artifact verification: the file exists, is non-empty, and has its required headings. |
| `decisions.md` | Why the harness looks the way it does. |

---

## Quickstart: running a task through the harness

### 1. Create a task

Run `/new-task B0XX` with a backlog ID, or `/new-task <short description>`. It allocates the next task ID, writes `tasks/T00X-your-feature.md` from the template (summary, scope, minimum acceptance criteria, dependencies, risks), and marks the backlog entry `Ready for Spec`. Review the file before running it — it's the boundary every later stage works within.

Two settings in the task header shape the run, and `/new-task` picks them for you:

- `Workflow: Lightweight` skips Design. Use it only for tasks with no new UI surface and no design decisions (configuration, CI, data). Anything else is `Standard`.
- `CMS Configuration: Not Required` skips the CMS Configuration stage, for tasks that add or change no Sitecore-rendered component.

### 2. Run it

`/run-task T00X` switches to a `feature/T00X-…` branch (if you're on `main`), records the run's base commit, initialises run-state and the run report, then dispatches each stage in turn. Before QA it runs the built-in `/code-review high` on just the files the task changed since that base commit, and hands its findings to QA, which confirms or rejects each against the spec.

Only a **blocking** issue sends the task back to Build: an acceptance criterion broken in normal use, a security issue, a regression, or failing tests, lint, or type-check. Edge cases, refactoring suggestions, and cleanups are recorded as non-blocking and grouped into a candidate follow-up task for you to decide at approval. At most 3 Build passes, then the run stops as Blocked.

The CMS Configuration stage creates the task's Sitecore items in XM Cloud itself, through the Sitecore MCP servers (see [Sitecore MCP servers](#sitecore-mcp-servers)). Its writes run without prompting: a hook allows them only during this stage and logs each one, and you review the result, with a rollback list, at Awaiting Approval.

The run stops at Awaiting Approval. `/run-task` with no argument resumes the active task from run-state.

Add "with approval before Build" when you start a task if you want to review the plan before any code is written.

### 3. Review, configure, approve

At Awaiting Approval, review the QA review and the CMS Configuration Record: what the agent created, the read-back and on-page checks, and its Manual Steps. Do the Manual Steps: upload any media it lists, run `dotnet sitecore ser pull`, and commit the serialized items. Then run `/approve` with your decision:

- **Approved** — records your decision in the task file, marks the task Complete, and commits. Open the pull request yourself.
- **Corrections needed** — the task goes back to Build with your corrections.
- **Spec or design changes** — handled as a mid-flight amendment (below).

### Changing a task mid-flight

If you change your mind about a task that isn't Complete, tell the orchestrator what you want. It records a `REV<N>` amendment in the task file, loops back to the earliest affected stage with `-REV<N>` run IDs, and re-runs the downstream stages against the amended artifacts. Once a task is Complete, changes are a new task.

---

## Agent runtime

The harness runs on Claude Code only (see `decisions.md`, D-001).

- The **main session** plays the orchestrator through the `/run-task` skill. Its judgment calls (carry-forwards, outcome triage) are in the skill; every run-state transition goes through `.claude/skills/run-task/scripts/harness-state`. Subagents cannot spawn subagents, which is why the orchestrator is not one.
- Each **stage agent** is a single file in `.claude/agents/` and runs in its own context, so one stage's reading never bloats the next. It preloads the standards it needs from `.claude/skills/` through its `skills:` frontmatter.
- **`.claude/settings.json`** enforces governance: edits to agents, skills, templates, run-state, the settings file itself, and `.mcp.json` are denied; `.env` files can't be read or edited; pushing serialized items or publishing to the CMS is blocked. Sitecore MCP read and write tools are allowed (writes are guarded by a hook, below), and the Marketer MCP's personalization, experiment, brief, and asset tools are blocked.

### Sitecore MCP servers

`.mcp.json` defines two servers, used only by the CMS Configuration stage for writes:

| Server | What the harness uses it for |
|---|---|
| `sc-developer` | Content types (data templates) and components (JSON renderings), including site availability |
| `sc-marketer` | Item look-ups, creating items, updating fields on any item, pages, Partial and Page Design layout, screenshots, deleting items a run created |

Setup, once per machine:

1. Start Claude Code in the repo and approve the two project MCP servers when asked.
2. Run `/mcp` and sign in to each server. When asked for an organization and tenant, choose the **same non-production** tenant for both.

The repo cannot choose the environment: each server uses whichever tenant you signed in to. Before any write, the CMS agent checks that both servers list the `harness-engineering` site with the same ID, and stops if they don't.
- **Hooks** in `.claude/hooks/` load the live run-state at session start and verify each stage's artifact when its agent finishes. A failed verification sends the agent back once to repair it. `cms-mcp-guard.py` runs on every Sitecore MCP call: it denies writes unless run-state shows the CMS Configuration stage Active, denies deleting anything the current run didn't create, and logs each write to `runs/TASKID-cms-writes.jsonl`, which `verify-stage.sh` checks against the CMS record.

---

## Stage input contracts: why they matter

Each stage may read only the files listed in the Inputs section of its agent definition. This:

- keeps context bounded and token usage predictable
- forces explicit handoffs through artifacts
- prevents agents from going on archaeology expeditions through unrelated files
- makes runs reproducible

If a stage agent finds its allowed inputs insufficient, the correct behaviour is to **escalate** — explain what's missing and stop — not to start searching the codebase.

---

## When something goes wrong

- **A stage failed verification.** Check the named artifact path — the file is missing, empty, or missing a required heading. `harness-state advance` refuses to move on until it is fixed.
- **QA returned the task to Build.** The QA review lists the blocking issues. After 3 Build passes the run stops as `Blocked`; fix the cause, then `harness-state resume`.
- **Build couldn't pass `npm run build`.** Usually missing Sitecore environment configuration. Build records it as a pre-existing failure; QA and you decide whether it matters.
- **The CMS agent stopped at the environment check.** One or both Sitecore MCP servers aren't connected, aren't signed in, or are signed in to different tenants. Fix it with `/mcp`, then `harness-state resume` and `/run-task`.
- **The CMS record says Partial.** A write failed or the guard denied one. The record lists what was done and what's left under Manual Steps; finish those by hand, or fix the cause and re-run the stage (it reuses items that already exist).

---

## Modifying the harness itself

`harness/templates/`, `.claude/agents/`, `.claude/skills/`, `.claude/settings.json`, and `.mcp.json` are governance-controlled; `.claude/settings.json` denies edits to them so stage agents cannot modify them during feature work.

When you do want to change the harness:

1. State explicitly that you're making a harness change.
2. Remove the relevant `deny` rule from `.claude/settings.json` yourself — Claude will not loosen its own permissions — and make the change. Restore the rule afterwards.
3. Check that cross-references still resolve (an agent pointing to a template, `verify-stage.sh` headings matching a template).
4. Commit with a message that makes the harness change visible (e.g. `harness: add Content Items check to verify-stage`), and record significant changes in `decisions.md`.

---

## Model assignments

| Role | Model | Why |
|---|---|---|
| Orchestrator (`/run-task`) | Sonnet | State-machine work is in the script; the skill makes bounded triage calls |
| PO / Spec | Sonnet | Bounded by the task file and template |
| Feature Design | Opus | UX judgment ripples into everything downstream |
| Tech Lead | Opus | Architectural and component-map decisions are costly to get wrong |
| Build | Sonnet | Workhorse implementation, verified by QA |
| QA | Opus | Last automated gate; its failure mode is a false Pass |
| CMS Configuration | Sonnet | Rule-driven CMS writes, guarded and logged by a hook, read back, and reviewed by the human at the end |

Each stage agent pins its model in the `model:` field of its frontmatter.
