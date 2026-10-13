#!/bin/sh
# SessionStart hook — toolchain check plus the live workflow position.
#
# Injects the Execution State block of harness/run-state.md so the session
# knows the active task and stage without reading the file, and warns the
# user if the head app's dependencies, which Build and QA validate with,
# are not installed.

set -u

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
RUN_STATE="$ROOT/harness/run-state.md"
APP="$ROOT/src/headapps/rob-harness-engineering"

missing=""
command -v npm >/dev/null 2>&1 || missing="$missing npm"
[ -d "$APP/node_modules" ] || missing="$missing node_modules (run npm install in src/headapps/rob-harness-engineering)"

if [ -f "$RUN_STATE" ]; then
    task=$(sed -n 's/^Task ID:[[:space:]]*\([A-Za-z0-9]*\).*/\1/p' "$RUN_STATE" | head -1)
    state=$(awk '/^## Execution State/{f=1;next} /^---/{if(f)exit} f && NF' "$RUN_STATE")
    context="Harness run-state (harness/run-state.md) — Task ID: $task
$state"
else
    context="Harness run-state: no task has been started. Start one with /run-task TASKID."
fi
if [ -n "$missing" ]; then
    context="$context
Toolchain: NOT FOUND —$missing. Validation that depends on these cannot run; record it as unverified, never as passed."
fi

warning=""
[ -n "$missing" ] && warning="Harness toolchain check: missing$missing"

jq -n --arg ctx "$context" --arg warn "$warning" '
    {hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $ctx}}
    + (if $warn == "" then {} else {systemMessage: $warn} end)'
