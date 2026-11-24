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

---

## D-004: The CMS Configuration stage writes to XM Cloud through the Sitecore MCP servers

**What we chose (2026-11-24):** The CMS Configuration agent no longer writes a guide for a human to follow. It creates and verifies the Sitecore items itself, through two Sitecore MCP servers, and writes a CMS Configuration Record of what it did.

1. **Two servers, defined in the repo.** `.mcp.json` defines `sc-developer` (the Sitecore Developer MCP: content types and components) and `sc-marketer` (the Sitecore Marketer MCP: items, pages, layout, screenshots, deletion). Each developer signs in with their own browser OAuth; no credentials are in the repo.
2. **Environment check before any write.** Both servers must list the `harness-engineering` site with the same ID, or the agent stops. Each server picks its organization and tenant at sign-in, so the repo cannot pin the environment; this check is what keeps the agent off the wrong one.
3. **Writes run unattended, guarded and logged by a hook.** `.claude/settings.json` allows the read and write tools the stage needs, by name, and denies the Marketer MCP's personalization, experiment, brief, and asset-metadata tools. The agent's `tools:` frontmatter also lists its MCP tools one by one. A `PreToolUse` hook, `.claude/hooks/cms-mcp-guard.py`, denies any Sitecore MCP write unless run-state shows the CMS Configuration stage Active, and denies `delete_content` on any item the current run didn't create. A `PostToolUse` hook logs every write to `harness/runs/TASKID-cms-writes.jsonl`. The agent never writes to that log.
4. **The human reviews at the end, not per call.** `verify-stage.sh cms` checks the record against the write log in both directions: every logged write is in Changes Applied, every Created/Updated/Deleted row is in the log, and every created item is in the record's Rollback list. The human reviews the record, the component in Pages, and the `ser pull` diff at Awaiting Approval, and can undo the run from the Rollback list.
5. **The Accelerate Cookbook recipe is no longer the source of truth.** `create_component` replaces the Clone Rendering script; the MCP's own creation guide says not to follow a separate clone recipe.
6. **The artifact is a record.** `cms-config.md` keeps its path but now holds the environment check, every change with its item ID and read-back result, the verification results, serialization coverage, the Manual Steps left for the human, and a Rollback list. `verify-stage.sh cms` checks the new sections.
7. **What stays with the human:** uploading media (there is no upload tool), `dotnet sitecore ser pull` and committing its output, and publishing.

**Why:**

- Every CMS guide (T001–T006, 323–595 lines each) asked a human to retype names, GUIDs, and queries into Content Editor. Most of the agent's precision rules — Placeholder Key, `#` escaping in queries, Clone Rendering's Create Copy, `@@templatename` until GUIDs are known — existed to stop humans mistyping. The agent now writes those values itself and reads them back.
- A throwaway probe on a test tenant (a `ZZ Probe` component, created, verified, and deleted) confirmed every step a guide contains except media upload: templates with `$site` and `#escaped#` sources and real `@@templateid` GUIDs, standard values, the component, Available Renderings, rendering fields, placeholder settings, data and datasource items, a test page, Partial and Page Designs, screenshots, and deletion.
- Verification is now real. Screenshots showed the SXA "component is missing React implementation" placeholder when the CMS and the rendering host disagreed, so a component-map mismatch is caught at this stage instead of by the human.

**Known limits:**

- Both servers are new — the Developer MCP is in beta — and responses vary between runs. Every write is read back for that reason.
- Creating a component with a new category puts the rendering, a Rendering Parameters template, and a `<Name> Folder` template under `Feature/`, outside our serialization includes. ~~The agent must reuse an existing category under `Project/harness-engineering`.~~ **Superseded by D-005:** `create_component` always uses the Feature layer, and the harness now follows it.
- Because writes don't prompt, a bad run can make many wrong writes before the human sees them. The guard confines them to the CMS stage and to the tenant that passed the environment check, the log makes every one visible, and the Rollback list undoes them (deleted items go to the recycle bin).
- The guard can't tell which item an update targets by path; only the item ID is in the call. Updates are limited by stage, not by location, and the record's Rollback list gives the previous value of every field changed on an existing item.
- Items get new IDs in whichever environment the agent writes to. Other environments still get them through `ser pull`, commit, and the existing push and deploy process.
- The records for T001–T006 are in the old guide format and would fail the new `verify-stage.sh cms` check. They are history and are not re-verified.

