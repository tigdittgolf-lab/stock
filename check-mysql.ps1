# Script PowerShell pour vérifier les bases de données MySQL

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Vérification des Bases de Données MySQL" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration depuis .env
$MYSQL_HOST = "localhost"
$MYSQL_PORT = "3307"
$MYSQL_USER = "root"
$MYSQL_PASSWORD = ""

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $MYSQL_HOST"
Write-Host "  Port: $MYSQL_PORT"
Write-Host "  User: $MYSQL_USER"
Write-Host "  Password: $(if ($MYSQL_PASSWORD) { '✅ Défini' } else { '❌ Vide' })"
Write-Host ""

# Vérifier si mysql est disponible
Write-Host "🔍 Vérification de MySQL..." -ForegroundColor Cyan
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue

if (-not $mysqlPath) {
    Write-Host "❌ MySQL n'est pas dans le PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions:" -ForegroundColor Yellow
    Write-Host "  1. Ajouter MySQL au PATH"
    Write-Host "  2. Utiliser le chemin complet, ex:"
    Write-Host "     C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    Write-Host "  3. Utiliser MySQL Workbench ou phpMyAdmin"
    Write-Host ""
    Write-Host "Ou exécutez manuellement:" -ForegroundColor Yellow
    Write-Host "  mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "✅ MySQL trouvé: $($mysqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Créer un fichier SQL temporaire
$sqlFile = "temp_check_mysql.sql"
$sqlContent = @"
-- Lister toutes les bases
SELECT '═══════════════════════════════════════════════════════' AS '';
SELECT '📊 TOUTES LES BASES DE DONNÉES' AS '';
SELECT '═══════════════════════════════════════════════════════' AS '';
SHOW DATABASES;

-- Chercher les bases tenant
SELECT '' AS '';
SELECT '═══════════════════════════════════════════════════════' AS '';
SELECT '🔍 BASES TENANT (bu, 2024, 2025)' AS '';
SELECT '═══════════════════════════════════════════════════════' AS '';
SELECT SCHEMA_NAME as 'Base tenant'
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME LIKE '%bu%'
   OR SCHEMA_NAME LIKE '%2024%'
   OR SCHEMA_NAME LIKE '%2025%';

-- Chercher stock_management
SELECT '' AS '';
SELECT '═══════════════════════════════════════════════════════' AS '';
SELECT '🔍 RECHERCHE "stock_management"' AS '';
SELECT '═══════════════════════════════════════════════════════' AS '';
SELECT SCHEMA_NAME as 'Base trouvée'
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME LIKE '%stock%';
"@

$sqlContent | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "🔌 Connexion à MySQL..." -ForegroundColor Cyan
Write-Host ""

# Exécuter MySQL
if ($MYSQL_PASSWORD) {
    mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD < $sqlFile
} else {
    mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER < $sqlFile
}

$exitCode = $LASTEXITCODE

# Nettoyer
Remove-Item $sqlFile -ErrorAction SilentlyContinue

Write-Host ""

if ($exitCode -eq 0) {
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  ✅ Vérification terminée" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Prochaines étapes:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Si 'stock_management' n'existe pas:" -ForegroundColor Cyan
    Write-Host "  mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER"
    Write-Host "  CREATE DATABASE stock_management;"
    Write-Host "  USE stock_management;"
    Write-Host "  SOURCE backend/migrations/create_payments_table_mysql.sql;"
    Write-Host ""
    Write-Host "Pour voir les tables:" -ForegroundColor Cyan
    Write-Host "  USE stock_management;"
    Write-Host "  SHOW TABLES;"
    Write-Host ""
} else {
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host "  ❌ ERREUR lors de la connexion" -ForegroundColor Red
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vérifiez:" -ForegroundColor Yellow
    Write-Host "  1. MySQL est démarré"
    Write-Host "  2. Le port est correct (3307)"
    Write-Host "  3. L'utilisateur 'root' existe"
    Write-Host "  4. Le mot de passe est correct"
    Write-Host ""
    Write-Host "Pour tester manuellement:" -ForegroundColor Cyan
    Write-Host "  mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER"
    Write-Host ""
}

Write-Host "📚 Consultez GUIDE_VERIFICATION_MYSQL.md pour plus d'aide" -ForegroundColor Cyan
Write-Host ""
