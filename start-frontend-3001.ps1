# 🌐 Démarrage Frontend sur Port 3001
# Script pour forcer le frontend à utiliser le port 3001

Write-Host "Demarrage Frontend sur Port 3001..." -ForegroundColor Green

# Aller dans le dossier frontend
Set-Location "$PSScriptRoot\frontend"

# Nettoyer le cache Next.js
Write-Host "Nettoyage du cache Next.js..." -ForegroundColor Yellow
Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue

# Définir la variable d'environnement pour forcer le port 3001
$env:PORT = "3001"

Write-Host "Port force: 3001" -ForegroundColor Cyan
Write-Host "Demarrage de Next.js..." -ForegroundColor Yellow

# Démarrer Next.js avec le port forcé
npm run dev