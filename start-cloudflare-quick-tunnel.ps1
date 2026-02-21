# Script de Démarrage Rapide Cloudflare Tunnel (Sans Authentification)
# Ce script démarre un tunnel temporaire sans configuration

Write-Host "🚀 Démarrage Cloudflare Quick Tunnel" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le backend tourne sur port 3005
Write-Host "🔍 Vérification du backend local..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend local accessible sur port 3005" -ForegroundColor Green
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($healthData.status)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ ERREUR: Le backend ne répond pas sur port 3005" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Pour démarrer le backend:" -ForegroundColor Yellow
    Write-Host "   1. Ouvre un nouveau terminal" -ForegroundColor White
    Write-Host "   2. cd backend" -ForegroundColor White
    Write-Host "   3. bun run dev" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Veux-tu continuer quand même? (o/n)"
    if ($continue -ne "o") {
        exit 1
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🌐 QUICK TUNNEL - Mode Rapide (Sans Authentification)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Caractéristiques:" -ForegroundColor Yellow
Write-Host "   ✅ Pas besoin de compte Cloudflare" -ForegroundColor Green
Write-Host "   ✅ Démarrage instantané" -ForegroundColor Green
Write-Host "   ✅ URL HTTPS automatique" -ForegroundColor Green
Write-Host "   ⚠️  URL temporaire (change à chaque redémarrage)" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT:" -ForegroundColor Yellow
Write-Host "   Une URL va s'afficher comme:" -ForegroundColor White
Write-Host "   https://abc-def-ghi.trycloudflare.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "   📝 COPIE CETTE URL - tu en auras besoin!" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Pour arrêter le tunnel: Ctrl+C" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Read-Host "Appuie sur Entrée pour démarrer le tunnel"

Write-Host ""
Write-Host "🚀 Démarrage du tunnel..." -ForegroundColor Green
Write-Host ""

# Démarrer le quick tunnel
.\cloudflared.exe tunnel --url http://localhost:3005