**What we rejected:**

- **Keeping the guide as a fallback path.** Two processes for one stage would drift. Instead, when a write fails or is declined, the record lists the remaining work under Manual Steps.
- **Letting the agent run `ser pull`.** It only reads from the CMS, but it rewrites hundreds of files under `src/authoring/items/`, and the human should see that diff land.
- **Approving every write.** The first version of this decision prompted the human on every create, update, and delete: 20–40 prompts per task. That made the stage too heavy to run, and a prompt per call is a weaker review than one check of the whole result against a log the agent can't edit.
- **Wildcard permission rules per server.** Listing tools explicitly means a tool the servers add later is not silently allowed.

**When to revisit:** If a run makes writes the human didn't expect, add a pause before the CMS stage that shows the planned item list (like `--approval-before-build`). Also revisit when the MCP servers add media upload or a delete tool on the Developer side, or leave beta.

---

## D-005: The CMS stage builds on `create_component` and follows it into the Feature layer

**What we chose (2026-11-24):** The CMS Configuration agent uses the Sitecore Developer MCP's `create_component` as the way to create a component, and builds on every item it produces instead of rebuilding or relocating them. It accepts where they land, which is the **Feature** layer, in a folder named after the category.

1. **One category, in Feature.** Every new component uses the category `harness-engineering`. `create_component` creates it on first use at `/sitecore/layout/Renderings/Feature/harness-engineering`, and the agent reuses it by ID after that. The agent never passes the Project rendering folder, which the Components API also lists as a category called `harness-engineering`.
2. **Use what it produces.** The rendering, Rendering Parameters template, `<Name> Folder` template, `Data/<Name> Folder` datasource folder, default Datasource Location, and Available Renderings collection are used as they are. The agent adds only what `create_component` doesn't: our content types, standard values, insert options, option and datasource items, placeholder Allowed Controls, and sample content. The one sanctioned correction is the rendering's `Datasource Template` field, if linking the template with `update_component` doesn't set it.
3. **Our templates go in Feature too.** Datasource, supporting, and option templates are created in `/sitecore/templates/Feature/harness-engineering`, always with `parentId`, so everything for a component lives in one place. The order is: `create_component` (without `modelId`), then the templates, then `update_component` to link them.
4. **Icons.** The rendering gets a fitting icon through `iconUrl` (read back with `get_component`). Our templates get `__Icon`, following the conventions in the serialized items. `__Icon` can't be read back through the MCP, so the human checks it in the `.yml` after `ser pull`.
5. **Verification by layout data.** The agent checks the page through the layout JSON embedded in `get_page_html`, which shows exactly what each component receives. Screenshots are optional.
6. **Stop on rule conflicts.** If a rule can't be followed, the agent escalates. It never works around a rule, and never deletes or rebuilds what the platform created.
7. **Serialization** gains `feature-renderings` and `feature-templates` includes for the two Feature paths.
8. **Guard fix.** `modelId` counts as a write to the template only for `update_content_type`. On `create_component` and `update_component` it only links the rendering to the template.

**Why:**

