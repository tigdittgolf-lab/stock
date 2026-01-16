# ============================================
# MIGRATION MYSQL - Déplacement des tables
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "MIGRATION MYSQL - Deplacement des tables" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Execution du script de migration..." -ForegroundColor Yellow

# Méthode PowerShell pour exécuter MySQL avec redirection
Get-Content "MYSQL_MOVE_TABLES_FROM_2025_BU01.sql" | mysql -u root -p

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "VERIFICATION DU SYSTEME" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verification de l'installation..." -ForegroundColor Yellow
Get-Content "verify-mysql-setup.sql" | mysql -u root -p

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "MIGRATION TERMINEE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
