# ralph.ps1 - WhiskeyPedia Ralph Loop
# Autonomous Claude Code execution with fresh context per iteration

param(
    [int]$MaxIterations = 50,
    [int]$PauseBetween = 5,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = $PSScriptRoot
$LogDir = Join-Path $ProjectRoot "ralph-logs"
$TasksFile = Join-Path $ProjectRoot "specs/TASKS.md"
$ProgressFile = Join-Path $ProjectRoot "specs/PROGRESS.md"

# Create log directory
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

# Timestamp for this run
$RunTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$RunLog = Join-Path $LogDir "run-$RunTimestamp.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logLine = "[$timestamp] $Message"
    Write-Host $logLine
    Add-Content -Path $RunLog -Value $logLine
}

function Get-NextTask {
    # Find first uncompleted task (marked with ⬜)
    $content = Get-Content $TasksFile -Raw
    
    # Match task lines: | T### | description | criteria | ⬜ |
    $pattern = '\|\s*(T\d{3})\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*⬜\s*\|'
    
    if ($content -match $pattern) {
        return @{
            ID = $matches[1].Trim()
            Task = $matches[2].Trim()
            Criteria = $matches[3].Trim()
        }
    }
    
    return $null
}

function Update-TaskStatus {
    param(
        [string]$TaskID,
        [string]$Status  # ✅, ❌, 🔄
    )
    
    $content = Get-Content $TasksFile -Raw
    $pattern = "(\|\s*$TaskID\s*\|[^|]+\|[^|]+\|)\s*⬜\s*\|"
    $replacement = "`$1 $Status |"
    
    $newContent = $content -replace $pattern, $replacement
    Set-Content -Path $TasksFile -Value $newContent
    
    Write-Log "Updated $TaskID status to $Status"
}

function Invoke-ClaudeCode {
    param([string]$Prompt)
    
    if ($DryRun) {
        Write-Log "[DRY RUN] Would execute: $Prompt"
        return "DRY RUN - No execution"
    }
    
    # Run Claude Code with the prompt
    # --print flag outputs result without interactive mode
    $result = claude --print $Prompt 2>&1
    
    return $result
}

function Get-MainPrompt {
    param([hashtable]$Task)
    
    return @"
You are working on WhiskeyPedia, a whiskey collection management app.

## Your Current Task

**Task ID:** $($Task.ID)
**Task:** $($Task.Task)
**Success Criteria:** $($Task.Criteria)

## Instructions

1. Read the relevant spec files in @specs/ to understand context
2. Implement or verify the task
3. Run tests if applicable
4. Make a git commit with message: "$($Task.ID): $($Task.Task)"
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
"@
}

# Main Loop
Write-Log "=== WhiskeyPedia Ralph Loop Started ==="
Write-Log "Max iterations: $MaxIterations"
Write-Log "Project root: $ProjectRoot"

$iteration = 0
$completed = 0
$blocked = 0

while ($iteration -lt $MaxIterations) {
    $iteration++
    Write-Log ""
    Write-Log "=== Iteration $iteration of $MaxIterations ==="
    
    # Get next task
    $task = Get-NextTask
    
    if ($null -eq $task) {
        Write-Log "No more tasks found! All tasks may be complete."
        break
    }
    
    Write-Log "Task: $($task.ID) - $($task.Task)"
    
    # Mark as in progress
    Update-TaskStatus -TaskID $task.ID -Status "🔄"
    
    # Build and execute prompt
    $prompt = Get-MainPrompt -Task $task
    
    Write-Log "Executing Claude Code..."
    $result = Invoke-ClaudeCode -Prompt $prompt
    
    # Log result
    $iterLog = Join-Path $LogDir "iter-$iteration-$($task.ID).log"
    Set-Content -Path $iterLog -Value $result
    
    # Parse result
    if ($result -match "TASK_COMPLETE") {
        Write-Log "Task $($task.ID) completed successfully"
        Update-TaskStatus -TaskID $task.ID -Status "✅"
        $completed++
        
        # Git commit (Claude should have done this, but ensure it's pushed)
        git add -A 2>$null
        git commit -m "$($task.ID): $($task.Task)" --allow-empty 2>$null
    }
    elseif ($result -match "TASK_BLOCKED:\s*(.+)") {
        $reason = $matches[1]
        Write-Log "Task $($task.ID) blocked: $reason"
        Update-TaskStatus -TaskID $task.ID -Status "❌"
        $blocked++
    }
    else {
        # Unclear result - mark as still in progress, will retry
        Write-Log "Task $($task.ID) result unclear, will retry next iteration"
        Update-TaskStatus -TaskID $task.ID -Status "⬜"
    }
    
    # Update progress file
    $progressContent = @"
# WhiskeyPedia Ralph Progress

**Run Started:** $RunTimestamp
**Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Statistics

- Iterations: $iteration
- Tasks Completed: $completed
- Tasks Blocked: $blocked

## Recent Activity

$(Get-Content $RunLog -Tail 20 | Out-String)
"@
    Set-Content -Path $ProgressFile -Value $progressContent
    
    # Pause between iterations
    if ($iteration -lt $MaxIterations) {
        Write-Log "Pausing $PauseBetween seconds..."
        Start-Sleep -Seconds $PauseBetween
    }
}

Write-Log ""
Write-Log "=== Ralph Loop Complete ==="
Write-Log "Total iterations: $iteration"
Write-Log "Tasks completed: $completed"
Write-Log "Tasks blocked: $blocked"
Write-Log "Log file: $RunLog"
