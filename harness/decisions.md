# Harness Decisions

Why the harness looks the way it does. Each entry records what was chosen, why, what was rejected, and when to revisit it.

---

## D-001: Claude Code is the only runtime — enforce with native agents, settings, and hooks

**What we chose (2026-10-13):** Drop GitHub Copilot and Cursor support and rebuild the harness on built-in Claude Code features, following the same change made in the Gym Tracker harness (its D-016).

1. **Stage agents.** Each role in `harness/roles/` was merged into a `.claude/agents/*.md` subagent, trimmed, with its input contract written into the agent's Inputs section. `harness/standards/stage-input-contracts.md` is gone. The UI Designer role was folded into the `ui-design-system` skill.
2. **Standards as skills.** The coding and testing standards moved to `.claude/skills/`. The two design-system documents (`harness/design-system/design-system.md` and `harness/standards/ui-design-system.md`, the latter a subset of the former) were merged into one `ui-design-system` skill. Each agent preloads only the skills its old contract allowed, through `skills:` frontmatter.
3. **Orchestrator as skill + script.** The orchestrator role (571 lines) and the four process standards (`feature-workflow.md`, `task-lifecycle.md`, `run-state-standard.md`, `run-id-standard.md`, about 1,180 lines) are gone. The mechanics moved into `.claude/skills/run-task/scripts/harness-state`, which owns every run-state transition, run IDs (`-N`, `-REVN`), stage order, workflow modes, the approval gates, the 3-pass Build retry limit, artifact verification, the commit checks, and the task branch. The judgment moved into the `/run-task` skill: dispatch prompts, carry-forwards, outcome triage, and amendments.
4. **Human gate.** `/approve` is set so Claude cannot invoke it; only the human can. It records only what the human actually stated.
5. **Governance by configuration.** `.claude/settings.json` denies edits to agents, skills, templates, and run-state; denies reading or editing `.env`/`.env.local`; denies `dotnet sitecore ser push` and `publish`; prompts on edits to tasks and backlog; and allows the validation commands without prompting.
6. **Hooks.** SubagentStop runs `harness/verify-stage.sh` when a stage agent finishes and sends it back once to repair a failure. SessionStart injects the run-state Execution State block and warns when the head app's dependencies aren't installed.
7. **Correctness pass.** Before QA, `/run-task` runs the built-in `/code-review high` on the task branch and passes its findings to QA, which confirms or rejects each against the spec. On Gym Tracker this found real runtime bugs both review stages missed.
8. **Build and CMS commit their own work** on a per-task `feature/` branch, and the state script refuses to advance them with uncommitted code.
9. **Two task settings** shape the stage sequence: `Workflow: Lightweight` skips Design, and `CMS Configuration: Not Required` skips the CMS stage (T003, the CI task, had no CMS work).

**Why:**

- `.claude/commands/` are slash commands, not subagents, so under Claude Code every stage ran inline in the main conversation. By Build, the context held the orchestrator's reading plus every earlier stage's. Real subagents give each stage its own bounded context.
- Each stage loaded 1,400–2,100 lines of role, standards, and templates before doing any work, much of it the same workflow rules restated across four process standards. The agents are now 50–90 lines each plus only the skills they need.
- Run-state transitions are a state machine. Asking a model to re-derive them from prose on every step cost tokens and invited drift. The script is deterministic and refuses invalid transitions.
- Rules enforced by configuration — artifact verification, protected paths, human-only gates — no longer depend on the model obeying prose. Turning on `verify-stage.sh` against existing artifacts immediately found T005's QA review missing its Approval Readiness section.
- Three hand-synced adapter sets (21 files, ~1,080 lines) were a maintenance tax with no runtime benefit.

**Known limits:**

- Permission rules govern the file tools, not shell redirection, so a `Bash` write into a protected path is not blocked.
- Harness changes now require lifting the relevant deny rule temporarily.
- `npm run build` needs Sitecore environment configuration; without it, Build records the failure as pre-existing rather than passing it.

**What we rejected:**

- **Keeping multi-tool support as thin pointers.** Hooks and settings only enforce anything under Claude Code, so the other tools would silently get a weaker harness.
- **A full Code Review stage agent** (as Gym Tracker has). QA already reviews conformance here; the built-in `/code-review` pass covers runtime correctness at a fraction of the cost.
- **Agent memory and an architectural health scan.** Both earned their place in Gym Tracker after 30 tasks. With five tasks run here, they'd be speculative.

**When to revisit:** If a second runtime becomes important again, or once enough tasks have run to justify review-stage memory.

---

## D-002: Task definitions are created with the /new-task skill

**What we chose (2026-10-13):** A human-invoked `/new-task` skill creates task files from a backlog ID or a short description. It allocates the next `T###` ID, fills the task template, chooses `Workflow` and `CMS Configuration` with stated reasoning, and updates the backlog. The task template was expanded to match the task files actually written (Scope, Dependencies, Risks, Task Notes).

**Why:** Task files were copied from the template by hand. Nothing allocated IDs or checked the workflow settings, the template was thinner than every real task file (T005 has Scope, Dependencies, and Risks sections the template lacked), and the backlog drifted — B006 still read "Planned" after T005 delivered it. The task file is the boundary every later stage works within, so it deserves the same consistency as the stage artifacts.

**What we rejected:**

- **A task-writing stage agent dispatched by `/run-task`.** Creating a task is a human decision about what to build next, made before a run exists; it doesn't belong inside the run.
- **Generating acceptance criteria in full.** That is the Specification stage's job; the task carries only the minimum.

**When to revisit:** If task files start needing a deterministic check beyond what `harness-state init` already validates.

---

## D-003: Explicit severity bar for QA, and a recorded base commit per run

**What we chose (2026-10-13):** Two changes, both from the T006 dry run.

1. **Severity rule.** The QA agent classifies every issue as blocking or non-blocking, and `/run-task` sends work back to Build only for blocking issues.
   - **Blocking:** an acceptance criterion broken in normal use, a security issue, a regression, or failing tests, lint, or type-check caused by the task.
   - **Non-blocking:** edge cases, refactoring suggestions, cleanups, and small design deviations. These are grouped into a candidate follow-up task for the human.
   - **Spec questions:** spec contradictions go to the human, never to Build.

   The bar is the same on every round.
2. **Base commit.** `harness-state init` records the commit HEAD was at before any task work. `harness-state review-scope` lists the files the task changed since then, outside `harness/`, and prints the `/code-review` invocation for exactly those files. Build's "made no commits" check now counts from the base commit too.

**Why:**

- In the dry run, each `/code-review` pass surfaced new candidates, including bugs introduced by the previous fix. Nothing defined what blocked, so the task used all 3 Build passes and QA only held the line in round 3 because the orchestrator spelled out the bar in its prompt. Prompt-dependent rules drift between runs; the agent definition is where they belong.
- The dry run branched from `harness/claude-native` rather than `main`. Diffing against `main` would have pulled the harness commits into the review, so the orchestrator had to narrow the scope by hand.
- The same branch shape silently disabled Build's commit check: `main..HEAD` was already non-zero from the harness commits, so a Build pass that committed nothing would have advanced.

**What we rejected:**

- **Tightening the bar as Build passes run out.** That makes verdicts depend on run history instead of the code. A consistent bar with a follow-up task is more honest.
- **Letting `/code-review` diff against `main`.** That only works when every task starts from `main`, which rehearsals, stacked work, and demo branches don't.

**When to revisit:** If non-blocking findings pile up unaddressed in follow-up tasks, or if the correctness pass's repeated findings across rounds (6 of 10 in the dry run's third pass) become worth deduplicating before QA.
