#!/usr/bin/env python3
"""cms-mcp-guard — PreToolUse and PostToolUse hook for the Sitecore MCP servers.

Wired in .claude/settings.json for every sc-developer and sc-marketer tool.
Read tools pass through untouched. For write tools:

PreToolUse
  - denies the call unless harness/run-state.md shows the CMS Configuration
    stage with status Active
  - denies the call unless it comes from the cms-config agent (the main
    session and every other agent are refused)
  - denies delete_content unless the write log shows the current run created
    the item
  - fails closed: if the guard itself errors on a write, the write is denied

PostToolUse
  - appends the write to harness/runs/<TASK>-cms-writes.jsonl with the item
    IDs it created and touched. verify-stage.sh cross-checks that log against
    the CMS Configuration Record. Stage agents never write to it.
"""
import datetime
import json
import os
import re
import sys

DEV = "mcp__sc-developer__"
MKT = "mcp__sc-marketer__"

# Writes that create new items; their returned IDs are "created" by the run.
CREATE_TOOLS = {
    DEV + "create_content_type",
    DEV + "create_component",
    DEV + "create_content_item",
    MKT + "create_content_item",
    MKT + "create_page",
    MKT + "create_component_ds",
    MKT + "add_component_on_page",  # creates a local datasource item
}
WRITE_TOOLS = CREATE_TOOLS | {
    DEV + "update_content_type",
    DEV + "update_component",
    MKT + "update_fields_on_item",
    MKT + "update_content",
    MKT + "add_language_to_page",
    MKT + "move_component_on_page",
    MKT + "remove_component_on_page",
    MKT + "set_component_datasource",
    MKT + "delete_content",
}
DELETE_TOOL = MKT + "delete_content"

# Input keys that name an existing item the call changes. On sc-marketer page
# tools, componentId is a component instance on the page, not an item, so it
# counts only for sc-developer (where it is the rendering item). modelId is the
# changed item only for update_content_type; on create_component it just links
# the rendering to an existing template, which is not a write to the template.
TOUCHED_INPUT_KEYS = ("itemId", "pageId")
MODEL_TARGET_TOOLS = {DEV + "update_content_type"}
# Response key holding the new item's ID, per create tool.
CREATED_RESPONSE_KEY = {
    DEV + "create_content_type": "id",
    DEV + "create_component": "id",
    DEV + "create_content_item": "id",
    MKT + "create_content_item": "itemId",
    MKT + "create_page": "itemId",
    MKT + "create_component_ds": "itemId",
    MKT + "add_component_on_page": "datasourceId",
}

ROOT = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
RUN_STATE = os.path.join(ROOT, "harness", "run-state.md")


def norm(value):
    return str(value).strip().strip("{}").lower()


def run_state():
    try:
        text = open(RUN_STATE, encoding="utf-8").read()
    except OSError:
        return {}
    fields = {}
    for key in ("Task ID", "Current Status", "Current Stage", "Current Run ID"):
        m = re.search(rf"^{re.escape(key)}:[ \t]*(.*?)[ \t]*$", text, re.M)
        fields[key] = m.group(1) if m else ""
    return fields


def log_path(task):
    return os.path.join(ROOT, "harness", "runs", f"{task}-cms-writes.jsonl")


def read_log(task):
    try:
        with open(log_path(task), encoding="utf-8") as f:
            return [json.loads(line) for line in f if line.strip()]
    except OSError:
        return []


def response_objects(response):
    """Yield the JSON objects in an MCP tool response, whatever its shape."""
    if isinstance(response, dict):
        if "content" in response:
            yield from response_objects(response["content"])
        else:
            yield response
    elif isinstance(response, list):
        for block in response:
            if isinstance(block, dict) and block.get("type") == "text":
                yield from response_objects(block.get("text", ""))
            else:
                yield from response_objects(block)
    elif isinstance(response, str):
        try:
            yield from response_objects(json.loads(response))
        except ValueError:
            return


def response_failed(response):
    if isinstance(response, dict) and response.get("isError"):
        return True
    text = response if isinstance(response, str) else json.dumps(response)
    return text.lstrip("[{\"' ").startswith(("Error", "ERROR"))


def deny(reason, event=None):
    caller = (event or {}).get("agent_type") or "main session"
    reason = f"{reason} [caller: {caller}]"
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": f"cms-mcp-guard: {reason}",
    }}))
    sys.exit(0)


def pre(event, state):
    if state.get("Current Stage") != "CMS Configuration" or state.get("Current Status") != "Active":
        deny("Sitecore MCP writes are allowed only while harness/run-state.md shows the CMS "
             "Configuration stage Active (now: stage "
             f"'{state.get('Current Stage') or 'none'}', status '{state.get('Current Status') or 'none'}'). "
             "Use the read tools, or run the write through /run-task.", event)
    # Subagent tool calls carry agent_type; main-session calls have none.
    if event.get("agent_type") != "cms-config":
        deny("Sitecore MCP writes are allowed only from the cms-config agent.", event)
    if event["tool_name"] == DELETE_TOOL:
        item = norm(event.get("tool_input", {}).get("itemId", ""))
        run_id = state.get("Current Run ID")
        created = {norm(i) for e in read_log(state["Task ID"]) if e.get("run_id") == run_id
                   for i in e.get("created", [])}
        if not item or item not in created:
            deny(f"delete_content is allowed only on items this run ({run_id}) created, according to "
                 f"{os.path.relpath(log_path(state['Task ID']), ROOT)}. Item {item or '(none)'} is not one of them.", event)


def post(event, state):
    tool = event["tool_name"]
    response = event.get("tool_response")
    if response_failed(response):
        return
    tool_input = event.get("tool_input", {}) or {}
    touched, created = [], []
    for key in TOUCHED_INPUT_KEYS:
        if tool_input.get(key):
            touched.append(norm(tool_input[key]))
    if tool.startswith(DEV) and tool_input.get("componentId"):
        touched.append(norm(tool_input["componentId"]))
    if tool in MODEL_TARGET_TOOLS and tool_input.get("modelId"):
        touched.append(norm(tool_input["modelId"]))
    key = CREATED_RESPONSE_KEY.get(tool)
    if key:
        for obj in response_objects(response):
            if isinstance(obj, dict) and obj.get(key):
                created.append(norm(obj[key]))
        touched += created
    entry = {
        "ts": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "task": state.get("Task ID", ""),
        "run_id": state.get("Current Run ID", ""),
        "agent": event.get("agent_type", ""),
        "tool": tool,
        "touched": sorted(set(touched)),
        "created": sorted(set(created)),
        "input": tool_input,
    }
    os.makedirs(os.path.dirname(log_path(entry["task"] or "UNKNOWN")), exist_ok=True)
    with open(log_path(entry["task"] or "UNKNOWN"), "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def main():
    event = json.load(sys.stdin)
    if event.get("tool_name") not in WRITE_TOOLS:
        return
    hook = event.get("hook_event_name")
    try:
        state = run_state()
        if hook == "PreToolUse":
            pre(event, state)
        elif hook == "PostToolUse":
            post(event, state)
    except SystemExit:
        raise
    except Exception as exc:  # fail closed on writes
        if hook == "PreToolUse":
            deny(f"guard error, write denied: {exc}", event)
        print(f"cms-mcp-guard: could not log write: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
