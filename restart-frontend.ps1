# Script pour redémarrer le frontend et forcer la recompilation

Write-Host "🛑 Arrêt des processus Node.js..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "node" -or $_.ProcessName -eq "next"} | Where-Object {$_.Path -like "*St_Article_1*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "⏳ Attente de 2 secondes..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "🗑️ Suppression du cache .next..." -ForegroundColor Yellow
Set-Location frontend
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cache supprimé" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Pas de cache à supprimer" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🚀 Démarrage du serveur frontend..." -ForegroundColor Green
Write-Host "📝 Pour arrêter le serveur, appuyez sur Ctrl+C" -ForegroundColor Cyan
Write-Host ""

npm run dev
