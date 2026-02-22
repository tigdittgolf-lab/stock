# Script pour redémarrer le backend
Write-Host "🔄 Redémarrage du backend..." -ForegroundColor Cyan

# Aller dans le dossier backend
Set-Location backend

# Arrêter les processus Bun existants (si nécessaire)
Write-Host "🛑 Arrêt des processus existants..." -ForegroundColor Yellow
Get-Process bun -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Attendre un peu
Start-Sleep -Seconds 2

# Démarrer le backend
Write-Host "🚀 Démarrage du backend avec Bun..." -ForegroundColor Green
bun run dev

# Revenir au dossier racine
Set-Location ..
