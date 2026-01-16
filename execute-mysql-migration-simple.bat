@echo off
echo ========================================
echo MIGRATION MYSQL
echo ========================================
echo.
echo Etape 1: Migration des tables...
echo.

mysql -u root -p < MYSQL_MOVE_TABLES_FROM_2025_BU01.sql

echo.
echo ========================================
echo Etape 2: Verification...
echo ========================================
echo.

mysql -u root -p < verify-mysql-setup.sql

echo.
echo ========================================
echo Migration terminee!
echo ========================================
pause
