@echo off
title Stock Management
cls

echo ==========================================
echo    Stock Management - Launcher
echo ==========================================
echo.

REM Test Internet rapide
ping -n 1 8.8.8.8 >nul 2>&1
if %errorlevel%==0 (
    echo Internet: Disponible
    set "mode=cloud"
) else (
    echo Internet: Indisponible
    set "mode=local"
)

REM Test Backend
curl -s http://localhost:3005/health >nul 2>&1
if %errorlevel%==0 (
    echo Backend: En marche
) else (
    echo Backend: Arrete
)

echo.
echo Choisissez votre mode:
echo.
echo 1. Mode Local (Developpement)
echo 2. Mode Cloud (Production)
echo 3. Mode Auto (Recommande)
echo.

set /p choice="Votre choix (1-3): "

if "%choice%"=="1" goto local
if "%choice%"=="2" goto cloud
if "%choice%"=="3" goto auto
goto local

:auto
if "%mode%"=="cloud" (
    goto cloud
) else (
    goto local
)

:local
echo.
echo Demarrage Mode Local...
call start-local-app.bat
goto end

:cloud
echo.
echo Ouverture Mode Cloud...
start https://frontend-c822v6que-tigdittgolf-9191s-projects.vercel.app
goto end

:end
echo.
echo Application lancee !
pause