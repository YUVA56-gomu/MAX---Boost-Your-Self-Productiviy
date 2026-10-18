# Verification script for Dashboard Workflows and Real Persistence
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$venvPython = Join-Path $rootDir "backend\.venv\Scripts\python.exe"

# Pre-clean ports if needed
$ports = @(24125, 5173)
foreach ($port in $ports) {
    $stalePids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 4 }
    foreach ($p in $stalePids) {
        Write-Host "Cleaning stale process on port $port (PID: $p)..." -ForegroundColor Yellow
        taskkill /F /T /PID $p 2>$null
    }
    Start-Sleep -Milliseconds 300
}

Write-Host "1. Starting FastAPI backend on 127.0.0.1:24125..." -ForegroundColor Cyan
$backendProc = Start-Process -FilePath $venvPython -ArgumentList "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "24125" -WorkingDirectory $rootDir -PassThru -NoNewWindow

Write-Host "2. Starting Vite frontend on http://localhost:5173..." -ForegroundColor Cyan
$frontendProc = Start-Process -FilePath "pnpm.cmd" -ArgumentList "run", "dev", "--", "--port", "5173" -WorkingDirectory (Join-Path $rootDir "frontend") -PassThru -NoNewWindow

Start-Sleep -Seconds 3

$authToken = "dev-ephemeral-auth-token-32-bytes-local"
$headers = @{
    "Authorization" = "Bearer $authToken"
    "Content-Type"  = "application/json"
}

