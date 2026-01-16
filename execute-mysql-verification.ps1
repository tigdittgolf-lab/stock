# Script PowerShell pour vérifier l'installation MySQL
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VÉRIFICATION MYSQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Lire le script SQL
$sqlContent = Get-Content "verify-mysql-setup.sql" -Raw

# Créer un fichier temporaire
$tempFile = [System.IO.Path]::GetTempFileName()
$sqlContent | Out-File -FilePath $tempFile -Encoding UTF8

Write-Host "Vérification du système..." -ForegroundColor Yellow
Write-Host "Vous allez être invité à entrer votre mot de passe MySQL root" -ForegroundColor Cyan
Write-Host ""

# Exécuter avec MySQL
& mysql -u root -p --default-character-set=utf8mb4 < $tempFile

# Nettoyer
Remove-Item $tempFile

Write-Host ""
Write-Host "Vérification terminée!" -ForegroundColor Green
