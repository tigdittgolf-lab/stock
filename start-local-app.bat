@echo off
echo 🚀 Démarrage de l'application en mode LOCAL (sans Internet)
echo.

echo 📊 Démarrage du Backend...
start "Backend" cmd /k "cd backend && bun index.ts"

echo ⏳ Attente du backend (5 secondes)...
timeout /t 5 /nobreak > nul

echo 🌐 Démarrage du Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo ⏳ Attente du frontend (10 secondes)...
timeout /t 10 /nobreak > nul

echo 🎉 Application locale prête !
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:3005
echo.
echo Appuyez sur une touche pour ouvrir l'application...
pause > nul

start http://localhost:3000

echo.
echo ✅ Application locale démarrée !
echo Pour arrêter, fermez les fenêtres Backend et Frontend.
pause