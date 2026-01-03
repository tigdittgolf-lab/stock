@echo off
title Choisir Icone Stock Management
cls

echo ==========================================
echo    Choisir l'Icone Stock Management
echo ==========================================
echo.
echo ATTENTION: Ce script utilise des icones systeme basiques.
echo Pour une icone professionnelle, utilisez: apply-custom-icon.ps1
echo.
echo Quelle icone systeme preferez-vous ?
echo.
echo 1. Boites empilees (Entrepot)
echo 2. Graphiques et statistiques  
echo 3. Dossier reseau/Base de donnees
echo 4. Calculatrice/Gestion
echo 5. Outils/Configuration
echo 6. Ouvrir le generateur d'icones professionnel
echo.

set /p choice="Votre choix (1-6): "

if "%choice%"=="6" (
    echo.
    echo Ouverture du generateur d'icones professionnel...
    powershell -ExecutionPolicy Bypass -File "%~dp0apply-custom-icon.ps1" -OpenGenerator
    goto :end
)

echo.
echo Verification du raccourci existant...

set "shortcutPath=%USERPROFILE%\Desktop\Stock Management.lnk"
set "launcherPath=%~dp0Stock-Management-Launcher.ps1"

if not exist "%launcherPath%" (
    echo ERREUR: Script launcher non trouve: %launcherPath%
    echo Verifiez que Stock-Management-Launcher.ps1 existe dans ce dossier.
    pause
    goto :end
)

echo Creation/Mise a jour du raccourci avec icone...

if "%choice%"=="1" (
    powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%shortcutPath%'); $Shortcut.TargetPath = 'powershell.exe'; $Shortcut.Arguments = '-ExecutionPolicy Bypass -WindowStyle Hidden -File \"%launcherPath%\"'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = 'shell32.dll,46'; $Shortcut.Description = 'Stock Management - Application Intelligente'; $Shortcut.Save(); Write-Host 'Icone Boites empilees appliquee !'"
)
if "%choice%"=="2" (
    powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%shortcutPath%'); $Shortcut.TargetPath = 'powershell.exe'; $Shortcut.Arguments = '-ExecutionPolicy Bypass -WindowStyle Hidden -File \"%launcherPath%\"'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = 'shell32.dll,247'; $Shortcut.Description = 'Stock Management - Application Intelligente'; $Shortcut.Save(); Write-Host 'Icone Graphiques appliquee !'"
)
if "%choice%"=="3" (
    powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%shortcutPath%'); $Shortcut.TargetPath = 'powershell.exe'; $Shortcut.Arguments = '-ExecutionPolicy Bypass -WindowStyle Hidden -File \"%launcherPath%\"'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = 'shell32.dll,275'; $Shortcut.Description = 'Stock Management - Application Intelligente'; $Shortcut.Save(); Write-Host 'Icone Dossier reseau appliquee !'"
)
if "%choice%"=="4" (
    powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%shortcutPath%'); $Shortcut.TargetPath = 'powershell.exe'; $Shortcut.Arguments = '-ExecutionPolicy Bypass -WindowStyle Hidden -File \"%launcherPath%\"'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = 'shell32.dll,23'; $Shortcut.Description = 'Stock Management - Application Intelligente'; $Shortcut.Save(); Write-Host 'Icone Calculatrice appliquee !'"
)
if "%choice%"=="5" (
    powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%shortcutPath%'); $Shortcut.TargetPath = 'powershell.exe'; $Shortcut.Arguments = '-ExecutionPolicy Bypass -WindowStyle Hidden -File \"%launcherPath%\"'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = 'imageres.dll,109'; $Shortcut.Description = 'Stock Management - Application Intelligente'; $Shortcut.Save(); Write-Host 'Icone Outils appliquee !'"
)

if "%choice%" geq "1" if "%choice%" leq "5" (
    echo.
    echo Icone mise a jour ! Regardez votre desktop.
    echo Si l'icone ne change pas immediatement, faites F5 sur le desktop.
    echo.
    echo CONSEIL: Pour une icone plus professionnelle, utilisez:
    echo apply-custom-icon.ps1
) else (
    echo Choix invalide. Utilisez 1, 2, 3, 4, 5 ou 6.
)

:end
pause