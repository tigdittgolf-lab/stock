# Script de configuration Vercel pour la production
# Configure les variables d'environnement nécessaires

Write-Host "🚀 Configuration Vercel Production" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Vérifier si Vercel CLI est installé
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI non installé. Installer avec: npm i -g vercel" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Variables d'environnement à configurer:" -ForegroundColor Yellow
Write-Host "- SUPABASE_URL" -ForegroundColor Cyan
Write-Host "- SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Cyan
Write-Host "- NODE_ENV" -ForegroundColor Cyan

Write-Host ""
Write-Host "💡 Vous pouvez trouver ces valeurs dans votre dashboard Supabase:" -ForegroundColor Yellow
Write-Host "   https://app.supabase.com/project/YOUR_PROJECT/settings/api" -ForegroundColor Blue

Write-Host ""
$continue = Read-Host "Continuer la configuration? (y/N)"

if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Configuration annulée." -ForegroundColor Yellow
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
Write-Host "⚠️  Attention: Utilisez la clé SERVICE ROLE (pas la clé publique)" -ForegroundColor Red
vercel env add SUPABASE_SERVICE_ROLE_KEY

Write-Host ""
Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Redéploiement en cours..." -ForegroundColor Green
vercel --prod

Write-Host ""
Write-Host "🎯 Configuration terminée avec succès!" -ForegroundColor Green
Write-Host "📱 Votre application est maintenant fonctionnelle en production" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Note: En production, seule la base Supabase est disponible" -ForegroundColor Yellow
Write-Host "   Le switch MySQL/PostgreSQL reste une fonctionnalité locale" -ForegroundColor Yellow