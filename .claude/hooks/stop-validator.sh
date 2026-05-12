#!/usr/bin/env bash
# Stop Validator: Enforce completion protocol before Claude stops
# Exit 0 = allow stop, Exit 2 = force Claude to continue (with reason on stderr)
set -euo pipefail

INPUT=$(cat)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
LOG_DIR="$PROJECT_DIR/.claude/logs"
mkdir -p "$LOG_DIR"

# Check if this is a stop-hook re-entry (prevent infinite loops)
STOP_ACTIVE=$(echo "$INPUT" | python -c "import sys,json; print(json.load(sys.stdin).get('stop_hook_active', False))" 2>/dev/null || echo "False")
if [ "$STOP_ACTIVE" = "True" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') | STOP | re-entry, allowing" >> "$LOG_DIR/session.log"
  exit 0
fi

# Log session stop
echo "$(date '+%Y-%m-%d %H:%M:%S') | STOP | session ending" >> "$LOG_DIR/session.log"

# Check if any files were modified this session (WARN or ALLOW, not BLOCK or LINT)
if [ -f "$LOG_DIR/file-ops.log" ]; then
  TODAY=$(date '+%Y-%m-%d')
  CHANGES_TODAY=$(grep -c "^$TODAY.*| \(ALLOW\|WARN\) |" "$LOG_DIR/file-ops.log" 2>/dev/null) || CHANGES_TODAY=0

  if [ "$CHANGES_TODAY" -gt 0 ]; then
    # Files were modified — check if TASKS.md was updated (could be WARN or ALLOW)
    TASKS_UPDATED=$(grep -c "TASKS.md" "$LOG_DIR/file-ops.log" 2>/dev/null) || TASKS_UPDATED=0

    if [ "$TASKS_UPDATED" = "0" ]; then
      echo "COMPLETION CHECK: You modified $CHANGES_TODAY files today but TASKS.md was not updated. Update task status before stopping." >&2
      exit 2
    fi
  fi
fi

# Allow stop
exit 0
