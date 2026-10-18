# End-to-end verification script for backend live health and clean shutdown
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$venvPython = Join-Path $rootDir "backend\.venv\Scripts\python.exe"

# Pre-clean port if needed
$stale = Get-NetTCPConnection -LocalPort 24125 -ErrorAction SilentlyContinue
if ($stale) {
    taskkill /F /T /PID $stale.OwningProcess 2>$null
    Start-Sleep -Milliseconds 300
}

Write-Host "1. Starting FastAPI backend on 127.0.0.1:24125..." -ForegroundColor Cyan
$proc = Start-Process -FilePath $venvPython -ArgumentList "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "24125" -WorkingDirectory $rootDir -PassThru -NoNewWindow

Start-Sleep -Seconds 2

try {
    Write-Host "2. Probing live GET /api/v1/health..." -ForegroundColor Cyan
    $resp = Invoke-RestMethod -Uri "http://127.0.0.1:24125/api/v1/health" -Method Get -TimeoutSec 3
    Write-Host "   status:       $($resp.status)" -ForegroundColor Green
    Write-Host "   version:      $($resp.version)" -ForegroundColor Green
    Write-Host "   database:     $($resp.database)" -ForegroundColor Green
    Write-Host "   ai_available: $($resp.ai_available)" -ForegroundColor Green
    Write-Host "   active_model: $($resp.active_model)" -ForegroundColor Green

    # Truthful checks
    if ($resp.database -ne "unconfigured") {
        throw "Truth check failed: database should be 'unconfigured' in Milestone 1, got '$($resp.database)'"
    }
    if ($resp.ai_available -ne $false) {
        throw "Truth check failed: ai_available should be false in Milestone 1 default state, got '$($resp.ai_available)'"
    }

    Write-Host "3. Testing CORS preflight from Vite dev origin http://localhost:5173..." -ForegroundColor Cyan
    $cors = Invoke-WebRequest -Uri "http://127.0.0.1:24125/api/v1/health" -Method Options -Headers @{ "Origin" = "http://localhost:5173"; "Access-Control-Request-Method" = "GET" } -UseBasicParsing -TimeoutSec 3
    $allowOrigin = $cors.Headers["access-control-allow-origin"]
    $allowMethods = $cors.Headers["access-control-allow-methods"]
    Write-Host "   access-control-allow-origin:  $allowOrigin" -ForegroundColor Green
    Write-Host "   access-control-allow-methods: $allowMethods" -ForegroundColor Green

    if ($allowOrigin -ne "http://localhost:5173") {
        throw "CORS check failed: expected allow-origin 'http://localhost:5173', got '$allowOrigin'"
    }

    Write-Host "4. Testing CORS rejection from untrusted origin http://malicious.com..." -ForegroundColor Cyan
    try {
        $badCors = Invoke-WebRequest -Uri "http://127.0.0.1:24125/api/v1/health" -Method Options -Headers @{ "Origin" = "http://malicious.com"; "Access-Control-Request-Method" = "GET" } -UseBasicParsing -TimeoutSec 3
        $badOrigin = $badCors.Headers["access-control-allow-origin"]
        if ($badOrigin -eq "http://malicious.com") {
            throw "CORS check failed: untrusted origin was unexpectedly allowed!"
        }
        Write-Host "   Untrusted origin handled without allow header: $badOrigin" -ForegroundColor Green
    } catch {
        Write-Host "   Untrusted origin rejected as expected: $($_.Exception.Message)" -ForegroundColor Green
    }
}
finally {
    Write-Host "5. Shutting down process tree (PID $($proc.Id))..." -ForegroundColor Cyan
    taskkill /F /T /PID $proc.Id
    Start-Sleep -Milliseconds 600

    $activePort = Get-NetTCPConnection -LocalPort 24125 -ErrorAction SilentlyContinue
    if ($activePort) {
        Write-Host "   ERROR: Orphaned process detected on port 24125 (PID $($activePort.OwningProcess))" -ForegroundColor Red
        taskkill /F /T /PID $activePort.OwningProcess
        exit 1
    } else {
        Write-Host "   SUCCESS: Port 24125 verified free. Zero orphaned processes." -ForegroundColor Green
    }
}
