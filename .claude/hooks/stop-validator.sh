#!/usr/bin/env bash
# Stop Validator: Enforce completion protocol before Claude stops
# Exit 0 = allow stop, Exit 2 = force Claude to continue (with reason on stderr)
set -euo pipefail

INPUT=$(cat)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
LOG_DIR="$PROJECT_DIR/.claude/logs"
mkdir -p "$LOG_DIR"

# Pure-bash JSON field extraction (same helper as pre-tool-guard.sh).
_json_str() {
  local key="$1" input="$2"
  printf '%s' "$input" | sed -n 's/.*"'"$key"'"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1
}

# Re-entry guard — prevent infinite loops when Claude retries after a block.
STOP_ACTIVE=$(_json_str "stop_hook_active" "$INPUT")
if [ "$STOP_ACTIVE" = "true" ] || [ "$STOP_ACTIVE" = "True" ]; then
  echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') | STOP | re-entry, allowing" >> "$LOG_DIR/session.log"
  exit 0
fi

# Log session stop
echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') | STOP | session ending" >> "$LOG_DIR/session.log"

# Count only ALLOW entries from this session's file-ops.log.
# pre-tool-guard.sh truncates the log at session start, so every entry here
# belongs to the current session.
if [ -f "$LOG_DIR/file-ops.log" ]; then
  MODIFIED_COUNT=$(grep -c "| ALLOW |" "$LOG_DIR/file-ops.log" 2>/dev/null) || MODIFIED_COUNT=0

  if [ "$MODIFIED_COUNT" -gt 0 ]; then
    # TASKS.md is a guarded file, so it gets logged as WARN, not ALLOW.
    TASKS_UPDATED=$(grep -c "| WARN |.*TASKS.md" "$LOG_DIR/file-ops.log" 2>/dev/null) || TASKS_UPDATED=0

    if [ "$TASKS_UPDATED" = "0" ]; then
      echo "COMPLETION CHECK: You modified $MODIFIED_COUNT files today but TASKS.md was not updated. Update task status before stopping." >&2
      exit 2
    fi
  fi
fi

# Clean up session marker so next session gets a fresh log
rm -f "$LOG_DIR/.session-id"

# Allow stop
exit 0