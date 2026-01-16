@echo off
echo ============================================
echo DEMARRAGE TAILSCALE + BACKEND
echo ============================================
echo.

echo 1. Demarrage de Tailscale...
start "" "C:\Program Files\Tailscale\tailscale-ipn.exe"
timeout /t 5

echo.
echo 2. Attente de la connexion Tailscale...
timeout /t 10

echo.
echo 3. Demarrage du backend sur port 3005...
cd backend
start "Backend Server" cmd /k "bun run index.ts"

echo.
echo ============================================
echo SERVICES DEMARRES
echo ============================================
echo.
echo Backend local: http://localhost:3005
echo Backend Tailscale: https://desktop-bhhs068.tail1d9c54.ts.net:3005
echo.
echo Appuyez sur une touche pour continuer...
pause
