# Script pour forcer le redéploiement Vercel
Write-Host "🚀 Forçage du redéploiement Vercel..." -ForegroundColor Cyan
Write-Host ""

# Créer un commit vide avec timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "📝 Création d'un commit vide..." -ForegroundColor Yellow
git commit --allow-empty -m "deploy: Force redeploy at $timestamp"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit créé" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📤 Push vers GitHub..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Push réussi" -ForegroundColor Green
        Write-Host ""
        Write-Host "⏳ Vercel va détecter le push et déployer automatiquement..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🔗 Ouvre cette page pour voir le déploiement:" -ForegroundColor Yellow
        Write-Host "   https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1/deployments" -ForegroundColor White
        Write-Host ""
        
        # Ouvrir la page dans le navigateur
        Start-Process "https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1/deployments"
        
        Write-Host "✅ Page ouverte dans le navigateur" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors du push" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Erreur lors de la création du commit" -ForegroundColor Red
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
