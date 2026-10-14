#!/bin/sh
# SubagentStop hook — runs harness/verify-stage.sh when a stage agent finishes.
#
# Maps the finishing agent to its stage, reads the active task from
# harness/run-state.md, and verifies the stage's canonical artifact.
# On failure it exits 2, which blocks the stop and feeds the verification
# output back to the stage agent so it repairs its own artifact.
# On a second consecutive failure (stop_hook_active) it lets the agent stop
# and leaves the failure for the orchestrator, so this can never loop.

set -u

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
RUN_STATE="$ROOT/harness/run-state.md"

input=$(cat)
agent_type=$(printf '%s' "$input" | jq -r '.agent_type // ""')
stop_hook_active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false')

case "$agent_type" in
    po-spec)        stage=spec ;;
    feature-design) stage=design ;;
    tech-lead)      stage=plan ;;
    build)          stage=build ;;
    qa)             stage=qa ;;
    cms-config)     stage=cms ;;
    *)              exit 0 ;;  # not a stage agent
esac

[ -f "$RUN_STATE" ] || exit 0

task=$(sed -n 's/^Task ID:[[:space:]]*\([A-Za-z0-9]*\).*/\1/p' "$RUN_STATE" | head -1)
status=$(sed -n 's/^Current Status:[[:space:]]*\(.*[^[:space:]]\)[[:space:]]*$/\1/p' "$RUN_STATE" | head -1)

[ -n "$task" ] || exit 0
[ "$status" = "Complete" ] && exit 0

if output=$("$ROOT/harness/verify-stage.sh" "$stage" "$task" 2>&1); then
    exit 0
fi

if [ "$stop_hook_active" = "true" ]; then
    # Already asked the agent to repair once; hand off to the orchestrator.
    exit 0
fi

{
    echo "Stage verification failed for $task ($stage). Fix the artifact(s) below before finishing:"
    echo "$output"
} >&2
exit 2
