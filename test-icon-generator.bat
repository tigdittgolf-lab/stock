@echo off
title Test Generateur d'Icones
cls

echo ==========================================
echo    Test du Generateur d'Icones
echo ==========================================
echo.
echo Ce script va ouvrir le generateur d'icones professionnel
echo dans votre navigateur par defaut.
echo.
echo Apres avoir genere votre icone:
echo 1. Telechargez-la (format PNG recommande)
echo 2. Utilisez apply-custom-icon.ps1 pour l'appliquer
echo.

pause

echo Ouverture du generateur...
start "" "%~dp0create-professional-icon.html"

echo.
echo Le generateur s'ouvre dans votre navigateur.
echo Une fois votre icone creee, utilisez:
echo.
echo   apply-custom-icon.ps1
echo.
echo pour l'appliquer automatiquement.
echo.

pause