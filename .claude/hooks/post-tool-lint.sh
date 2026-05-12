#!/usr/bin/env bash
# PostToolUse Lint: Auto-format files after write operations
# PostToolUse cannot block — only provide feedback
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin).get('tool_input',{}); print(d.get('file_path', d.get('path', '')))" 2>/dev/null || echo "")

# Skip if no file path or file doesn't exist
[ -z "$FILE_PATH" ] && exit 0
[ ! -f "$FILE_PATH" ] && exit 0

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
LOG_DIR="$PROJECT_DIR/.claude/logs"
mkdir -p "$LOG_DIR"

# Determine file type
EXT="${FILE_PATH##*.}"

LINT_RESULT="SKIP"

# Try prettier for web files (JS, TS, JSX, TSX, CSS, JSON, MD, HTML)
case "$EXT" in
  js|ts|jsx|tsx|css|json|md|html|yml|yaml)
    if command -v npx &>/dev/null && [ -f "$PROJECT_DIR/node_modules/.bin/prettier" ]; then
      if npx prettier --write "$FILE_PATH" 2>/dev/null; then
        LINT_RESULT="OK"
      else
        LINT_RESULT="FAIL"
      fi
    else
      LINT_RESULT="SKIP:no-prettier"
    fi
    ;;
  py)
    if command -v black &>/dev/null; then
      if black --quiet "$FILE_PATH" 2>/dev/null; then
        LINT_RESULT="OK"
      else
        LINT_RESULT="FAIL"
      fi
    else
      LINT_RESULT="SKIP:no-black"
    fi
    ;;
esac

# Try eslint for JS/TS files (fix only, don't fail)
case "$EXT" in
  js|ts|jsx|tsx)
    if command -v npx &>/dev/null && [ -f "$PROJECT_DIR/node_modules/.bin/eslint" ]; then
      npx eslint --fix "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
esac

# Log result
echo "$(date '+%Y-%m-%d %H:%M:%S') | LINT | $LINT_RESULT | $FILE_PATH" >> "$LOG_DIR/file-ops.log"

exit 0
