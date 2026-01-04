# AKIVA AI - Start Both Trading Bots
# Run this script to start both strategies trading 24/7

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AKIVA AI - Dual Bot Trading System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if freqtrade is installed
if (!(Get-Command freqtrade -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: freqtrade not found. Please install it first." -ForegroundColor Red
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "Starting Bot 1: WhaleFlowScalper (97.8% win rate)..." -ForegroundColor Green
Start-Process -FilePath "freqtrade" -ArgumentList "trade", "-c", "user_data/config_futures.json", "--strategy", "WhaleFlowScalper" -WindowStyle Normal

Start-Sleep -Seconds 5

Write-Host "Starting Bot 2: HighWinRateScalper (100% win rate)..." -ForegroundColor Green
Start-Process -FilePath "freqtrade" -ArgumentList "trade", "-c", "user_data/config_futures_bot2.json", "--strategy", "HighWinRateScalper" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Both bots are now running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Web UIs:" -ForegroundColor Yellow
Write-Host "  - WhaleFlowScalper:    http://localhost:8080" -ForegroundColor White
Write-Host "  - HighWinRateScalper:  http://localhost:8081" -ForegroundColor White
Write-Host "  - Login: freqtrader / freqtrader" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop: Close the terminal windows or use Task Manager" -ForegroundColor Yellow

