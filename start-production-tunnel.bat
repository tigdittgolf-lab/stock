@echo off
title Backend Local avec Tunnel pour Production
color 0A

echo.
echo ========================================
echo   BACKEND LOCAL POUR PRODUCTION
echo ========================================
echo.

echo 🔍 Verification des prerequis...

:: Vérifier si Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installe
    echo    Telecharger depuis: https://nodejs.org/
    pause
    exit /b 1
)

:: Vérifier si le dossier backend existe
if not exist "backend" (
    echo ❌ Dossier backend non trouve
    echo    Assurez-vous d'etre dans le repertoire racine du projet
    pause
    exit /b 1
)

echo ✅ Node.js detecte
echo ✅ Dossier backend trouve

echo.
echo 📦 Installation des dependances backend...
cd backend
call npm install
if errorlevel 1 (
    echo ❌ Erreur lors de l'installation des dependances
    pause
    exit /b 1
)

echo.
echo 🚀 Demarrage du backend local...
echo    Backend sera accessible sur: http://localhost:3005
echo.

:: Démarrer le backend en arrière-plan
start /B "Backend Local" cmd /c "npm run dev"

:: Attendre que le backend démarre
echo ⏳ Attente du demarrage du backend (5 secondes)...
timeout /t 5 /nobreak >nul

echo.
echo 🌐 Creation du tunnel public...
echo.
echo 📋 INSTRUCTIONS:
echo    1. Copiez l'URL https://xxx.ngrok.io qui va apparaitre
echo    2. Ouvrez votre application web
echo    3. Cliquez sur "⚙️ Configurer Backend"
echo    4. Collez l'URL du tunnel
echo    5. Testez et sauvegardez la configuration
echo.
echo 🔄 Demarrage de ngrok...
echo    (Appuyez sur Ctrl+C pour arreter)
echo.

:: Vérifier si ngrok est installé
ngrok version >nul 2>&1
if errorlevel 1 (
    echo ❌ ngrok n'est pas installe
    echo.
    echo 📥 INSTALLATION NGROK:
    echo    1. Aller sur: https://ngrok.com/
    echo    2. Creer un compte gratuit
    echo    3. Telecharger ngrok
    echo    4. Configurer le token: ngrok config add-authtoken YOUR_TOKEN
    echo.
    echo 🔄 Alternative - Cloudflare Tunnel:
    echo    1. Telecharger cloudflared
    echo    2. Executer: cloudflared tunnel --url http://localhost:3005
    echo.
    pause
    exit /b 1
)

:: Créer le tunnel ngrok
ngrok http 3005

echo.
echo 🛑 Tunnel ferme. Backend local toujours actif.
echo    Pour arreter completement, fermez cette fenetre.
pause