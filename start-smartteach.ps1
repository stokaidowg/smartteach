# SmartTeach School Management System - Startup Script
# This script starts both the backend server and frontend client

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  SmartTeach School Management System" -ForegroundColor Cyan
Write-Host "  Starting Application..." -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "school-management-system"
$clientPath = Join-Path $backendPath "client"

# Check if Node.js is installed
Write-Host "[1/6] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "      Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "      ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "      Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is running
Write-Host "[2/6] Checking PostgreSQL connection..." -ForegroundColor Yellow
try {
    $pgTest = psql -U postgres -d smartTeach -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      PostgreSQL is running and smartTeach database exists" -ForegroundColor Green
    } else {
        Write-Host "      WARNING: Cannot connect to smartTeach database" -ForegroundColor Yellow
        Write-Host "      Make sure PostgreSQL is running and database is created" -ForegroundColor Yellow
    }
} catch {
    Write-Host "      WARNING: psql command not found. PostgreSQL may not be in PATH" -ForegroundColor Yellow
}

# Install backend dependencies if needed
Write-Host "[3/6] Checking backend dependencies..." -ForegroundColor Yellow
Set-Location $backendPath
if (-Not (Test-Path "node_modules")) {
    Write-Host "      Installing backend dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "      ERROR: Failed to install backend dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "      Backend dependencies already installed" -ForegroundColor Green
}

# Install frontend dependencies if needed
Write-Host "[4/6] Checking frontend dependencies..." -ForegroundColor Yellow
Set-Location $clientPath
if (-Not (Test-Path "node_modules")) {
    Write-Host "      Installing frontend dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "      ERROR: Failed to install frontend dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "      Frontend dependencies already installed" -ForegroundColor Green
}

# Start the backend server in a new window
Write-Host "[5/6] Starting backend server..." -ForegroundColor Yellow
Set-Location $backendPath
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Starting Backend Server on http://localhost:3000' -ForegroundColor Cyan; npm run dev" -PassThru
Start-Sleep -Seconds 3
Write-Host "      Backend server starting in new window (PID: $($backendJob.Id))" -ForegroundColor Green

# Start the frontend client in a new window
Write-Host "[6/6] Starting frontend client..." -ForegroundColor Yellow
Set-Location $clientPath
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$clientPath'; Write-Host 'Starting Frontend Client on http://localhost:3001' -ForegroundColor Cyan; npm start" -PassThru
Start-Sleep -Seconds 2
Write-Host "      Frontend client starting in new window (PID: $($frontendJob.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "================================================="" -ForegroundColor Green
Write-Host "  SmartTeach is starting up!" -ForegroundColor Green
Write-Host "================================================="" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend UI:  http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Two PowerShell windows have been opened:" -ForegroundColor Yellow
Write-Host "  1. Backend Server (Port 3000)" -ForegroundColor White
Write-Host "  2. Frontend Client (Port 3001)" -ForegroundColor White
Write-Host ""
Write-Host "The browser should open automatically in a few seconds..." -ForegroundColor Yellow
Write-Host "If not, manually navigate to: http://localhost:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop the servers:" -ForegroundColor Yellow
Write-Host "  - Close both PowerShell windows, or" -ForegroundColor White
Write-Host "  - Press Ctrl+C in each window" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
