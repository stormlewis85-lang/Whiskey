#!/bin/bash
# ralph.sh - WhiskeyPedia Ralph Loop (Mac/Linux version)
# Autonomous Claude Code execution with fresh context per iteration

set -e

# Configuration
MAX_ITERATIONS=${1:-50}
PAUSE_BETWEEN=${2:-5}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_ROOT/ralph-logs"
TASKS_FILE="$PROJECT_ROOT/specs/TASKS.md"
PROGRESS_FILE="$PROJECT_ROOT/specs/PROGRESS.md"

# Create log directory
mkdir -p "$LOG_DIR"

# Timestamp for this run
RUN_TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
RUN_LOG="$LOG_DIR/run-$RUN_TIMESTAMP.log"

log() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] $1" | tee -a "$RUN_LOG"
}

get_next_task() {
    # Find first uncompleted task (marked with ⬜)
    # Returns: ID|Task|Criteria or empty if none
    grep -E '^\|\s*T[0-9]{3}\s*\|.*\|\s*⬜\s*\|' "$TASKS_FILE" | head -1 | \
        sed 's/|/\n/g' | tail -n +2 | head -3 | \
        awk 'NR==1{id=$0} NR==2{task=$0} NR==3{criteria=$0} END{print id"|"task"|"criteria}' | \
        sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

update_task_status() {
    local task_id="$1"
    local status="$2"
    
    # Replace ⬜ with new status for the specific task
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\(| *$task_id *|[^|]*|[^|]*|\) *⬜ *|/\1 $status |/" "$TASKS_FILE"
    else
        sed -i "s/\(| *$task_id *|[^|]*|[^|]*|\) *⬜ *|/\1 $status |/" "$TASKS_FILE"
    fi
    
    log "Updated $task_id status to $status"
}

run_claude() {
    local prompt="$1"
    
    # Run Claude Code with the prompt
    claude --print "$prompt" 2>&1
}

build_prompt() {
    local task_id="$1"
    local task="$2"
    local criteria="$3"
    
    cat << EOF
You are working on WhiskeyPedia, a whiskey collection management app.

## Your Current Task

**Task ID:** $task_id
**Task:** $task
**Success Criteria:** $criteria

## Instructions

1. Read the relevant spec files in @specs/ to understand context
2. Implement or verify the task
3. Run tests if applicable
4. Make a git commit with message: "$task_id: $task"
5. If successful, respond with: TASK_COMPLETE
6. If blocked, respond with: TASK_BLOCKED: [reason]

## Key Files

- @CLAUDE.md - Project instructions
- @specs/ARCHITECTURE.md - System design
- @specs/DATABASE.md - Schema
- @specs/API.md - Endpoints
- @specs/TESTING.md - Test plan
- @specs/TASKS.md - Task list

Focus only on this task. Do not proceed to other tasks.
EOF
}

update_progress() {
    local iteration="$1"
    local completed="$2"
    local blocked="$3"
    
    cat > "$PROGRESS_FILE" << EOF
# WhiskeyPedia Ralph Progress

**Run Started:** $RUN_TIMESTAMP
**Last Updated:** $(date +"%Y-%m-%d %H:%M:%S")

## Statistics

- Iterations: $iteration
- Tasks Completed: $completed
- Tasks Blocked: $blocked

## Recent Activity

$(tail -20 "$RUN_LOG")
EOF
}

# Main Loop
log "=== WhiskeyPedia Ralph Loop Started ==="
log "Max iterations: $MAX_ITERATIONS"
log "Project root: $PROJECT_ROOT"

iteration=0
completed=0
blocked=0

while [ $iteration -lt $MAX_ITERATIONS ]; do
    ((iteration++))
    log ""
    log "=== Iteration $iteration of $MAX_ITERATIONS ==="
    
    # Get next task
    task_line=$(get_next_task)
    
    if [ -z "$task_line" ]; then
        log "No more tasks found! All tasks may be complete."
        break
    fi
    
    # Parse task
    task_id=$(echo "$task_line" | cut -d'|' -f1 | xargs)
    task=$(echo "$task_line" | cut -d'|' -f2 | xargs)
    criteria=$(echo "$task_line" | cut -d'|' -f3 | xargs)
    
    log "Task: $task_id - $task"
    
    # Mark as in progress
    update_task_status "$task_id" "🔄"
    
    # Build and execute prompt
    prompt=$(build_prompt "$task_id" "$task" "$criteria")
    
    log "Executing Claude Code..."
    result=$(run_claude "$prompt")
    
    # Log result
    iter_log="$LOG_DIR/iter-$iteration-$task_id.log"
    echo "$result" > "$iter_log"
    
    # Parse result
    if echo "$result" | grep -q "TASK_COMPLETE"; then
        log "Task $task_id completed successfully"
        update_task_status "$task_id" "✅"
        ((completed++))
        
        # Git commit
        git add -A 2>/dev/null || true
        git commit -m "$task_id: $task" --allow-empty 2>/dev/null || true
    elif echo "$result" | grep -q "TASK_BLOCKED"; then
        reason=$(echo "$result" | grep "TASK_BLOCKED" | sed 's/.*TASK_BLOCKED:[[:space:]]*//')
        log "Task $task_id blocked: $reason"
        update_task_status "$task_id" "❌"
        ((blocked++))
    else
        log "Task $task_id result unclear, will retry next iteration"
        update_task_status "$task_id" "⬜"
    fi
    
    # Update progress file
    update_progress $iteration $completed $blocked
    
    # Pause between iterations
    if [ $iteration -lt $MAX_ITERATIONS ]; then
        log "Pausing $PAUSE_BETWEEN seconds..."
        sleep $PAUSE_BETWEEN
    fi
done

log ""
log "=== Ralph Loop Complete ==="
log "Total iterations: $iteration"
log "Tasks completed: $completed"
log "Tasks blocked: $blocked"
log "Log file: $RUN_LOG"
