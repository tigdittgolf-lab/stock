@echo off
REM Script batch pour synchroniser les bases de données
REM Usage: sync-databases.bat [test|sync|verify|rollback|help]

setlocal enabledelayedexpansion

set "ACTION=%1"

if "%ACTION%"=="" set "ACTION=sync"

echo.
echo ========================================================
echo   Synchronisation des Bases de Donnees
echo ========================================================
echo.

REM Vérifier Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Node.js n'est pas installe
    echo Telechargez-le depuis: https://nodejs.org/
    exit /b 1
)

REM Vérifier .env
if not exist ".env" (
    echo [ERREUR] Fichier .env manquant
    echo Copiez .env.example vers .env et configurez-le
    echo.
    echo Commande: copy .env.example .env
    exit /b 1
)

REM Vérifier node_modules
if not exist "node_modules" (
    echo [INFO] Installation des dependances...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERREUR] Echec de l'installation
        exit /b 1
    )
)

if "%ACTION%"=="help" goto :help
if "%ACTION%"=="test" goto :test
if "%ACTION%"=="sync" goto :sync
if "%ACTION%"=="verify" goto :verify
if "%ACTION%"=="rollback" goto :rollback

echo [ERREUR] Action inconnue: %ACTION%
echo Utilisez: sync-databases.bat help
exit /b 1

:help
echo USAGE:
echo   sync-databases.bat [action]
echo.
echo ACTIONS:
echo   test      - Tester la connexion
echo   sync      - Synchroniser les bases (defaut)
echo   verify    - Verifier la synchronisation
echo   rollback  - Annuler la synchronisation (ATTENTION!)
echo   help      - Afficher cette aide
echo.
echo EXEMPLES:
echo   sync-databases.bat
echo   sync-databases.bat test
echo   sync-databases.bat verify
echo.
goto :end

:test
echo [INFO] Test de connexion...
echo.
call npm run test-connection
goto :end

:sync
echo [INFO] Synchronisation en cours...
echo.
call npm run sync-db
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SYNCHRONISATION TERMINEE AVEC SUCCES
    echo ========================================================
    echo.
    echo Fichiers generes:
    for /f "delims=" %%f in ('dir /b /o-d database-sync-*.sql 2^>nul') do (
        echo   - %%f
        goto :found_sql
    )
    :found_sql
    for /f "delims=" %%f in ('dir /b /o-d database-sync-*-report.txt 2^>nul') do (
        echo   - %%f
        goto :found_report
    )
    :found_report
    echo.
    echo Conseil: Executez 'sync-databases.bat verify' pour verifier
) else (
    echo.
    echo ========================================================
    echo   ERREUR LORS DE LA SYNCHRONISATION
    echo ========================================================
    echo.
    echo Consultez les logs ci-dessus pour plus de details
)
goto :end

:verify
echo [INFO] Verification de la synchronisation...
echo.
call npm run verify-sync
goto :end

:rollback
echo.
echo ========================================================
echo   ATTENTION: OPERATION DESTRUCTIVE
echo ========================================================
echo.
echo Cette operation va supprimer les fonctions et procedures
echo de tous les schemas cibles (sauf 2025_bu01)
echo.
set /p "CONFIRM=Etes-vous sur de vouloir continuer ? (oui/non): "
if /i not "%CONFIRM%"=="oui" (
    echo.
    echo Operation annulee
    goto :end
)
echo.
call npm run rollback
goto :end

:end
echo.
endlocal
