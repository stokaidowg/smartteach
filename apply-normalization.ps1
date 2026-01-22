# Apply Database Normalization Schema
# Run this script to create the normalized tables

Write-Host "Applying database normalization schema..." -ForegroundColor Cyan

# Check if database-normalization.sql exists
if (-not (Test-Path ".\database-normalization.sql")) {
    Write-Host "Error: database-normalization.sql not found!" -ForegroundColor Red
    Write-Host "Please make sure you're in the correct directory." -ForegroundColor Yellow
    exit 1
}

# Run the SQL script
Write-Host "Creating normalized tables..." -ForegroundColor Yellow
psql -U postgres -d smartTeach -f .\database-normalization.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccess! Normalized tables created." -ForegroundColor Green
    Write-Host "`nVerifying tables..." -ForegroundColor Cyan
    
    # Verify tables were created
    psql -U postgres -d smartTeach -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('global_list_categories', 'global_list_items', 'year_groups', 'houses', 'forms', 'departments') ORDER BY table_name;"
    
    Write-Host "`nShowing data counts..." -ForegroundColor Cyan
    psql -U postgres -d smartTeach -f .\check-normalized-tables.sql
    
    Write-Host "`nNormalization schema applied successfully!" -ForegroundColor Green
    Write-Host "You can now use the Global Lists and Academic Structure features." -ForegroundColor Cyan
} else {
    Write-Host "`nError applying normalization schema." -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
