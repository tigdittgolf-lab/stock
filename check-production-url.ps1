#!/usr/bin/env pwsh

# Check Production URL Status
Write-Host "🔍 Checking Production URL Status..." -ForegroundColor Green

$MAIN_URL = "https://frontend-iota-six-72.vercel.app"

Write-Host "" -ForegroundColor White
Write-Host "📍 Main Production URL: $MAIN_URL" -ForegroundColor Cyan

# Test the main URL
Write-Host "🌐 Testing main URL..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $MAIN_URL -Method Head -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Main URL is ACTIVE and working!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Main URL returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Main URL is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "" -ForegroundColor White
Write-Host "📋 URL Information:" -ForegroundColor Yellow
Write-Host "• Main Production URL: $MAIN_URL" -ForegroundColor White
Write-Host "• This URL should always work for production access" -ForegroundColor White
Write-Host "• Temporary URLs are for preview/testing only" -ForegroundColor White

Write-Host "" -ForegroundColor White
Write-Host "🎯 Use this URL for:" -ForegroundColor Yellow
Write-Host "• Production access" -ForegroundColor White
Write-Host "• Sharing with users" -ForegroundColor White
Write-Host "• Bookmarking" -ForegroundColor White
Write-Host "• Mobile access" -ForegroundColor White

Write-Host "" -ForegroundColor White
Write-Host "🔗 Copy this URL: $MAIN_URL" -ForegroundColor Cyan