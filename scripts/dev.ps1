# Script to launch both backend and frontend development servers concurrently
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir

$venvPython = Join-Path $rootDir "backend\.venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "Error: Virtual environment not found at $venvPython" -ForegroundColor Red
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Dual-Runtime Development Environment" -ForegroundColor Cyan
Write-Host "  Backend:  http://127.0.0.1:24125 (FastAPI)" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173  (Vite + React)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Start backend in a background job
$backendJob = Start-Job -ScriptBlock {
    param($dir, $py)
    Set-Location $dir
    & $py -m uvicorn backend.app.main:app --host 127.0.0.1 --port 24125 --reload
} -ArgumentList $rootDir, $venvPython

try {
    # Start frontend interactively in the foreground
    Set-Location (Join-Path $rootDir "frontend")
    & pnpm dev
}
finally {
    Write-Host "Shutting down backend sidecar job..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Set-Location $rootDir
}