- **T007's first CMS run (2026-11-24).** Given the Project rendering folder as its category, `create_component` created `Feature/harness-engineering` and put the rendering, parameters template, folder template, a `Data/… Folder` item, and an Available Renderings collection there. Following D-004's rule to keep everything in Project, the agent deleted the rendering and rebuilt it by hand in Project. That orphaned six items that only the human could delete, because the guard rightly refuses to delete items the run didn't log as created. A datasource folder sat empty next to the one in use, and the new items had default icons.
- **Probe T900 (same day).** Given a category that was a subfolder of the Project rendering folder, `create_component` ignored the folder ID and created `Feature/<category name>` again. The Components API never lists a Project subfolder as a category. So placement is fixed and predictable: Feature, by category name. `iconUrl` set the rendering's icon and read back. `__Icon` on a template appeared to save (the `updated` timestamp moved) but can't be read back.
- **Fighting the tool cost more than it saved.** Every workaround broke the link between what the platform created and what the harness tracked. Following the tool keeps every item where the MCP and the authoring tools expect it, and future MCP improvements apply without harness changes.
- **The Droplink question settled itself.** T007's run also showed that `get_components_on_page` returns raw stored values (a Droplink as a bare GUID), while the layout JSON in `get_page_html` shows what the component really receives (a resolved item with its fields). That's why the layout JSON is now the primary check.

**Known limits:**

- Untested: whether `create_component` without `modelId` already creates the `<Name> Folder` template and datasource folder, and whether `update_component` with `modelId` sets the rendering's Datasource Template. The agent checks both and escalates rather than filling the gap itself. The T007 re-run will show which.
- Items `create_component` produces besides the rendering aren't in its response, so the guard doesn't log them as created. The record lists them, and undoing a run means the human deletes them.
- T001–T006 live in the Project layer, and new components live in Feature until a separate tidy-up task moves the old ones.
- `__Icon` and `__Masters` are checked only after `ser pull`.

**What we rejected:**

- **Building the rendering ourselves with `create_content_item`** (the first proposal after T007's run). It works, but it duplicates platform logic that will drift as the MCP changes. We'd own the parameters template, folder, Datasource Location, and availability wiring. And it fights the direction of the Sitecore Developer MCP.
- **Keeping our templates in Project while `create_component`'s are in Feature.** It works (tested), but each component would be split across two layers.

**When to revisit:** after the T007 re-run, to settle the two untested behaviours; when the existing components move to Feature; or if `create_component` gains a way to choose the parent folder.

**Addendum (2026-11-24, after T007's re-run):** the first feature through the D-005 stage (T007, Call to Action Banner) produced 25 logged writes, everything in `Feature/harness-engineering`, no stray items, and a Complete record. Its evidence settles the known limits above and changes four rules:

1. **`create_component` creates the datasource template too.** Without `modelId`, one call created an empty `templates/Feature/harness-engineering/<Name>` template already linked as the rendering's Datasource Template, along with the folder template, parameters template, datasource folder, and Available Renderings entry. The build order is now: create the component, create supporting and option templates, then add fields to the datasource template `create_component` made (`update_content_type`). Point 3's `create_content_type` + `update_component` sequence is now only a fallback, for when no datasource template is created or linked. `update_component` with `modelId` remains untested because it wasn't needed.
2. **Standard fields save.** `ser pull` showed `__Icon` on every template the agent set it on and `__Masters` on the folder template's standard values, written with `update_fields_on_item`. They still don't read back through the MCP, so the human glances at the pulled `.yml`; it's a confirmation, no longer an open question.
3. **Icons on `create_component`'s own templates.** `iconUrl` sets the rendering's icon and also the `<Name> Folder` template's. The Rendering Parameters template keeps the default. The agent now sets `folder_window` and `sxa/16x16/promo.png` on those two templates, the existing project convention. That's one of a short, explicit list of allowed changes to `create_component`'s items (datasource template fields and icon, `__Masters`, these icons, the Datasource Template fallback).
4. **Shared datasources.** `add_component_on_page` returns the rendering ID as `componentId`, not the component instance. The agent gets the instance uid from `get_components_on_page` before `set_component_datasource`.

The layout JSON check confirmed the Droplink arrives as a resolved item (`fields.Value.value`), and the four non-blocking QA findings from the abandoned first attempt didn't recur.
