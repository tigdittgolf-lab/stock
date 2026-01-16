@echo off
echo ============================================
echo MIGRATION MYSQL - Deplacement des tables
echo ============================================
echo.

echo Execution du script de migration...
mysql -u root -p < MYSQL_MOVE_TABLES_FROM_2025_BU01.sql

echo.
echo ============================================
echo VERIFICATION DU SYSTEME
echo ============================================
echo.

echo Verification de l'installation...
mysql -u root -p < verify-mysql-setup.sql

echo.
echo ============================================
echo MIGRATION TERMINEE
echo ============================================
pause
