@echo off
REM =====================================================================
REM  StockApp - Point d'entree double-clic
REM  Lance le script PowerShell principal (StockApp-Launcher.ps1)
REM =====================================================================
REM  Ce fichier est ce que l'utilisateur double-clique. Il ne fait que
REM  appeler PowerShell avec la bonne politique d'execution.
REM =====================================================================

setlocal
title StockApp - Gestion de Stock

REM Repertoire racine = dossier parent de ce .bat
set "APP_ROOT=%~dp0"
set "APP_ROOT=%APP_ROOT:~0,-1%"

REM Lancer PowerShell en contournant la politique d'execution pour ce script
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%APP_ROOT%\scripts\StockApp-Launcher.ps1" -AppRoot "%APP_ROOT%"

REM Si le lanceur se termine avec une erreur, garder la fenetre ouverte
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERREUR] Le lanceur s'est arrete avec le code %ERRORLEVEL%.
    echo.
    pause
)

endlocal
