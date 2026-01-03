@echo off
title Stock Management - Launcher
color 0A

echo.
echo  ==========================================
echo   🚀 Stock Management - Launcher
echo  ==========================================
echo.

REM Test rapide de connectivité
ping -n 1 8.8.8.8 >nul 2>&1
if %errorlevel%==0 (
    set "internet=YES"
    echo  🌐 Internet: ✅ Disponible
) else (
    set "internet=NO"
    echo  🌐 Internet: ❌ Indisponible
)

REM Test backend local
curl -s http://localhost:3005/health >nul 2>&1
if %errorlevel%==0 (
    set "backend=YES"
    echo  📊 Backend: ✅ En marche
) else (
    set "backend=NO"
    echo  📊 Backend: ❌ Arrêté
)

echo.

REM Logique de décision
if "%internet%"=="YES" if "%backend%"=="YES" (
    echo  🎯 Recommandation: Mode Cloud
    echo.
    echo  Choisissez votre mode:
    echo  1. ☁️ Mode Cloud ^(Production^)
    echo  2. 🏠 Mode Local ^(Développement^)
    echo  3. ❌ Annuler
    echo.
    set /p choice="Votre choix (1-3): "
    
    if "!choice!"=="1" goto cloud
    if "!choice!"=="2" goto local
    if "!choice!"=="3" goto end
    goto local
) else (
    echo  🎯 Démarrage automatique en Mode Local
    timeout /t 3 /nobreak >nul
    goto local
)

:cloud
echo.
echo  ☁️ Ouverture du Mode Cloud...
if "%backend%"=="NO" (
    echo  📊 Démarrage du backend requis...
    start "Backend" /min cmd /k "cd backend && bun index.ts"
    timeout /t 5 /nobreak >nul
)
start https://frontend-c822v6que-tigdittgolf-9191s-projects.vercel.app
goto end

:local
echo.
echo  🏠 Démarrage du Mode Local...
powershell -ExecutionPolicy Bypass -File "%~dp0start-local-app.ps1"
goto end

:end
echo.
echo  ✅ Launcher terminé !
timeout /t 2 /nobreak >nul