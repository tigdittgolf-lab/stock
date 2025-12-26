# Script de démarrage application locale
Write-Host "🚀 Démarrage de l'application LOCALE (mode offline)" -ForegroundColor Green
Write-Host ""

# Vérifier si les dossiers existent
if (-not (Test-Path "backend")) {
    Write-Host "❌ Dossier backend introuvable!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "❌ Dossier frontend introuvable!" -ForegroundColor Red
    exit 1
}

# Démarrer le backend
Write-Host "📊 Démarrage du Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; bun index.ts" -WindowStyle Normal

# Attendre que le backend démarre
Write-Host "⏳ Attente du backend (5 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Tester si le backend répond
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend démarré avec succès!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend pas encore prêt, continuons..." -ForegroundColor Yellow
}

# Démarrer le frontend
Write-Host "🌐 Démarrage du Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

# Attendre que le frontend démarre
Write-Host "⏳ Attente du frontend (15 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Ouvrir l'application dans le navigateur
Write-Host "🎉 Ouverture de l'application..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "✅ Application locale démarrée !" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:3005" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour arrêter l'application, fermez les fenêtres PowerShell du Backend et Frontend." -ForegroundColor Yellow
Write-Host ""
Read-Host "Appuyez sur Entrée pour continuer"