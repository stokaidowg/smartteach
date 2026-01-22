# Instructions to Push SmartTeach to Private GitHub Repository

## Step 1: Create a Private GitHub Repository
1. Go to https://github.com/new
2. Enter a repository name (e.g., "SmartTeach")
3. Add a description (optional)
4. Select **Private**
5. DO NOT initialize with README, .gitignore, or license (we already have code)
6. Click "Create repository"

## Step 2: Initialize Git in Your Project (if not already done)
```powershell
cd F:\Projects\School-Management\SmartTeach
git init
```

## Step 3: Create .gitignore File
```powershell
# Create .gitignore to exclude sensitive and unnecessary files
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
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database passwords (if you have any config files with passwords)
# db-config.json

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Temporary files
*.tmp
*.temp
"@ | Out-File -FilePath .gitignore -Encoding UTF8
```

## Step 4: Stage All Files
```powershell
git add .
```

## Step 5: Create Initial Commit
```powershell
git commit -m "Initial commit: SmartTeach School Management System with normalized data structure"
```

## Step 6: Add Remote Repository
Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub details:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

## Step 7: Push to GitHub
```powershell
# Push to main branch
git branch -M main
git push -u origin main
```

## Step 8: Authenticate
When prompted, use one of these methods:
- **Personal Access Token (Recommended)**:
  1. Go to https://github.com/settings/tokens
  2. Generate new token (classic)
  3. Select scopes: repo (all)
  4. Copy the token
  5. Use it as your password when pushing

- **GitHub CLI**:
  ```powershell
  # Install GitHub CLI first
  winget install GitHub.cli
  
  # Authenticate
  gh auth login
  ```

## Complete PowerShell Script
Save this as `push-to-github.ps1`:

```powershell
# Configuration - UPDATE THESE
$GITHUB_USERNAME = "YOUR_USERNAME"
$REPO_NAME = "SmartTeach"

Write-Host "Setting up Git repository for SmartTeach..." -ForegroundColor Cyan

# Navigate to project directory
Set-Location F:\Projects\School-Management\SmartTeach

# Check if .git exists
if (Test-Path .git) {
    Write-Host "Git repository already initialized" -ForegroundColor Yellow
} else {
    Write-Host "Initializing Git repository..." -ForegroundColor Green
    git init
}

# Create .gitignore
Write-Host "Creating .gitignore..." -ForegroundColor Green
@"
node_modules/
school-management-system/node_modules/
school-management-system/client/node_modules/
school-management-system/client/build/
school-management-system/dist/
*.log
.env
.env.local
.DS_Store
Thumbs.db
.vscode/
.idea/
"@ | Out-File -FilePath .gitignore -Encoding UTF8

# Stage files
Write-Host "Staging files..." -ForegroundColor Green
git add .

# Commit
Write-Host "Creating initial commit..." -ForegroundColor Green
git commit -m "Initial commit: SmartTeach School Management System"

# Add remote
Write-Host "Adding remote repository..." -ForegroundColor Green
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Push
Write-Host "Pushing to GitHub..." -ForegroundColor Green
git branch -M main
git push -u origin main

Write-Host "`nDone! Your repository is now on GitHub." -ForegroundColor Cyan
Write-Host "View it at: https://github.com/$GITHUB_USERNAME/$REPO_NAME" -ForegroundColor Green
```

## Quick Reference Commands

### Daily Git Workflow
```powershell
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push

# Pull latest changes
git pull
```

### View Repository Info
```powershell
# Check remote URL
git remote -v

# View commit history
git log --oneline

# View current branch
git branch
```

### Create New Branch for Features
```powershell
# Create and switch to new branch
git checkout -b feature/new-feature-name

# Push branch to GitHub
git push -u origin feature/new-feature-name

# Switch back to main
git checkout main

# Merge feature branch
git merge feature/new-feature-name
```

## Security Notes
1. ✅ Repository is set to **Private** - only you can see it
2. ✅ `.gitignore` excludes `node_modules/` and sensitive files
3. ⚠️ **IMPORTANT**: Never commit database passwords or API keys
4. ⚠️ Review `.env` files - they should be in `.gitignore`
5. ✅ Use Personal Access Token instead of password for authentication

## Next Steps After Pushing
1. Add collaborators (if needed): Settings → Collaborators
2. Set up branch protection rules: Settings → Branches
3. Add repository description and topics
4. Create README.md with setup instructions
5. Add LICENSE file if open-sourcing later
