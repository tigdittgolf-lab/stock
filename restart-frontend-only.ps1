# Script de redémarrage du frontend uniquement

Write-Host "=== REDEMARRAGE DU FRONTEND ===" -ForegroundColor Cyan
Write-Host ""

# 1. Arrêter tous les processus Node.js
Write-Host "1. Arret du frontend Next.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        Write-Host "   Arret du processus $($_.Id)..." -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "   OK Frontend arrete" -ForegroundColor Green
} else {
    Write-Host "   Info: Aucun processus frontend trouve" -ForegroundColor Gray
}
Write-Host ""

# 2. Redémarrer le frontend
Write-Host "2. Demarrage du frontend..." -ForegroundColor Yellow
Set-Location frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
Set-Location ..
Start-Sleep -Seconds 3
Write-Host "   OK Frontend demarre" -ForegroundColor Green
Write-Host ""

Write-Host "=== FRONTEND REDEMARRE ===" -ForegroundColor Green
Write-Host ""
Write-Host "INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "1. Attendez 10-15 secondes que le frontend compile" -ForegroundColor White
Write-Host "2. Ouvrez http://localhost:3000" -ForegroundColor White
Write-Host "3. Videz le cache du navigateur (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "4. Verifiez que 'MySQL' est affiche en haut a droite" -ForegroundColor White
Write-Host "5. Allez sur le BL 3" -ForegroundColor White
Write-Host "6. Le solde devrait maintenant s'afficher correctement" -ForegroundColor White
Write-Host ""
