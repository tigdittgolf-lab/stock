# Script pour mettre à jour Vercel CLI en mode administrateur
# Exécuter ce script en tant qu'administrateur

Write-Host "🔧 Mise à jour de Vercel CLI" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Vérifier si on est en mode administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Ce script doit être exécuté en tant qu'administrateur!" -ForegroundColor Red
    Write-Host "`n📋 Instructions:" -ForegroundColor Yellow
    Write-Host "   1. Clic droit sur PowerShell" -ForegroundColor White
    Write-Host "   2. Sélectionner 'Exécuter en tant qu'administrateur'" -ForegroundColor White
    Write-Host "   3. Exécuter: .\update-vercel-admin.ps1`n" -ForegroundColor White
    pause
    exit
}

Write-Host "✅ Mode administrateur détecté`n" -ForegroundColor Green

# Arrêter tous les processus Node/Vercel
Write-Host "🛑 Arrêt des processus Node/Vercel..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*vercel*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Nettoyer le cache npm
Write-Host "🧹 Nettoyage du cache npm..." -ForegroundColor Yellow
npm cache clean --force

# Supprimer l'ancienne installation
Write-Host "🗑️  Suppression de l'ancienne version..." -ForegroundColor Yellow
npm uninstall -g vercel

# Installer la nouvelle version
Write-Host "📦 Installation de Vercel@latest..." -ForegroundColor Yellow
npm install -g vercel@latest

# Vérifier la version
Write-Host "`n✅ Installation terminée!" -ForegroundColor Green
Write-Host "📊 Version installée:" -ForegroundColor Cyan
vercel --version

Write-Host "`n🎉 Mise à jour réussie!" -ForegroundColor Green
pause
