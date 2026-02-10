@echo off
REM Script pour vérifier les bases de données MySQL

echo.
echo ========================================================
echo   Verification des Bases de Donnees MySQL
echo ========================================================
echo.

REM Lire la configuration depuis .env
set MYSQL_HOST=localhost
set MYSQL_PORT=3307
set MYSQL_USER=root
set MYSQL_PASSWORD=

echo Configuration:
echo   Host: %MYSQL_HOST%
echo   Port: %MYSQL_PORT%
echo   User: %MYSQL_USER%
echo.

echo Connexion a MySQL...
echo.

REM Exécuter le script SQL
mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_USER% < check-mysql-databases.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   Verification terminee
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   ERREUR lors de la connexion
    echo ========================================================
    echo.
    echo Verifiez:
    echo   1. MySQL est demarre
    echo   2. Le port 3307 est correct
    echo   3. L'utilisateur root existe
    echo   4. Le mot de passe est correct (actuellement vide)
    echo.
    echo Pour tester manuellement:
    echo   mysql -h localhost -P 3307 -u root
)

echo.
pause
