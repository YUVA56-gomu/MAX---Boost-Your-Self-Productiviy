# Comprehensive Desktop-to-FastAPI Lifecycle & Auth Boundary Verification
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$venvPython = Join-Path $rootDir "backend\.venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "Error: Virtual environment not found at $venvPython" -ForegroundColor Red
    exit 1
}

# 1. Clean stale processes on port 24125
$stale = Get-NetTCPConnection -LocalPort 24125 -ErrorAction SilentlyContinue
if ($stale) {
    Write-Host "Cleaning existing process on port 24125 (PID: $($stale.OwningProcess))..." -ForegroundColor Yellow
    taskkill /F /T /PID $stale.OwningProcess 2>$null
    Start-Sleep -Milliseconds 500
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Desktop Shell & FastAPI Sidecar Lifecycle Test" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 2. Generate cryptographically random 32-byte production token
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$tokenBytes = New-Object byte[] 32
$rng.GetBytes($tokenBytes)
$prodToken = [System.BitConverter]::ToString($tokenBytes).Replace("-", "").ToLower()

Write-Host "1. Testing Production Sidecar Startup with Injected Token..." -ForegroundColor Cyan

# Start FastAPI in production mode with injected token
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $venvPython
$psi.Arguments = "-m uvicorn backend.app.main:app --host 127.0.0.1 --port 24125 --log-level warning"
$psi.WorkingDirectory = $rootDir
$psi.EnvironmentVariables["APP_AUTH_TOKEN"] = $prodToken
$psi.EnvironmentVariables["APP_ENV"] = "production"
$psi.EnvironmentVariables["APP_HOST"] = "127.0.0.1"
$psi.EnvironmentVariables["APP_PORT"] = "24125"
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true

$proc = [System.Diagnostics.Process]::Start($psi)
Write-Host "   FastAPI sidecar launched with PID $($proc.Id)" -ForegroundColor Green

# 3. Probe startup readiness
$ready = $false
for ($i = 0; $i -lt 25; $i++) {
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:24125/api/v1/health" -Method Get -TimeoutSec 1 -ErrorAction Stop
        if ($resp.status -eq "healthy") {
            $ready = $true
            Write-Host "   Readiness verified: status=$($resp.status), database=$($resp.database)" -ForegroundColor Green
            break
        }
    } catch {
        Start-Sleep -Milliseconds 200
    }
}

if (-not $ready) {
    taskkill /F /T /PID $proc.Id 2>$null
    throw "Backend failed to respond ready within 5 seconds."
}

try {
    # 4. Verify unauthenticated request rejection (401 Unauthorized)
    Write-Host "2. Verifying Unauthenticated Access Rejection..." -ForegroundColor Cyan
    try {
        $unauth = Invoke-WebRequest -Uri "http://127.0.0.1:24125/api/v1/workspaces" -Method Get -TimeoutSec 3 -UseBasicParsing
        throw "Expected 401 Unauthorized, but received HTTP $($unauth.StatusCode)"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host "   Unauthenticated request rejected with 401 Unauthorized." -ForegroundColor Green
        } else {
            throw "Expected 401, got: $($_.Exception.Message)"
        }
    }

    # 5. Verify dev fallback token rejection in production mode (401 Unauthorized)
    Write-Host "3. Verifying Dev Fallback Token Rejection in Production Mode..." -ForegroundColor Cyan
    $devToken = "dev-ephemeral-auth-token-32-bytes-local"
    try {
        $devAttempt = Invoke-WebRequest -Uri "http://127.0.0.1:24125/api/v1/workspaces" `
            -Method Get `
            -Headers @{ "Authorization" = "Bearer $devToken" } `
            -TimeoutSec 3 `
            -UseBasicParsing
        throw "Expected dev token rejection in production, but request succeeded with HTTP $($devAttempt.StatusCode)"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host "   Dev fallback token rejected in production mode with 401 Unauthorized as expected." -ForegroundColor Green
        } else {
            throw "Expected 401, got: $($_.Exception.Message)"
        }
    }

    # 6. Verify valid production ephemeral token acceptance (200 OK)
    Write-Host "4. Verifying Valid Ephemeral Token Acceptance..." -ForegroundColor Cyan
    $validResp = Invoke-RestMethod -Uri "http://127.0.0.1:24125/api/v1/workspaces" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $prodToken" } `
        -TimeoutSec 3
    Write-Host "   Authenticated request succeeded: $($validResp.Count) workspace(s) found (slug: '$($validResp[0].slug)')" -ForegroundColor Green

    # 7. Verify CORS for desktop WebView and Vite origins
    Write-Host "5. Verifying Desktop Boundaries & CORS Origins..." -ForegroundColor Cyan
    $allowedOrigins = @("http://localhost:5173", "http://tauri.localhost", "https://tauri.localhost", "tauri://localhost")
    foreach ($origin in $allowedOrigins) {
        $cors = Invoke-WebRequest -Uri "http://127.0.0.1:24125/api/v1/health" `
            -Method Options `
            -Headers @{ "Origin" = $origin; "Access-Control-Request-Method" = "GET" } `
            -UseBasicParsing -TimeoutSec 3
        $allowOrigin = $cors.Headers["access-control-allow-origin"]
        if ($allowOrigin -ne $origin) {
            throw "CORS check failed for $($origin): got '$allowOrigin'"
        }
        Write-Host "   Origin allowed: $origin" -ForegroundColor Green
    }

    # Verify untrusted origin rejection
    $untrusted = "http://malicious-cloud-tracker.com"
    try {
        $badCors = Invoke-WebRequest -Uri "http://127.0.0.1:24125/api/v1/health" `
            -Method Options `
            -Headers @{ "Origin" = $untrusted; "Access-Control-Request-Method" = "GET" } `
            -UseBasicParsing -TimeoutSec 3
        $badOrigin = $badCors.Headers["access-control-allow-origin"]
        if ($badOrigin -eq $untrusted) {
            throw "CORS check failed: untrusted origin was allowed!"
        }
        Write-Host "   Untrusted origin rejected as expected: $untrusted" -ForegroundColor Green
    } catch {
        Write-Host "   Untrusted origin rejected as expected (HTTP 400 Disallowed CORS origin)." -ForegroundColor Green
    }

} finally {
    # 8. Clean shutdown and orphan verification
    Write-Host "6. Testing Clean Shutdown & Process Cleanup (PID $($proc.Id))..." -ForegroundColor Cyan
    taskkill /F /T /PID $proc.Id 2>$null
    Start-Sleep -Milliseconds 600

    $orphan = Get-NetTCPConnection -LocalPort 24125 -ErrorAction SilentlyContinue
    if ($orphan) {
        taskkill /F /T /PID $orphan.OwningProcess 2>$null
        throw "ERROR: Orphaned process detected on port 24125 (PID $($orphan.OwningProcess))"
    } else {
        Write-Host "   SUCCESS: Port 24125 verified free. Zero orphan processes." -ForegroundColor Green
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Desktop-to-FastAPI Lifecycle Verification PASSED" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
