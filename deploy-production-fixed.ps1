#!/usr/bin/env pwsh

# Deploy to Fixed Production URL Script
# This ensures deployment always goes to the main production URL

Write-Host "🚀 Deploying to Fixed Production URL..." -ForegroundColor Green
Write-Host "📍 Target URL: https://frontend-iota-six-72.vercel.app" -ForegroundColor Cyan

# Change to frontend directory
Set-Location frontend

# Git operations
Write-Host "📝 Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "Deploy to fixed production URL - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Write-Host "📤 Pushing to repository..." -ForegroundColor Yellow
git push origin main

# Deploy to Vercel with production flag
Write-Host "🔧 Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod --yes

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "🌐 Production URL: https://frontend-iota-six-72.vercel.app" -ForegroundColor Cyan
Write-Host "⏰ Deployment time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# Return to root directory
Set-Location ..

Write-Host "🎉 Fixed production deployment successful!" -ForegroundColor Green