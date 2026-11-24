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

check_cms_write_log() {
    # $1 = CMS Configuration Record, $2 = write log kept by .claude/hooks/cms-mcp-guard.py
    # Cross-checks the record against the hook's log for the current run:
    #   - per item, the number of logged writes equals the number of
    #     Created/Updated/Deleted rows in ## Changes Applied (one row per write)
    #   - every item the log shows was created appears in ## Rollback
    [ -f "$1" ] || return
    if ! out=$(python3 -I - "$1" "$2" "$HARNESS_DIR/run-state.md" <<'PY' 2>&1
import json, os, re, sys

record_path, log_path, run_state_path = sys.argv[1:4]
record = open(record_path, encoding="utf-8").read()

def norm(value):
    return str(value).strip().strip("{}" + chr(96)).lower()  # chr(96): backquote, which sh can't parse here

def section(name):
    m = re.search(rf"^## {re.escape(name)}[ \t]*$(.*?)(?=^## |\Z)", record, re.M | re.S)
    return m.group(1) if m else ""

entries = []
if os.path.exists(log_path):
    with open(log_path, encoding="utf-8") as f:
        entries = [json.loads(line) for line in f if line.strip()]

run_id = ""
if os.path.exists(run_state_path):
    m = re.search(r"^Current Run ID:[ \t]*(\S+)", open(run_state_path, encoding="utf-8").read(), re.M)
    run_id = m.group(1) if m else ""
if entries and not any(e.get("run_id") == run_id for e in entries):
    run_id = entries[-1].get("run_id", "")
entries = [e for e in entries if e.get("run_id") == run_id]

touched = {norm(i) for e in entries for i in e.get("touched", [])}
created = {norm(i) for e in entries for i in e.get("created", [])}

changes = section("Changes Applied")
main_table = changes.split("\n### ", 1)[0]
rollback = section("Rollback").lower()

from collections import Counter
logged = Counter(norm(i) for e in entries for i in set(e.get("touched", [])))
rows = Counter()
for line in main_table.splitlines():
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    if len(cells) >= 6 and cells[1] in ("Created", "Updated", "Deleted"):
        rows[norm(cells[5])] += 1

problems = []
for item in sorted(set(logged) | set(rows)):
    if logged[item] != rows[item]:
        problems.append(f"item {item}: {logged[item]} write(s) in the log, "
                        f"{rows[item]} Created/Updated/Deleted row(s) in ## Changes Applied")
for item in sorted(created):
    if item not in rollback:
        problems.append(f"created item {item} is missing from ## Rollback")

if problems:
    print("\n".join(f"        {p}" for p in problems))
    sys.exit(1)
print(f"{len(entries)} logged write(s) for {run_id or 'no run'}")
PY
    ); then
        fail "$1 — does not match the CMS write log $2:
$out"
        return
    fi
    echo "PASS  $1 matches the CMS write log ($out)"
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
            "## Summary" "## Environment Check" "## Changes Applied" \
            "## Verification" "## Serialization" "## Manual Steps" "## Rollback"
        check_cms_write_log "$HARNESS_DIR/artifacts/cms-config/$TASK-cms-config.md" \
            "$HARNESS_DIR/runs/$TASK-cms-writes.jsonl"
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
