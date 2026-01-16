# Script PowerShell simplifié pour exécuter la migration MySQL
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MIGRATION MYSQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ce script va déplacer les tables de 2025_bu01 vers stock_management_auth" -ForegroundColor Yellow
Write-Host ""

# Lire le script SQL
$sqlContent = Get-Content "MYSQL_MOVE_TABLES_FROM_2025_BU01.sql" -Raw

# Créer un fichier temporaire
$tempFile = [System.IO.Path]::GetTempFileName()
$sqlContent | Out-File -FilePath $tempFile -Encoding UTF8

Write-Host "Exécution de la migration..." -ForegroundColor Yellow
Write-Host "Vous allez être invité à entrer votre mot de passe MySQL root" -ForegroundColor Cyan
Write-Host ""

# Exécuter avec MySQL
& mysql -u root -p --default-character-set=utf8mb4 < $tempFile

# Nettoyer
Remove-Item $tempFile

Write-Host ""
Write-Host "Migration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "Maintenant, exécutez la vérification:" -ForegroundColor Yellow
Write-Host "  .\execute-mysql-verification.ps1" -ForegroundColor White
