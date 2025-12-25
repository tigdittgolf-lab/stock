# DÉPLOIEMENT VERCEL SANS PROTECTION

Write-Host "🚀 DÉPLOIEMENT VERCEL SANS PROTECTION" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Étape 1: Copier la nouvelle configuration
Write-Host "1️⃣ Configuration Vercel..." -ForegroundColor Blue
Copy-Item "vercel-no-protection.json" "vercel.json" -Force

# Étape 2: Aller dans le dossier frontend
Write-Host "2️⃣ Déploiement..." -ForegroundColor Blue
Set-Location "frontend"

# Étape 3: Déployer avec force
Write-Host "3️⃣ Lancement du déploiement..." -ForegroundColor Blue
vercel --prod --force

Write-Host "✅ Déploiement terminé !" -ForegroundColor Green
Write-Host "🔗 Vérifiez votre nouvelle URL de déploiement" -ForegroundColor Yellow
