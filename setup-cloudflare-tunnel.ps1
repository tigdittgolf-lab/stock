# Script de Configuration Cloudflare Tunnel
# Ce script configure un tunnel Cloudflare pour exposer le backend local

Write-Host "🚀 Configuration Cloudflare Tunnel pour Backend" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le backend tourne sur port 3005
Write-Host "🔍 Vérification du backend local..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend local accessible sur port 3005" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ ERREUR: Le backend ne répond pas sur port 3005" -ForegroundColor Red
    Write-Host "   Assure-toi que le backend tourne avec: cd backend && bun run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Étapes de configuration:" -ForegroundColor Cyan
Write-Host "1. Connexion à Cloudflare (ouvrira ton navigateur)" -ForegroundColor White
Write-Host "2. Création du tunnel 'backend-stock'" -ForegroundColor White
Write-Host "3. Démarrage du tunnel" -ForegroundColor White
Write-Host ""

# Étape 1: Login Cloudflare
Write-Host "🔐 Étape 1: Connexion à Cloudflare..." -ForegroundColor Yellow
Write-Host "   Une page web va s'ouvrir. Connecte-toi avec ton compte Cloudflare." -ForegroundColor White
Write-Host "   Si tu n'as pas de compte, crée-en un gratuitement sur cloudflare.com" -ForegroundColor White
Write-Host ""
Read-Host "Appuie sur Entrée pour continuer"

.\cloudflared.exe tunnel login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la connexion à Cloudflare" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Connexion réussie!" -ForegroundColor Green
Write-Host ""

# Étape 2: Créer le tunnel
Write-Host "🔧 Étape 2: Création du tunnel 'backend-stock'..." -ForegroundColor Yellow

# Vérifier si le tunnel existe déjà
$existingTunnel = .\cloudflared.exe tunnel list 2>&1 | Select-String "backend-stock"

if ($existingTunnel) {
    Write-Host "⚠️  Le tunnel 'backend-stock' existe déjà" -ForegroundColor Yellow
    Write-Host "   Utilisation du tunnel existant..." -ForegroundColor White
} else {
    .\cloudflared.exe tunnel create backend-stock
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de la création du tunnel" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Tunnel créé avec succès!" -ForegroundColor Green
}

Write-Host ""

# Étape 3: Obtenir l'URL du tunnel
Write-Host "🌐 Étape 3: Démarrage du tunnel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT: Le tunnel va démarrer en mode interactif" -ForegroundColor Yellow
Write-Host "   Tu verras une URL comme: https://backend-stock-xyz.trycloudflare.com" -ForegroundColor White
Write-Host "   COPIE CETTE URL - tu en auras besoin pour configurer le frontend!" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Pour arrêter le tunnel: Ctrl+C" -ForegroundColor White
Write-Host ""
Read-Host "Appuie sur Entrée pour démarrer le tunnel"

Write-Host ""
Write-Host "🚀 Démarrage du tunnel..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Démarrer le tunnel
.\cloudflared.exe tunnel --url http://localhost:3005 run backend-stock
