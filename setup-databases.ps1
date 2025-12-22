# =====================================================
# CONFIGURATION DES BASES DE DONNEES LOCALES
# =====================================================

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "CONFIGURATION DES BASES DE DONNEES LOCALES" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ce script va vous aider à créer les bases de données locales" -ForegroundColor Yellow
Write-Host "nécessaires pour la migration." -ForegroundColor Yellow
Write-Host ""

# Détecter le chemin MySQL automatiquement
$mysqlPath = $null
$possiblePaths = @(
    "C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $mysqlPath = $path
        Write-Host "✅ MySQL trouvé: $mysqlPath" -ForegroundColor Green
        break
    }
}

if (-not $mysqlPath) {
    Write-Host "❌ MySQL non trouvé dans les emplacements standards" -ForegroundColor Red
    Write-Host "Veuillez installer MySQL ou WAMP/XAMPP" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour continuer"
    exit
}

function Show-Menu {
    Write-Host "Choisissez une option:" -ForegroundColor White
    Write-Host "1. Configurer MySQL" -ForegroundColor Green
    Write-Host "2. Configurer PostgreSQL" -ForegroundColor Green  
    Write-Host "3. Configurer les deux" -ForegroundColor Green
    Write-Host "4. Tester les connexions" -ForegroundColor Blue
    Write-Host "5. Quitter" -ForegroundColor Red
    Write-Host ""
}

function Setup-MySQL {
    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host "CONFIGURATION MYSQL" -ForegroundColor Cyan
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "MySQL détecté: $mysqlPath" -ForegroundColor Green
    Write-Host ""
    
    $mysqlUser = Read-Host "Nom d'utilisateur MySQL (par défaut: root)"
    if ([string]::IsNullOrEmpty($mysqlUser)) {
        $mysqlUser = "root"
    }

    Write-Host ""
    Write-Host "Exécution du script MySQL..." -ForegroundColor Yellow
    
    try {
        # Créer les bases de données MySQL
        $mysqlCommands = @"
CREATE DATABASE IF NOT EXISTS stock_db;
CREATE DATABASE IF NOT EXISTS stock_local;
CREATE DATABASE IF NOT EXISTS stock_migration_mysql;

SHOW DATABASES LIKE 'stock%';
"@
        
        $mysqlCommands | & $mysqlPath -u $mysqlUser
        
        Write-Host "✅ Configuration MySQL terminée avec succès!" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Erreur lors de la configuration MySQL" -ForegroundColor Red
        Write-Host "Vérifiez que MySQL est installé et accessible" -ForegroundColor Red
        Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Setup-PostgreSQL {
    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host "CONFIGURATION POSTGRESQL" -ForegroundColor Cyan
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Assurez-vous que PostgreSQL est installé et en cours d'exécution." -ForegroundColor Yellow
    Write-Host ""
    
    $pgUser = Read-Host "Nom d'utilisateur PostgreSQL (par défaut: postgres)"
    if ([string]::IsNullOrEmpty($pgUser)) {
        $pgUser = "postgres"
    }

    Write-Host ""
    Write-Host "Exécution du script PostgreSQL..." -ForegroundColor Yellow
    
    try {
        # Créer les bases de données PostgreSQL
        $pgCommands = @"
CREATE DATABASE stock_db;
CREATE DATABASE stock_local;
CREATE DATABASE stock_migration_postgres;
CREATE DATABASE test_migration_postgres;

CREATE USER stock_user WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE stock_db TO stock_user;
GRANT ALL PRIVILEGES ON DATABASE stock_local TO stock_user;
GRANT ALL PRIVILEGES ON DATABASE stock_migration_postgres TO stock_user;
GRANT ALL PRIVILEGES ON DATABASE test_migration_postgres TO stock_user;

\l stock*
"@
        
        $pgCommands | psql -U $pgUser
        
        Write-Host "✅ Configuration PostgreSQL terminée avec succès!" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Erreur lors de la configuration PostgreSQL" -ForegroundColor Red
        Write-Host "Vérifiez que PostgreSQL est installé et accessible" -ForegroundColor Red
        Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Test-Connections {
    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host "TEST DES CONNEXIONS" -ForegroundColor Cyan
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "Test MySQL..." -ForegroundColor Yellow
    try {
        $mysqlResult = & $mysqlPath -u root -e "SHOW DATABASES LIKE 'stock%';" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MySQL: Connexion OK" -ForegroundColor Green
            Write-Host $mysqlResult
        } else {
            Write-Host "❌ MySQL: Connexion échouée" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ MySQL: Connexion échouée" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Test PostgreSQL..." -ForegroundColor Yellow
    try {
        $pgResult = psql -U postgres -c "\l stock*" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ PostgreSQL: Connexion OK" -ForegroundColor Green
            Write-Host $pgResult
        } else {
            Write-Host "❌ PostgreSQL: Connexion échouée" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ PostgreSQL: Connexion échouée" -ForegroundColor Red
    }

    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

# Boucle principale
do {
    Clear-Host
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host "CONFIGURATION DES BASES DE DONNEES LOCALES" -ForegroundColor Cyan
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host ""
    
    Show-Menu
    $choice = Read-Host "Votre choix (1-5)"
    
    switch ($choice) {
        "1" { Setup-MySQL }
        "2" { Setup-PostgreSQL }
        "3" { 
            Setup-MySQL
            Setup-PostgreSQL
        }
        "4" { Test-Connections }
        "5" { 
            Write-Host ""
            Write-Host "Au revoir!" -ForegroundColor Green
            break
        }
        default {
            Write-Host "Choix invalide. Veuillez choisir entre 1 et 5." -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
} while ($choice -ne "5")

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "CONFIGURATION TERMINÉE" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Vous pouvez maintenant utiliser l'interface de migration" -ForegroundColor Green
Write-Host "à l'adresse: http://localhost:3000/admin/database-migration" -ForegroundColor Green
Write-Host ""
Write-Host "Les bases de données suivantes ont été créées:" -ForegroundColor Yellow
Write-Host "- stock_db (base principale)" -ForegroundColor White
Write-Host "- stock_local (base locale)" -ForegroundColor White
Write-Host "- stock_migration_mysql (migration MySQL)" -ForegroundColor White
Write-Host "- stock_migration_postgres (migration PostgreSQL)" -ForegroundColor White
Write-Host ""
Read-Host "Appuyez sur Entrée pour terminer"