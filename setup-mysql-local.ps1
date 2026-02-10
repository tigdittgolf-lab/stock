# Script PowerShell pour créer la base stock_management dans MySQL local

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURATION MYSQL LOCAL" -ForegroundColor Cyan
Write-Host "  Création de stock_management et table payments" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$MYSQL_HOST = "localhost"
$MYSQL_PORT = "3307"
$MYSQL_USER = "root"
$MYSQL_PASSWORD = ""

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $MYSQL_HOST"
Write-Host "  Port: $MYSQL_PORT"
Write-Host "  User: $MYSQL_USER"
Write-Host ""

Write-Host "🔌 Connexion à MySQL et exécution du script..." -ForegroundColor Cyan
Write-Host ""

# Exécuter le script SQL
if ($MYSQL_PASSWORD) {
    mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD < setup-mysql-local.sql
} else {
    mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER < setup-mysql-local.sql
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  ✅ SUCCÈS - Base créée !" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Base de données: stock_management" -ForegroundColor Cyan
    Write-Host "Table: payments" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Pour vérifier:" -ForegroundColor Yellow
    Write-Host "  mysql -h localhost -P 3307 -u root"
    Write-Host "  USE stock_management;"
    Write-Host "  SHOW TABLES;"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host "  ❌ ERREUR" -ForegroundColor Red
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vérifiez que MySQL est démarré" -ForegroundColor Yellow
    Write-Host ""
}
