@echo off
echo ========================================
echo   Demarrage de l'application Stock
echo ========================================
echo.

echo [1/2] Demarrage du backend...
start "Backend API" cmd /k "cd backend && bun run index.ts"
timeout /t 3 /nobreak > nul

echo [2/2] Demarrage du frontend...
start "Frontend Next.js" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Application demarree avec succes!
echo ========================================
echo.
echo Backend:  http://localhost:3005
echo Frontend: http://localhost:3000
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause > nul
