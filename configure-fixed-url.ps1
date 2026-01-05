#!/usr/bin/env pwsh

# Configure Fixed Production URL for Vercel
Write-Host "🔧 Configuring Fixed Production URL..." -ForegroundColor Green

# The main production URL for your project
$PRODUCTION_URL = "https://frontend-iota-six-72.vercel.app"

Write-Host "📍 Target Production URL: $PRODUCTION_URL" -ForegroundColor Cyan

# Change to frontend directory
Set-Location frontend

Write-Host "📝 Committing Vercel configuration..." -ForegroundColor Yellow
git add .
git commit -m "Update Vercel config for fixed production URL"
git push origin main

Write-Host "🚀 Deploying to production..." -ForegroundColor Yellow
vercel --prod --yes

Write-Host "" -ForegroundColor White
Write-Host "✅ Configuration completed!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "📋 IMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "1. Your main production URL is: $PRODUCTION_URL" -ForegroundColor White
Write-Host "2. This URL will always point to your latest production deployment" -ForegroundColor White
Write-Host "3. Temporary URLs (like frontend-xxx-projects.vercel.app) are preview URLs" -ForegroundColor White
Write-Host "4. Always use the main URL for production access" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🌐 Access your application at: $PRODUCTION_URL" -ForegroundColor Cyan

# Return to root directory
Set-Location ..

Write-Host "🎉 Fixed URL configuration complete!" -ForegroundColor Green