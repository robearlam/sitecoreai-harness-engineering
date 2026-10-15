# AI-Assisted Feature Engineering with SitecoreAI

A reference implementation demonstrating **AI-assisted feature delivery** using a structured harness workflow on a SitecoreAI project. This repository accompanies a conference presentation on using AI coding agents for reliable, repeatable software engineering.

## What This Repository Demonstrates

This project shows how AI coding agents can be orchestrated through a **stage-based workflow** to deliver production-quality features — from specification through implementation and QA — with full traceability. The harness is built on **Claude Code**: each stage is a subagent, the orchestrator is a skill backed by a deterministic state script, and governance is enforced by Claude Code settings and hooks rather than by prose.

The key idea: instead of ad-hoc prompting, a **harness** provides structure, standards, and guardrails that make AI-assisted development predictable and auditable.

### Features Built by AI Agents

| Task | Description |
|------|-------------|
| T001 | Site Header with navigation + SXA Partial/Page Designs |
| T002 | Site Footer with secondary nav and social links |
| T003 | Automated CI/CD testing (GitHub Actions) |
| T004 | Hero Banner component |
| T005 | Promo Card Grid component |
| T006 | Image Gallery carousel with lightbox |

Each feature was delivered through the harness workflow: Specification → Design → Implementation Planning → Build → QA → CMS Configuration → Approval. Tasks with no UI surface (such as T003) run the Lightweight workflow, which skips Design, and CMS Configuration runs only when a task changes Sitecore-rendered components.

## Repository Structure

```
├── .claude/
│   ├── agents/                 # Stage agents (po-spec, feature-design, tech-lead, build, qa, cms-config)
│   ├── skills/                 # /new-task, /run-task orchestrator + state script, /approve, coding/testing/UI standards
│   ├── hooks/                  # Session-start context and stage-artifact verification
│   └── settings.json           # Governance: permission rules and hook wiring
├── harness/                    # Workflow records
│   ├── templates/              # Templates for all stage artifacts
│   ├── tasks/                  # Durable task definitions
│   ├── artifacts/              # Stage outputs (specs, designs, plans, QA reviews, CMS guides)
│   ├── runs/                   # Run reports for each task
│   ├── backlog/                # Future work items
│   ├── run-state.md            # Live workflow state (written only by the state script)
│   ├── decisions.md            # Why the harness looks the way it does
│   ├── README.md               # How the workflow runs
│   └── verify-stage.sh         # Deterministic artifact verification
├── src/
│   ├── headapps/
│   │   └── rob-harness-engineering/   # Next.js App Router head application
│   └── authoring/                      # Sitecore platform and serialized items
├── .github/workflows/ci.yml    # PR validation workflow
├── CLAUDE.md                   # Entry point for Claude Code across the repo
├── CONTRIBUTING.md             # Contribution guidelines
└── xmcloud.build.json          # SitecoreAI build configuration
```

## The Harness

The harness (`.claude/` plus `harness/`) is the core of this demonstration. It provides:

- **Stage-based workflow** — `/new-task` turns a backlog item into a task definition; `/run-task TASKID` takes it through Specification, Design, Planning, Build, QA, and CMS Configuration; and a human closes it with `/approve`
- **Stage agents** — each stage is a Claude Code subagent with its own context, model, tools, and a bounded input contract
- **Deterministic state** — a script owns run-state, run IDs, stage order, approval gates, and retry limits, so the model only makes judgment calls
- **Enforced governance** — hooks verify every stage's artifact, and permission rules protect the harness, secrets, and the CMS
- **Correctness pass and severity bar** — a `/code-review` pass over the task's own changes feeds QA, and only blocking issues send work back to Build
- **Standards** — coding, testing, and design-system skills preloaded into the agents that need them
- **Traceability** — every decision and output is recorded in artifacts and run reports

See [harness/README.md](harness/README.md) for full details.

## Technology Stack

- **CMS:** SitecoreAI
- **Front-end:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS
- **SDK:** Sitecore Content SDK for Next.js
- **i18n:** next-intl
- **CI:** GitHub Actions

## Prerequisites

- Node.js 24+
- npm
- A SitecoreAI environment (for full CMS integration)
- .NET SDK, for the Sitecore CLI (7.0.24, pinned in `src/.config/dotnet-tools.json`). Run `dotnet tool restore` from `src/` to install it; it is used to pull serialized items

## Getting Started

```bash
# Clone the repository
git clone https://github.com/robearlam/sitecoreai-harness-engineering.git
cd sitecoreai-harness-engineering

# Install head application dependencies
cd src/headapps/rob-harness-engineering
npm install

# Copy environment template and configure
cp .env.remote.example .env.local
# Edit .env.local with your SitecoreAI connection details

# Start development server
npm run dev
```

### Available Commands

From `src/headapps/rob-harness-engineering/`:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint (the script's glob does not currently reach `src/components/`; run `npx eslint src/components` directly) |
| `npm test` | Run Jest test suite |

## Claude Code Configuration

| What | Where |
|------|-------|
| Repo-wide instructions | `CLAUDE.md` |
| Stage agents | `.claude/agents/` |
| Task creation, orchestrator, approval gate, and standards | `.claude/skills/` |
| Hooks and governance rules | `.claude/hooks/`, `.claude/settings.json` |
| Head app (Next.js) guidance | `src/headapps/rob-harness-engineering/AGENTS.md` |

To change how a stage behaves, edit its file in `.claude/agents/` — there is one definition per stage and nothing to keep in sync. See [harness/README.md](harness/README.md#modifying-the-harness-itself) for how harness changes are made.

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.

## Disclaimer

This is a **demonstration repository** accompanying a conference presentation. It is intended as a reference for how AI-assisted workflows can be structured, not as a production-ready starter kit. The XM Cloud environment backing this project may not be available.
