@echo off
REM Script pour créer la base stock_management dans MySQL local

echo.
echo ========================================================
echo   CONFIGURATION MYSQL LOCAL
echo   Creation de stock_management et table payments
echo ========================================================
echo.

set MYSQL_HOST=localhost
set MYSQL_PORT=3307
set MYSQL_USER=root
set MYSQL_PASSWORD=

echo Configuration:
echo   Host: %MYSQL_HOST%
echo   Port: %MYSQL_PORT%
echo   User: %MYSQL_USER%
echo.

echo Execution du script SQL...
echo.

mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_USER% < setup-mysql-local.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCES - Base creee !
    echo ========================================================
    echo.
    echo Base de donnees: stock_management
    echo Table: payments
    echo.
    echo Pour verifier:
    echo   mysql -h localhost -P 3307 -u root
    echo   USE stock_management;
    echo   SHOW TABLES;
    echo.
) else (
    echo.
    echo ========================================================
    echo   ERREUR
    echo ========================================================
    echo.
    echo Verifiez que MySQL est demarre
    echo.
)

pause
