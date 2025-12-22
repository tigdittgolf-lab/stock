@echo off
echo =====================================================
echo CONFIGURATION DES BASES DE DONNEES LOCALES
echo =====================================================
echo.

echo Ce script va vous aider a creer les bases de donnees locales
echo necessaires pour la migration.
echo.

:MENU
echo Choisissez une option:
echo 1. Configurer MySQL
echo 2. Configurer PostgreSQL  
echo 3. Configurer les deux
echo 4. Tester les connexions
echo 5. Quitter
echo.
set /p choice="Votre choix (1-5): "

if "%choice%"=="1" goto MYSQL_SETUP
if "%choice%"=="2" goto POSTGRES_SETUP
if "%choice%"=="3" goto BOTH_SETUP
if "%choice%"=="4" goto TEST_CONNECTIONS
if "%choice%"=="5" goto END
goto MENU

:MYSQL_SETUP
echo.
echo =====================================================
echo CONFIGURATION MYSQL
echo =====================================================
echo.
echo Assurez-vous que MySQL est installe et en cours d'execution.
echo.
set /p mysql_user="Nom d'utilisateur MySQL (par defaut: root): "
if "%mysql_user%"=="" set mysql_user=root

echo.
echo Execution du script MySQL...
mysql -u %mysql_user% -p < setup-local-databases.sql

if %ERRORLEVEL% EQU 0 (
    echo ✅ Configuration MySQL terminee avec succes!
) else (
    echo ❌ Erreur lors de la configuration MySQL
    echo Verifiez que MySQL est installe et accessible
)
echo.
pause
goto MENU

:POSTGRES_SETUP
echo.
echo =====================================================
echo CONFIGURATION POSTGRESQL
echo =====================================================
echo.
echo Assurez-vous que PostgreSQL est installe et en cours d'execution.
echo.
set /p pg_user="Nom d'utilisateur PostgreSQL (par defaut: postgres): "
if "%pg_user%"=="" set pg_user=postgres

echo.
echo Execution du script PostgreSQL...
psql -U %pg_user% -f setup-local-databases.sql

if %ERRORLEVEL% EQU 0 (
    echo ✅ Configuration PostgreSQL terminee avec succes!
) else (
    echo ❌ Erreur lors de la configuration PostgreSQL
    echo Verifiez que PostgreSQL est installe et accessible
)
echo.
pause
goto MENU

:BOTH_SETUP
echo.
echo =====================================================
echo CONFIGURATION MYSQL ET POSTGRESQL
echo =====================================================
call :MYSQL_SETUP
call :POSTGRES_SETUP
goto MENU

:TEST_CONNECTIONS
echo.
echo =====================================================
echo TEST DES CONNEXIONS
echo =====================================================
echo.

echo Test MySQL...
mysql -u root -e "SHOW DATABASES LIKE 'stock%%';" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL: Connexion OK
) else (
    echo ❌ MySQL: Connexion echouee
)

echo.
echo Test PostgreSQL...
psql -U postgres -c "\l stock*" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL: Connexion OK
) else (
    echo ❌ PostgreSQL: Connexion echouee
)

echo.
pause
goto MENU

:END
echo.
echo =====================================================
echo CONFIGURATION TERMINEE
echo =====================================================
echo.
echo Vous pouvez maintenant utiliser l'interface de migration
echo a l'adresse: http://localhost:3000/admin/database-migration
echo.
echo Les bases de donnees suivantes ont ete creees:
echo - stock_db (base principale)
echo - stock_local (base locale)
echo - stock_migration_mysql (migration MySQL)
echo - stock_migration_postgres (migration PostgreSQL)
echo.
pause