# Pre-Commit Checklist for Multi-Agent Development
# Run this before committing any changes

Write-Host "🔍 Pre-Commit Checklist for Multi-Agent Development" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$Failures = 0

# Function to check if file is critical
function Is-CriticalFile {
    param($File)
    
    $criticalPatterns = @(
        "*backend/app/services/oms_execution.py*",
        "*backend/app/services/risk_engine.py*",
        "*backend/app/services/portfolio_engine.py*",
        "*backend/app/services/engine_runner.py*",
        "*backend/app/database.py*",
        "*supabase/migrations/*.sql",
        "*supabase/functions/_shared/*"
    )
    
    foreach ($pattern in $criticalPatterns) {
        if ($File -like $pattern) {
            return $true
        }
    }
    
    return $false
}

# Get staged files
$stagedFiles = git diff --cached --name-only

# Check 1: Activity Log Updated
Write-Host "📝 Check 1: Activity Log Updated" -ForegroundColor Yellow
if ($stagedFiles -match "docs/AGENT_ACTIVITY_LOG.md") {
    Write-Host "✅ Activity log updated" -ForegroundColor Green
} else {
    Write-Host "❌ Activity log NOT updated" -ForegroundColor Red
    Write-Host "   Please update docs/AGENT_ACTIVITY_LOG.md before committing" -ForegroundColor Red
    $Failures++
}
Write-Host ""

# Check 2: Change Log Updated
Write-Host "📋 Check 2: Change Log Updated" -ForegroundColor Yellow
if ($stagedFiles -match "docs/CHANGE_LOG.md") {
    Write-Host "✅ Change log updated" -ForegroundColor Green
} else {
    Write-Host "⚠️  Change log NOT updated" -ForegroundColor Yellow
    Write-Host "   Consider updating docs/CHANGE_LOG.md for significant changes" -ForegroundColor Yellow
}
Write-Host ""

# Check 3: Critical Files Modified
Write-Host "🔒 Check 3: Critical Files Modified" -ForegroundColor Yellow
$criticalFilesModified = 0
foreach ($file in $stagedFiles) {
    if (Is-CriticalFile $file) {
        Write-Host "⚠️  CRITICAL FILE: $file" -ForegroundColor Red
        $criticalFilesModified++
    }
}

if ($criticalFilesModified -gt 0) {
    Write-Host "❌ $criticalFilesModified critical file(s) modified" -ForegroundColor Red
    Write-Host "   Did you get user approval?" -ForegroundColor Red
    Write-Host "   Did you create backups?" -ForegroundColor Red
    Write-Host "   Did you test thoroughly?" -ForegroundColor Red
    $response = Read-Host "   Continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "   Commit aborted" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ No critical files modified" -ForegroundColor Green
}
Write-Host ""

# Check 4: Tests Run
Write-Host "🧪 Check 4: Tests Run" -ForegroundColor Yellow
if (Test-Path "backend") {
    Write-Host "   Running backend tests..." -ForegroundColor Gray
    Push-Location backend
    try {
        $testResult = python -m pytest tests/ -v --tb=short 2>&1 | Select-Object -Last 20
        Write-Host $testResult
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backend tests passed" -ForegroundColor Green
        } else {
            Write-Host "❌ Backend tests failed" -ForegroundColor Red
            $Failures++
        }
    } finally {
        Pop-Location
    }
}

if (Test-Path "package.json") {
    Write-Host "   Running frontend type check..." -ForegroundColor Gray
    $typeCheckResult = npm run type-check 2>&1 | Select-Object -Last 10
    Write-Host $typeCheckResult
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend type check passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend type check failed" -ForegroundColor Red
        $Failures++
    }
}
Write-Host ""

# Check 5: No Secrets in Commit
Write-Host "🔐 Check 5: No Secrets in Commit" -ForegroundColor Yellow
$secretsFound = 0
foreach ($file in $stagedFiles) {
    $diff = git diff --cached $file
    if ($diff -match "(?i)(api[_-]?key|secret|password|token|private[_-]?key)" -and $diff -notmatch "#" -and $diff -notmatch "//") {
        Write-Host "⚠️  Possible secret in: $file" -ForegroundColor Red
        $secretsFound++
    }
}

if ($secretsFound -gt 0) {
    Write-Host "❌ Possible secrets found in $secretsFound file(s)" -ForegroundColor Red
    Write-Host "   Review carefully before committing" -ForegroundColor Red
    $Failures++
} else {
    Write-Host "✅ No obvious secrets detected" -ForegroundColor Green
}
Write-Host ""

# Check 6: Backup Created for Critical Files
Write-Host "💾 Check 6: Backups Created" -ForegroundColor Yellow
$backupsNeeded = 0
foreach ($file in $stagedFiles) {
    if (Is-CriticalFile $file) {
        $backupFile = "$file.backup.$(Get-Date -Format 'yyyyMMdd')"
        if (-not (Test-Path $backupFile)) {
            Write-Host "⚠️  No backup for: $file" -ForegroundColor Yellow
            $backupsNeeded++
        }
    }
}

if ($backupsNeeded -gt 0) {
    Write-Host "⚠️  $backupsNeeded critical file(s) without backups" -ForegroundColor Yellow
    Write-Host "   Consider creating backups with:" -ForegroundColor Yellow
    Write-Host "   Copy-Item <file> <file>.backup.`$(Get-Date -Format 'yyyyMMdd_HHmmss')" -ForegroundColor Yellow
} else {
    Write-Host "✅ Backups check passed" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📊 Summary" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if ($Failures -eq 0) {
    Write-Host "✅ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to commit. Remember to:" -ForegroundColor Green
    Write-Host "1. Push to feature branch first" -ForegroundColor Green
    Write-Host "2. Test in staging before production" -ForegroundColor Green
    Write-Host "3. Monitor logs after deployment" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ $Failures check(s) failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please address the issues above before committing." -ForegroundColor Red
    exit 1
}

