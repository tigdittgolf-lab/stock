@echo off
echo ========================================
echo VERIFICATION MYSQL
echo ========================================
echo.
echo Verification du systeme MySQL autonome
echo.
echo Vous allez etre invite a entrer votre mot de passe MySQL root
echo.
pause

mysql -u root -p --default-character-set=utf8mb4 < verify-mysql-setup.sql

echo.
echo ========================================
echo Verification terminee!
echo ========================================
echo.
pause
