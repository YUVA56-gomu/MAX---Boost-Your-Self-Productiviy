# Helper script to start backend and Vite dev server for visual inspection
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$venvPython = Join-Path $rootDir "backend\.venv\Scripts\python.exe"

# Clean up stale ports
$ports = @(24125, 5173)
foreach ($port in $ports) {
    $stalePids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 4 }
    foreach ($p in $stalePids) {
        taskkill /F /T /PID $p 2>$null
    }
    Start-Sleep -Milliseconds 300
}

Write-Host "Starting backend on 127.0.0.1:24125..."
$backend = Start-Process -FilePath $venvPython -ArgumentList "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "24125", "--reload" -WorkingDirectory $rootDir -PassThru -NoNewWindow

Write-Host "Starting Vite frontend on http://localhost:5173..."
$frontend = Start-Process -FilePath "pnpm.cmd" -ArgumentList "run", "dev", "--", "--port", "5173" -WorkingDirectory (Join-Path $rootDir "frontend") -PassThru -NoNewWindow

Start-Sleep -Seconds 3

Write-Host "Dev servers active. Backend PID: $($backend.Id), Frontend PID: $($frontend.Id)"
# Keep running until cancelled
while ($true) {
    Start-Sleep -Seconds 1
}
