# Script de redémarrage et test de la correction

Write-Host "=== REDÉMARRAGE ET TEST DE LA CORRECTION ===" -ForegroundColor Cyan
Write-Host ""

# 1. Arrêter les serveurs
Write-Host "1. Arrêt des serveurs..." -ForegroundColor Yellow
& .\stop-servers.ps1
Start-Sleep -Seconds 2
Write-Host ""

# 2. Redémarrer les serveurs
Write-Host "2. Redémarrage des serveurs..." -ForegroundColor Yellow
& .\start-clean.ps1
Write-Host ""

Write-Host "=== SERVEURS DÉMARRÉS ===" -ForegroundColor Green
Write-Host ""
Write-Host "📋 INSTRUCTIONS DE TEST:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ouvrez http://localhost:3000 dans votre navigateur" -ForegroundColor White
Write-Host "2. Vérifiez en haut à droite que vous êtes sur 'MySQL'" -ForegroundColor White
Write-Host "3. Allez sur un bon de livraison (ex: BL 3)" -ForegroundColor White
Write-Host "4. Cliquez sur '💰 Enregistrer un paiement'" -ForegroundColor White
Write-Host "5. Ajoutez un paiement de test (ex: 50 DA)" -ForegroundColor White
Write-Host "6. Enregistrez" -ForegroundColor White
Write-Host ""
Write-Host "7. Ensuite, exécutez ce script pour vérifier:" -ForegroundColor Yellow
Write-Host "   .\test-mysql-payment-creation.ps1" -ForegroundColor Cyan
Write-Host ""
