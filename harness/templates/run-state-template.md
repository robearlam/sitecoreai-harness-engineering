# Run State

## Task

Task ID: {{TASK_ID}}  
Task File: {{TASK_FILE}}

---

## Execution State

Current Status: {{CURRENT_STATUS}}  
Current Stage: {{CURRENT_STAGE}}  
Current Run ID: {{CURRENT_RUN_ID}}  
Workflow Mode: {{WORKFLOW_MODE}}  
CMS Configuration: {{CMS_CONFIGURATION}}  
Branch: {{BRANCH}}

Stop Reason: {{STOP_REASON}}

---

## Completed Stages

{{COMPLETED_STAGES}}

---

## Artifact Paths

Feature Specification: {{FEATURE_SPEC_PATH}}  
Design Note: {{DESIGN_NOTE_PATH}}  
Implementation Plan: {{IMPLEMENTATION_PLAN_PATH}}  
QA Review: {{QA_REVIEW_PATH}}  
CMS Configuration Guide: {{CMS_CONFIG_PATH}}  
Run Report: {{RUN_REPORT_PATH}}

---

## Approval Mode

Require Approval Before Build: {{REQUIRE_APPROVAL_BEFORE_BUILD}}  
Require Approval Before Complete: {{REQUIRE_APPROVAL_BEFORE_COMPLETE}}

---

## Notes

{{NOTES}}

<!--
Written only by .claude/skills/run-task/scripts/harness-state — never by hand.
Notes stay a few lines: current position, what happens next, and a pointer to
the run report. Narrative history belongs in the run report under harness/runs/.
-->
