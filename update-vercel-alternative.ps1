# Méthode alternative pour mettre à jour Vercel sans droits admin

Write-Host "🔧 Mise à jour Alternative de Vercel CLI" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Méthode 1: Forcer la suppression du cache
Write-Host "1️⃣ Nettoyage du cache npm..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "   ✅ Cache nettoyé`n" -ForegroundColor Green

# Méthode 2: Utiliser --force pour l'installation
Write-Host "2️⃣ Installation forcée de Vercel@latest..." -ForegroundColor Yellow
npm install -g vercel@latest --force

# Vérifier la version
Write-Host "`n3️⃣ Vérification de la version..." -ForegroundColor Yellow
$version = vercel --version
Write-Host "   📊 Version: $version" -ForegroundColor Cyan

if ($version -match "50\.") {
    Write-Host "`n✅ Mise à jour réussie vers v50.x!" -ForegroundColor Green
} elseif ($version -match "48\.") {
    Write-Host "`n⚠️  Toujours sur v48.x - La mise à jour n'a pas fonctionné" -ForegroundColor Yellow
    Write-Host "`n💡 Solutions alternatives:" -ForegroundColor Cyan
    Write-Host "   1. Exécuter PowerShell en tant qu'administrateur" -ForegroundColor White
    Write-Host "   2. Utiliser: .\update-vercel-admin.ps1" -ForegroundColor White
    Write-Host "   3. Ou continuer avec v48.6.0 (fonctionne correctement)`n" -ForegroundColor White
} else {
    Write-Host "`n✅ Version mise à jour!" -ForegroundColor Green
}

Write-Host "`n📋 Note: Vercel v48.6.0 fonctionne parfaitement" -ForegroundColor Cyan
Write-Host "   La mise à jour n'est pas critique pour votre projet`n" -ForegroundColor Cyan

pause