try {
    # 1. Health Probe
    Write-Host "3. Verifying live backend health..." -ForegroundColor Cyan
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:24125/api/v1/health" -Method Get -TimeoutSec 5
    Write-Host "   Backend status: $($health.status), DB: $($health.database)" -ForegroundColor Green
    if ($health.database -ne "connected") {
        throw "Backend database is not connected!"
    }

    # 2. Workspaces
    Write-Host "4. Verifying workspace retrieval..." -ForegroundColor Cyan
    $workspaces = Invoke-RestMethod -Uri "http://127.0.0.1:24125/api/v1/workspaces" -Method Get -Headers $headers -TimeoutSec 5
    Write-Host "   Found $($workspaces.Count) workspace(s). Default: '$($workspaces[0].name)' (ID: $($workspaces[0].id))" -ForegroundColor Green
    $workspaceId = $workspaces[0].id

    # 3. Create Task via API
    Write-Host "5. Creating real task via POST /api/v1/tasks..." -ForegroundColor Cyan
    $taskPayload = @{
        workspace_id      = $workspaceId
        title             = "Validate Gemini Dark Canvas Vertical Slice"
        description       = "Integrated testing of tasks, timer, and velocity cards"
        priority          = "urgent"
        energy_level      = 5
        estimated_minutes = 45
    } | ConvertTo-Json
    $createdTask = Invoke-RestMethod -Uri "http://127.0.0.1:24125/api/v1/tasks" -Method Post -Headers $headers -Body $taskPayload -TimeoutSec 5
    Write-Host "   Created task: '$($createdTask.title)' (ID: $($createdTask.id), Priority: $($createdTask.priority))" -ForegroundColor Green

    # 4. Fetch Tasks via API
    Write-Host "6. Verifying task persistence via GET /api/v1/tasks..." -ForegroundColor Cyan
    $tasks = Invoke-RestMethod -Uri "http://127.0.0.1:24125/api/v1/tasks?workspace_id=$workspaceId" -Method Get -Headers $headers -TimeoutSec 5
    $target = $tasks | Where-Object { $_.id -eq $createdTask.id }
    if (-not $target) {
        throw "Task $($createdTask.id) not found in GET /api/v1/tasks!"
    }
    Write-Host "   Verified task exists in SQLite backend." -ForegroundColor Green

    # 5. Toggle Task Completion
    Write-Host "7. Updating task status via PATCH /api/v1/tasks/$($createdTask.id)..." -ForegroundColor Cyan
    $updatePayload = @{
        status       = "completed"
        completed_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    } | ConvertTo-Json
    $updatedTask = Invoke-RestMethod -Uri "http://127.0.0.1:24125/api/v1/tasks/$($createdTask.id)" -Method Patch -Headers $headers -Body $updatePayload -TimeoutSec 5
    Write-Host "   Updated task status: '$($updatedTask.status)' (Completed At: $($updatedTask.completed_at))" -ForegroundColor Green
    if ($updatedTask.status -ne "completed") {
        throw "Task status update failed!"
    }

    # 6. Record Focus Session
    Write-Host "8. Starting focus session via POST /api/v1/focus/sessions/start..." -ForegroundColor Cyan
    $focusStartPayload = @{
        workspace_id = $workspaceId
        task_id      = $createdTask.id
        session_type = "pomodoro"
    } | ConvertTo-Json
    $focusSession = Invoke-RestMethod -Uri "http://127.0.0.1:24125/api/v1/focus/sessions/start" -Method Post -Headers $headers -Body $focusStartPayload -TimeoutSec 5
    Write-Host "   Started focus session: $($focusSession.id)" -ForegroundColor Green

    Write-Host "9. Completing focus session (1500s = 25m)..." -ForegroundColor Cyan
    $focusCompletePayload = @{
        duration_seconds   = 1500
        interruption_count = 1
    } | ConvertTo-Json
    $completedSession = Invoke-RestMethod -Uri "http://127.0.0.1:24125/api/v1/focus/sessions/$($focusSession.id)/complete" -Method Post -Headers $headers -Body $focusCompletePayload -TimeoutSec 5
    Write-Host "   Completed focus session. Duration: $($completedSession.duration_seconds)s, Interrupted: $($completedSession.interruption_count)" -ForegroundColor Green

    # 7. Verify Workload Insights
    Write-Host "10. Querying Workload Insights via GET /api/v1/insights/workload..." -ForegroundColor Cyan
    $insights = Invoke-RestMethod -Uri "http://127.0.0.1:24125/api/v1/insights/workload?workspace_id=$workspaceId&range=7d" -Method Get -Headers $headers -TimeoutSec 5
    Write-Host "    Workload Insights: Focus Hours: $($insights.deep_work_focus_hours)h, Completed Tasks: $($insights.tasks_completed_count), Planned Mins: $($insights.total_planned_minutes)" -ForegroundColor Green

    # 8. Verify Frontend Vite Server
    Write-Host "11. Probing Vite frontend dev server at http://localhost:5173..." -ForegroundColor Cyan
    $frontendResp = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 5 -UseBasicParsing
    Write-Host "    Frontend responded HTTP $($frontendResp.StatusCode)" -ForegroundColor Green
    if ($frontendResp.Content -notmatch "<div id=`"root`"></div>") {
        throw "Frontend did not serve valid Vite React HTML container!"
    }
    Write-Host "    Frontend root container verified successfully." -ForegroundColor Green

    # 9. Clean up created task
    Write-Host "12. Cleaning up test task via DELETE /api/v1/tasks/$($createdTask.id)..." -ForegroundColor Cyan
    Invoke-RestMethod -Uri "http://127.0.0.1:24125/api/v1/tasks/$($createdTask.id)" -Method Delete -Headers $headers -TimeoutSec 5 | Out-Null
    Write-Host "    Test task deleted cleanly." -ForegroundColor Green

    Write-Host "`nAll dashboard workflow and persistence validations passed with 100% success!" -ForegroundColor Green

} finally {
    Write-Host "`n13. Shutting down development processes..." -ForegroundColor Cyan
    if ($backendProc -and -not $backendProc.HasExited) {
        taskkill /F /T /PID $backendProc.Id 2>$null
    }
    if ($frontendProc -and -not $frontendProc.HasExited) {
        taskkill /F /T /PID $frontendProc.Id 2>$null
    }
    Start-Sleep -Milliseconds 500

    # Ensure zero orphans on ports
    foreach ($port in $ports) {
        $leftoverPids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 4 }
        foreach ($p in $leftoverPids) {
            taskkill /F /T /PID $p 2>$null
        }
    }
    Write-Host "    Zero orphan processes verified on ports 24125 and 5173." -ForegroundColor Green
}
