# Script pour corriger la regression production
# Executer: .\fix-production-regression.ps1

Write-Host "Correction de la regression production..." -ForegroundColor Cyan
Write-Host ""

# Etape 1: Supprimer ngrok.exe du repo
Write-Host "1. Suppression de ngrok.exe du repo..." -ForegroundColor Yellow
if (Test-Path "ngrok.exe") {
    git rm ngrok.exe
    Write-Host "   OK ngrok.exe supprime" -ForegroundColor Green
} else {
    Write-Host "   INFO ngrok.exe deja supprime" -ForegroundColor Gray
}

# Etape 2: Ajouter au .gitignore
Write-Host ""
Write-Host "2. Mise a jour .gitignore..." -ForegroundColor Yellow
$gitignoreContent = Get-Content .gitignore -ErrorAction SilentlyContinue
if ($gitignoreContent -notcontains "ngrok.exe") {
    Add-Content .gitignore "`nngrok.exe"
    Write-Host "   OK ngrok.exe ajoute au .gitignore" -ForegroundColor Green
} else {
    Write-Host "   INFO ngrok.exe deja dans .gitignore" -ForegroundColor Gray
}

# Etape 3: Commit et push
Write-Host ""
Write-Host "3. Commit des changements..." -ForegroundColor Yellow
git add .gitignore
git commit -m "chore: Remove ngrok.exe from repo and add to gitignore"

Write-Host ""
Write-Host "4. Push vers GitHub..." -ForegroundColor Yellow
git push

Write-Host ""
Write-Host "Nettoyage termine!" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "   1. Allez sur https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   2. Selectionnez st-article-1" -ForegroundColor White
Write-Host "   3. Settings -> Environment Variables" -ForegroundColor White
Write-Host "   4. Verifiez que ces variables existent:" -ForegroundColor White
Write-Host "      - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Gray
Write-Host "      - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Gray
Write-Host "      - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host "      - SUPABASE_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "   5. Si variables manquantes, les ajouter" -ForegroundColor White
Write-Host "   6. Attendez le redeploiement automatique (2-3 min)" -ForegroundColor White
Write-Host "   7. Testez vos pages!" -ForegroundColor White
Write-Host ""
Write-Host "Guide complet: DIAGNOSTIC_REGRESSION_PRODUCTION.md" -ForegroundColor Cyan
