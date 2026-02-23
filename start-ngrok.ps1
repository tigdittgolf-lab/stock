# Script pour demarrer ngrok et afficher l'URL
Write-Host "Demarrage de ngrok..." -ForegroundColor Cyan
Write-Host ""

# Demarrer ngrok en arriere-plan
Start-Process -FilePath "c:\ngrok\ngrok.exe" -ArgumentList "http", "3005" -WindowStyle Normal

Write-Host "Ngrok demarre!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "1. Une fenetre ngrok s'est ouverte" -ForegroundColor White
Write-Host "2. Regardez l'URL qui commence par https://...ngrok-free.app" -ForegroundColor White
Write-Host "3. Copiez cette URL" -ForegroundColor White
Write-Host "4. Allez sur https://vercel.com/dashboard" -ForegroundColor White
Write-Host "5. st-article-1 -> Settings -> Environment Variables" -ForegroundColor White
Write-Host "6. Mettez a jour BACKEND_URL et NEXT_PUBLIC_API_URL avec votre URL ngrok" -ForegroundColor White
Write-Host ""
Write-Host "Exemple:" -ForegroundColor Cyan
Write-Host "  BACKEND_URL = https://abc123.ngrok-free.app" -ForegroundColor Gray
Write-Host "  NEXT_PUBLIC_API_URL = https://abc123.ngrok-free.app/api" -ForegroundColor Gray
