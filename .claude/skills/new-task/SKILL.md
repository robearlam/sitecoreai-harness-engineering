---
name: new-task
description: Create a harness task definition in harness/tasks/ from a backlog item or a short feature description — allocates the next task ID, fills the task template, sets the workflow settings, and updates the backlog. Pass a backlog ID (e.g. B011) or a description.
argument-hint: "[backlog ID | feature description]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

You are creating a durable task definition — the input to the Specification stage. A good task file bounds the work clearly enough that the PO / Spec agent can write testable acceptance criteria without guessing at intent. You do not write the spec, design, or plan, and you do not start the run.

## Inputs

Read only:

- `harness/templates/task-template.md`
- `harness/backlog/backlog.md`
- the file names in `harness/tasks/`, and the Summary and Scope sections of earlier tasks only where you need them to identify dependencies or overlap
- the folder names under `src/headapps/rob-harness-engineering/src/components/`, to see which components already exist

Do not read the codebase beyond that, or any harness artifacts. Implementation detail belongs to later stages.

## Process

1. **Resolve the request** from `$ARGUMENTS`:
   - A backlog ID → use that entry. If its status is `Done`, stop and say so.
   - A description → look for a matching backlog entry. If there is one, use it; if not, the task gets a new backlog entry (step 6).
   - Nothing → ask what the task should be and stop.
2. **Allocate the ID**: one higher than the highest `T###` in `harness/tasks/`, zero-padded to three digits. The file is `harness/tasks/T###-<kebab-case-title>.md`.
3. **Decide the workflow settings** and state your reasoning in the summary to the human:
   - `Workflow: Standard` unless the task has no new UI surface and no design decisions (configuration, CI, data) — then `Lightweight`.
   - `CMS Configuration: Required` if the task adds or changes a Sitecore-rendered component; otherwise `Not Required`.
4. **Ask before writing** only when a decision materially changes the scope and you cannot resolve it from the backlog entry and the human's request — for example, two plausible interpretations of the feature. Ask once, with your recommendation. Otherwise proceed.
5. **Write the task file** from the template, filling every section:
   - **Summary** — the user-facing outcome in a short paragraph: what the feature is, where it renders (which placeholder), and how content is authored.
   - **In Scope** — the renderings, behaviours, Sitecore templates, tests, and CMS guide the task delivers, at the level of *what*, not *how*. Name fields by their Sitecore field type (Single-Line Text, Image, General Link, Multilist) — the CMS stage depends on it.
   - **Out of Scope** — the plausible extensions a reader might assume are included. This list is what keeps the spec bounded; make it specific.
   - **Acceptance Criteria** — the minimum the task must deliver, phrased so each one can be checked. The Specification stage finalises them.
   - **Dependencies** — earlier tasks, placeholders, Page Designs, design-system tokens, or content this task relies on.
   - **Risks** — what is likely to go wrong or be underspecified, e.g. editing-mode behaviour, client/server boundaries, accessibility, performance.
   - **Task Notes** — anything the human said about intent or context that doesn't fit elsewhere.

   Respect the project's standing constraints: live CMS connectivity is assumed, so mock or fallback content is never in scope; components are registered through the existing `sitecore-tools` component map; no new npm dependencies unless the human asks for one.
6. **Update the backlog**: set the entry's status to `Ready for Spec` and note `Selected as T###`. For a new request, add a `B###` entry (next free number) with a one-paragraph summary and the same status. While you're in the file, if a backlog entry's task is already Complete but the entry isn't `Done`, mark it `Done` and say so.
7. **Check your output**: the file name matches `T###-*.md` and is the only file for that ID; the header has `Status: Ready`, the backlog ID, today's date, and valid `Workflow:` and `CMS Configuration:` values; no `{{…}}` placeholders remain. `/run-task` refuses to start a task whose settings are invalid.

## Finish

Tell the human the task ID and file path, the workflow settings you chose and why, and any open questions you left in the task for the Specification stage. Then suggest `/run-task T###` — do not run it yourself, and do not commit (Build commits the task file with the first pass).
