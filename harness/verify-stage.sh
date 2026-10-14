#!/bin/sh
# verify-stage.sh — deterministic stage-artifact verification for the harness.
#
# Usage:
#   harness/verify-stage.sh <stage> <task-id>
#   harness/verify-stage.sh init  <task-id>     # verifies run-state + run report exist
#
# Stages: spec | design | plan | build | qa | cms | init
#
# For each stage this checks that the canonical artifact(s):
#   - exist at the expected path
#   - are non-empty (at least MIN_LINES lines)
#   - contain the required section headings for that artifact type
#
# Exit code 0 = all checks passed. Non-zero = at least one check failed.
# A SubagentStop hook runs this when a stage agent finishes, and
# `harness-state advance` runs it again before moving run-state on.

set -u

MIN_LINES=20
HARNESS_DIR="$(cd "$(dirname "$0")" && pwd)"
EVIDENCE_PLACEHOLDER="Pending — recorded by the Build stage."

STAGE="${1:-}"
TASK="${2:-}"

if [ -z "$STAGE" ] || [ -z "$TASK" ]; then
    echo "usage: $0 <stage> <task-id>" >&2
    echo "stages: spec | design | plan | build | qa | cms | init" >&2
    exit 2
fi

FAILURES=0
REPORT="$HARNESS_DIR/runs/$TASK-run-report.md"

fail() {
    echo "FAIL  $1"
    FAILURES=$((FAILURES + 1))
}

check_file() {
    # $1 = path, $2 = min lines, remaining args = required headings
    path="$1"
    min="$2"
    shift 2

    if [ ! -f "$path" ]; then
        fail "$path — missing"
        return
    fi
    if [ ! -r "$path" ]; then
        fail "$path — unreadable"
        return
    fi
    lines=$(wc -l < "$path" | tr -d ' ')
    if [ "$lines" -lt "$min" ]; then
        fail "$path — only $lines lines (minimum $min); empty or malformed"
        return
    fi
    missing=""
    for heading in "$@"; do
        if ! grep -qF "$heading" "$path"; then
            missing="$missing
        missing heading: $heading"
        fi
    done
    if [ -n "$missing" ]; then
        fail "$path — structure incomplete:$missing"
        return
    fi
    echo "PASS  $path ($lines lines, structure ok)"
}

case "$STAGE" in
    init)
        check_file "$HARNESS_DIR/run-state.md" 20 \
            "## Execution State" "## Completed Stages" "## Artifact Paths" "## Approval Mode"
        check_file "$REPORT" 10 "## Task" "## Run" "## Stage History"
        ;;
    spec)
        check_file "$HARNESS_DIR/artifacts/specs/$TASK-feature-spec.md" "$MIN_LINES" \
            "## Feature Goal" "## In Scope" "## Out of Scope" \
            "## Acceptance Criteria" "## Lifecycle Check"
        ;;
    design)
        check_file "$HARNESS_DIR/artifacts/design/$TASK-design-note.md" "$MIN_LINES" \
            "## Design Intent" "## Page / Feature Structure" \
            "## Responsive Behaviour" "## Accessibility Considerations"
        ;;
    plan)
        check_file "$HARNESS_DIR/artifacts/plans/$TASK-implementation-plan.md" "$MIN_LINES" \
            "## Technical Approach" "## Implementation Slices" \
            "## CMS Prerequisites" "## Test Plan"
        ;;
    build)
        check_file "$REPORT" "$MIN_LINES" "## Stage History" "## Validation Evidence"
        if [ -f "$REPORT" ] && grep -qF "$EVIDENCE_PLACEHOLDER" "$REPORT"; then
            fail "$REPORT — Validation Evidence not recorded by Build"
        fi
        ;;
    qa)
        check_file "$HARNESS_DIR/artifacts/qa/$TASK-qa-review.md" "$MIN_LINES" \
            "## Validation Result" "## Acceptance Criteria Review" \
            "## Test Coverage Review" "## Approval Readiness"
        ;;
    cms)
        check_file "$HARNESS_DIR/artifacts/cms-config/$TASK-cms-config.md" "$MIN_LINES" \
            "## Summary" "Datasource Template" \
            "Serialization" "Post-Setup Validation"
        ;;
    *)
        echo "unknown stage: $STAGE" >&2
        echo "stages: spec | design | plan | build | qa | cms | init" >&2
        exit 2
        ;;
esac

if [ "$FAILURES" -gt 0 ]; then
    echo "RESULT: FAIL ($FAILURES check(s) failed)"
    exit 1
fi
echo "RESULT: PASS"
exit 0
