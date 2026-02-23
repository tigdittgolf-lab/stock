# Script simple pour commiter la correction
# Executer apres avoir ferme tous les processus Git

Write-Host "Commit de la correction..." -ForegroundColor Cyan

# Supprimer le lock si necessaire
if (Test-Path ".git\index.lock") {
    Write-Host "Suppression du lock Git..." -ForegroundColor Yellow
    Remove-Item .git\index.lock -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Ajouter les changements
Write-Host "Ajout des changements..." -ForegroundColor Yellow
git add .gitignore
git rm ngrok.exe --cached

# Commit
Write-Host "Commit..." -ForegroundColor Yellow
git commit -m "chore: Remove ngrok.exe from repo and add to gitignore"

# Push
Write-Host "Push vers GitHub..." -ForegroundColor Yellow
git push

Write-Host ""
Write-Host "OK! Maintenant:" -ForegroundColor Green
Write-Host "1. Allez sur https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Selectionnez st-article-1 -> Settings -> Environment Variables" -ForegroundColor White
Write-Host "3. Verifiez que ces variables existent pour Production:" -ForegroundColor White
Write-Host "   - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Gray
Write-Host "   - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Gray
Write-Host "   - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host "   - SUPABASE_URL" -ForegroundColor Gray
