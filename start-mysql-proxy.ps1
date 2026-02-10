# Script de démarrage du proxy MySQL pour Tailscale

Write-Host "=== DEMARRAGE PROXY MYSQL POUR TAILSCALE ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Node.js est installé
Write-Host "1. Verification Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   OK Node.js $nodeVersion installe" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR: Node.js n'est pas installe" -ForegroundColor Red
    Write-Host "   Installez Node.js depuis https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Vérifier que MySQL est accessible
Write-Host "2. Verification MySQL..." -ForegroundColor Yellow
try {
    $result = mysql -u root -P 3306 -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK MySQL accessible sur le port 3306" -ForegroundColor Green
    } else {
        Write-Host "   ERREUR: MySQL non accessible" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERREUR: MySQL non accessible" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Vérifier les dépendances npm
Write-Host "3. Verification dependances npm..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules/express")) {
    Write-Host "   Installation des dependances..." -ForegroundColor Yellow
    npm install express mysql2 cors
}
Write-Host "   OK Dependances installees" -ForegroundColor Green
Write-Host ""

# Démarrer le serveur proxy
Write-Host "4. Demarrage du serveur proxy..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=== SERVEUR PROXY DEMARRE ===" -ForegroundColor Green
Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Testez localement:" -ForegroundColor White
Write-Host "   curl http://localhost:3307/health" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Activez Tailscale Funnel (dans un autre terminal):" -ForegroundColor White
Write-Host "   tailscale funnel 3307" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Obtenez l'URL publique:" -ForegroundColor White
Write-Host "   tailscale status" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Configurez Vercel avec l'URL Tailscale" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arreter le serveur" -ForegroundColor Yellow
Write-Host ""

# Démarrer le serveur
node mysql-proxy-server.js
