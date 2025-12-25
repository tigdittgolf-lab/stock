# Configuration Vercel Production - Version Simple
Write-Host "Configuration Vercel Production" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

# Verifier Vercel CLI
try {
    vercel --version | Out-Null
    Write-Host "Vercel CLI detecte" -ForegroundColor Green
} catch {
    Write-Host "Vercel CLI manquant. Installer: npm i -g vercel" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Variables a configurer:" -ForegroundColor Yellow
Write-Host "- SUPABASE_URL" -ForegroundColor Cyan
Write-Host "- SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Cyan
Write-Host "- NODE_ENV" -ForegroundColor Cyan

Write-Host ""
Write-Host "Dashboard Supabase: https://app.supabase.com" -ForegroundColor Blue

Write-Host ""
$continue = Read-Host "Continuer? (y/N)"

if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Annule" -ForegroundColor Yellow
    exit 0
}

# Aller dans le dossier frontend
Set-Location frontend

# Configuration des variables
Write-Host ""
Write-Host "Configuration NODE_ENV..." -ForegroundColor Green
echo "production" | vercel env add NODE_ENV

Write-Host ""
Write-Host "Configuration SUPABASE_URL..." -ForegroundColor Green
Write-Host "Format: https://your-project-id.supabase.co" -ForegroundColor Yellow
vercel env add SUPABASE_URL

Write-Host ""
Write-Host "Configuration SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Green
Write-Host "ATTENTION: Cle SERVICE ROLE (pas publique)" -ForegroundColor Red
vercel env add SUPABASE_SERVICE_ROLE_KEY

Write-Host ""
Write-Host "Redeploiement..." -ForegroundColor Green
vercel --prod

Write-Host ""
Write-Host "Configuration terminee!" -ForegroundColor Green