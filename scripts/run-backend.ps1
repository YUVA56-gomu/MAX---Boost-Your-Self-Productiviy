# Script to run FastAPI backend sidecar in development mode
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir

$venvPython = Join-Path $rootDir "backend\.venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "Error: Virtual environment not found at $venvPython" -ForegroundColor Red
    Write-Host "Run 'uv venv backend/.venv --python 3.14' and install dependencies first." -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting Adaptive Productivity Backend on 127.0.0.1:24125..." -ForegroundColor Cyan
& $venvPython -m uvicorn backend.app.main:app --host 127.0.0.1 --port 24125 --reload
