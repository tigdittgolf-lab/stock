# Script de configuration Vercel pour la production
# Configure les variables d'environnement necessaires

Write-Host "🚀 Configuration Vercel Production" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Verifier si Vercel CLI est installe
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI detecte" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI non installe. Installer avec: npm i -g vercel" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Variables d'environnement a configurer:" -ForegroundColor Yellow
Write-Host "- SUPABASE_URL" -ForegroundColor Cyan
Write-Host "- SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Cyan
Write-Host "- NODE_ENV" -ForegroundColor Cyan

Write-Host ""
Write-Host "💡 Vous pouvez trouver ces valeurs dans votre dashboard Supabase:" -ForegroundColor Yellow
Write-Host "   https://app.supabase.com/project/YOUR_PROJECT/settings/api" -ForegroundColor Blue

Write-Host ""
$continue = Read-Host "Continuer la configuration? (y/N)"

if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Configuration annulee." -ForegroundColor Yellow
    exit 0
}

# Configuration NODE_ENV
Write-Host ""
Write-Host "🔧 Configuration NODE_ENV..." -ForegroundColor Green
Set-Location frontend
vercel env add NODE_ENV production

# Configuration SUPABASE_URL
Write-Host ""
Write-Host "🔧 Configuration SUPABASE_URL..." -ForegroundColor Green
Write-Host "Format: https://your-project-id.supabase.co" -ForegroundColor Yellow
vercel env add SUPABASE_URL

# Configuration SUPABASE_SERVICE_ROLE_KEY
Write-Host ""
Write-Host "🔧 Configuration SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Green
Write-Host "⚠️  Attention: Utilisez la cle SERVICE ROLE (pas la cle publique)" -ForegroundColor Red
vercel env add SUPABASE_SERVICE_ROLE_KEY

Write-Host ""
Write-Host "✅ Configuration terminee!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Redeploiement en cours..." -ForegroundColor Green
vercel --prod

Write-Host ""
Write-Host "🎯 Configuration terminee avec succes!" -ForegroundColor Green
Write-Host "📱 Votre application est maintenant fonctionnelle en production" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Note: En production, seule la base Supabase est disponible" -ForegroundColor Yellow
Write-Host "   Le switch MySQL/PostgreSQL reste une fonctionnalite locale" -ForegroundColor Yellow