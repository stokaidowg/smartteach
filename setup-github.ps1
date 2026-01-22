# Install Git and Setup GitHub Repository
# This script will install Git and configure your repository

Write-Host "`n=== SmartTeach GitHub Setup ===" -ForegroundColor Cyan
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "1. Install Git (if not already installed)" -ForegroundColor Yellow
Write-Host "2. Initialize your repository" -ForegroundColor Yellow
Write-Host "3. Create initial commit" -ForegroundColor Yellow
Write-Host "4. Help you push to GitHub`n" -ForegroundColor Yellow

# Check if Git is installed
$gitInstalled = $null
try {
    $gitInstalled = Get-Command git -ErrorAction SilentlyContinue
} catch {}

if (-not $gitInstalled) {
    Write-Host "Git is not installed. Installing Git..." -ForegroundColor Yellow
    Write-Host "`nChoose installation method:" -ForegroundColor Cyan
    Write-Host "1. Install via winget (recommended - faster)" -ForegroundColor Green
    Write-Host "2. Download installer manually" -ForegroundColor Yellow
    
    $choice = Read-Host "`nEnter choice (1 or 2)"
    
    if ($choice -eq "1") {
        Write-Host "`nInstalling Git via winget..." -ForegroundColor Green
        try {
            winget install --id Git.Git -e --source winget --silent
            Write-Host "✅ Git installed successfully!" -ForegroundColor Green
            Write-Host "`n⚠️  IMPORTANT: Close this PowerShell window and open a new one for Git to work." -ForegroundColor Yellow
            Write-Host "Then run this script again." -ForegroundColor Yellow
            Write-Host "`nPress any key to exit..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            exit 0
        } catch {
            Write-Host "❌ Failed to install via winget. Trying alternative method..." -ForegroundColor Red
        }
    }
    
    # Manual download option
    Write-Host "`nOpening Git download page..." -ForegroundColor Yellow
    Start-Process "https://git-scm.com/download/win"
    Write-Host "`nPlease:" -ForegroundColor Cyan
    Write-Host "1. Download and install Git from the browser" -ForegroundColor White
    Write-Host "2. Use default options during installation" -ForegroundColor White
    Write-Host "3. After installation, RESTART PowerShell" -ForegroundColor Yellow
    Write-Host "4. Run this script again`n" -ForegroundColor White
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 0
}

Write-Host "✅ Git is installed`n" -ForegroundColor Green

# Navigate to project directory
Set-Location F:\Projects\School-Management\SmartTeach

# Get GitHub username and repo name
Write-Host "=== GitHub Repository Configuration ===" -ForegroundColor Cyan
$username = Read-Host "Enter your GitHub username"
$repoName = Read-Host "Enter repository name (e.g., SmartTeach)"

if ([string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrWhiteSpace($repoName)) {
    Write-Host "`n❌ Username and repository name are required!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Setting up Git repository ===" -ForegroundColor Cyan

# Check if .git exists
if (Test-Path .git) {
    Write-Host "⚠️  Git repository already exists" -ForegroundColor Yellow
    $reinit = Read-Host "Do you want to reinitialize? (yes/no)"
    if ($reinit -eq "yes") {
        Remove-Item .git -Recurse -Force
        git init
        Write-Host "✅ Repository reinitialized" -ForegroundColor Green
    }
} else {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Repository initialized" -ForegroundColor Green
}

# Configure Git user (if not already configured)
$gitUser = git config --global user.name
if ([string]::IsNullOrWhiteSpace($gitUser)) {
    Write-Host "`nGit user not configured. Let's set it up:" -ForegroundColor Yellow
    $name = Read-Host "Enter your name"
    $email = Read-Host "Enter your email"
    git config --global user.name "$name"
    git config --global user.email "$email"
    Write-Host "✅ Git user configured" -ForegroundColor Green
}

# Create .gitignore
Write-Host "`nCreating .gitignore..." -ForegroundColor Yellow
@"
# Dependencies
node_modules/
school-management-system/node_modules/
school-management-system/client/node_modules/

# Build outputs
school-management-system/client/build/
school-management-system/dist/

# Logs
*.log
npm-debug.log*

# Environment variables
.env
.env.local

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp

# Temporary files
*.tmp
"@ | Out-File -FilePath .gitignore -Encoding UTF8 -NoNewline
Write-Host "✅ .gitignore created" -ForegroundColor Green

# Stage files
Write-Host "`nStaging files..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files staged" -ForegroundColor Green

# Commit
Write-Host "`nCreating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: SmartTeach School Management System with normalized data structure"
Write-Host "✅ Initial commit created" -ForegroundColor Green

# Check if remote already exists
$remoteExists = git remote | Select-String -Pattern "origin"
if ($remoteExists) {
    Write-Host "`n⚠️  Remote 'origin' already exists" -ForegroundColor Yellow
    git remote remove origin
}

# Add remote
Write-Host "`nAdding remote repository..." -ForegroundColor Yellow
$repoUrl = "https://github.com/$username/$repoName.git"
git remote add origin $repoUrl
Write-Host "✅ Remote added: $repoUrl" -ForegroundColor Green

# Set main branch
Write-Host "`nSetting main branch..." -ForegroundColor Yellow
git branch -M main
Write-Host "✅ Main branch set" -ForegroundColor Green

# Instructions for pushing
Write-Host "`n=== Ready to Push to GitHub ===" -ForegroundColor Cyan
Write-Host "`nBefore pushing, make sure you have:" -ForegroundColor Yellow
Write-Host "1. Created a PRIVATE repository on GitHub named: $repoName" -ForegroundColor White
Write-Host "   URL: https://github.com/new" -ForegroundColor Gray
Write-Host "2. DO NOT initialize it with README/license/gitignore" -ForegroundColor White
Write-Host "`nReady to push?" -ForegroundColor Cyan
$ready = Read-Host "Continue? (yes/no)"

if ($ready -ne "yes") {
    Write-Host "`nSetup complete. When ready, run:" -ForegroundColor Yellow
    Write-Host "  git push -u origin main" -ForegroundColor Green
    exit 0
}

Write-Host "`n=== Pushing to GitHub ===" -ForegroundColor Cyan
Write-Host "You will be prompted for authentication..." -ForegroundColor Yellow
Write-Host "`nIMPORTANT:" -ForegroundColor Red
Write-Host "- Username: Your GitHub username" -ForegroundColor White
Write-Host "- Password: Use a Personal Access Token (NOT your password)" -ForegroundColor White
Write-Host "  Get token from: https://github.com/settings/tokens" -ForegroundColor Gray
Write-Host "  Token needs 'repo' scope`n" -ForegroundColor Gray

# Push
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "`nView your repository at:" -ForegroundColor Cyan
    Write-Host "https://github.com/$username/$repoName" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Push failed. Common issues:" -ForegroundColor Yellow
    Write-Host "1. Repository doesn't exist on GitHub - create it first" -ForegroundColor White
    Write-Host "2. Wrong credentials - use Personal Access Token" -ForegroundColor White
    Write-Host "3. Repository not empty - make sure you didn't initialize with README" -ForegroundColor White
    Write-Host "`nGet Personal Access Token:" -ForegroundColor Cyan
    Write-Host "https://github.com/settings/tokens/new" -ForegroundColor Gray
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
