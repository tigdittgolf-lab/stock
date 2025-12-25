@echo off
echo 🎯 OUVERTURE DES URLS DE TEST
echo ==============================

echo.
echo 🚀 Ouverture des applications Vercel...
start "" "https://frontend-jv1h2b1wf-tigdittgolf-9191s-projects.vercel.app"

timeout /t 2 /nobreak >nul

echo 🧪 Ouverture de la page de test backend...
start "" "https://frontend-jv1h2b1wf-tigdittgolf-9191s-projects.vercel.app/test-backend.html"

timeout /t 2 /nobreak >nul

echo 🔗 Ouverture du backend tunnel...
start "" "https://enabled-encourage-mechanics-performance.trycloudflare.com"

timeout /t 2 /nobreak >nul

echo 📋 Ouverture du guide de test...
start "" "GUIDE_TEST_FINAL.md"

echo.
echo ✅ Toutes les URLs sont ouvertes !
echo 🎯 Suivez le guide pour tester l'application
echo.
pause