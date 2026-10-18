# Script to launch both backend and frontend development servers concurrently
$ErrorActionPreference = "Continue"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir

$venvPython = Join-Path $rootDir "backend\.venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "Error: Virtual environment not found at $venvPython" -ForegroundColor Red
    exit 1
}

# Ensure port 24125 is clear before launching
$existingConn = Get-NetTCPConnection -LocalPort 24125 -ErrorAction SilentlyContinue
if ($existingConn) {
    Write-Host "Warning: Port 24125 already in use by PID $($existingConn.OwningProcess). Terminating stale process..." -ForegroundColor Yellow
    taskkill /F /T /PID $existingConn.OwningProcess 2>$null
    Start-Sleep -Milliseconds 500
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Dual-Runtime Development Environment" -ForegroundColor Cyan
Write-Host "  Backend:  http://127.0.0.1:24125 (FastAPI)" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173  (Vite + React)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Start backend process with PID tracking
$backendProc = Start-Process -FilePath $venvPython `
    -ArgumentList "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "24125" `
    -WorkingDirectory $rootDir `
    -PassThru `
    -NoNewWindow

Write-Host "Backend process launched with PID $($backendProc.Id). Probing health..." -ForegroundColor Gray

# Probe health endpoint for readiness before starting frontend
$ready = $false
for ($i = 0; $i -lt 20; $i++) {
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:24125/api/v1/health" -Method Get -TimeoutSec 1 -ErrorAction Stop
        if ($resp.status -eq "healthy") {
            $ready = $true
            Write-Host "Backend is healthy: version $($resp.version), database: $($resp.database), ai: $($resp.ai_available)" -ForegroundColor Green
            break
        }
    } catch {
        Start-Sleep -Milliseconds 250
    }
}

if (-not $ready) {
    Write-Host "Warning: Backend did not respond healthy within 5 seconds. Launching frontend anyway..." -ForegroundColor Yellow
}

try {
    # Start frontend interactively in the foreground
    Set-Location (Join-Path $rootDir "frontend")
    & pnpm dev
}
finally {
    Write-Host "`nShutting down backend sidecar (PID $($backendProc.Id))..." -ForegroundColor Yellow
    if ($backendProc -and -not $backendProc.HasExited) {
        taskkill /F /T /PID $backendProc.Id 2>$null
        Start-Sleep -Milliseconds 300
    }
    
    # Backstop orphan cleanup: ensure port 24125 is completely freed
    $orphan = Get-NetTCPConnection -LocalPort 24125 -ErrorAction SilentlyContinue
    if ($orphan) {
        Write-Host "Terminating orphaned process on port 24125 (PID $($orphan.OwningProcess))..." -ForegroundColor Yellow
        taskkill /F /T /PID $orphan.OwningProcess 2>$null
    }
    Set-Location $rootDir
    Write-Host "Shutdown complete. All processes cleaned up." -ForegroundColor Green
}
