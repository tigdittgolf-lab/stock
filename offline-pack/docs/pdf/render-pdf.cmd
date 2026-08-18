@echo off
REM ============================================================
REM  render-pdf.cmd
REM  Rend un HTML en PDF A4 multi-pages via Playwright.
REM
REM  Usage :
REM    render-pdf.cmd <input.html> <output.pdf>
REM    render-pdf.cmd --all        (rend tous les PDFs listés ci-dessous)
REM
REM  Rend NODE_PATH transparent : pointe vers le Playwright installe
REM  globalement (npm i -g playwright), meme si le dossier courant
REM  ne le resout pas.
REM ============================================================
setlocal

REM --- Localiser le node_modules global (npm root -g) ---
for /f "delims=" %%G in ('npm root -g') do set "GLOBAL_NM=%%G"
if not exist "%GLOBAL_NM%\playwright\index.js" (
  echo [ERREUR] Playwright introuvable dans "%GLOBAL_NM%".
  echo           Installez-le :  npm install -g playwright
  exit /b 1
)
set "NODE_PATH=%GLOBAL_NM%"
set "SCRIPT_DIR=%~dp0"

if /i "%~1"=="--all" goto :all

if "%~1"=="" goto :usage
if "%~2"=="" goto :usage

node "%SCRIPT_DIR%render-presentation.cjs" "%~1" "%~2"
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :done
if exist "%SCRIPT_DIR%verify-pages.cjs" (
  echo.
  echo --- verification anti-debordement A4 ---
  node "%SCRIPT_DIR%verify-pages.cjs" "%~1"
  set "RC=%ERRORLEVEL%"
)
:done
endlocal & exit /b %RC%

:all
echo Rendu de tous les PDFs...
if exist "%SCRIPT_DIR%presentation-stockapp.html" (
  echo   - PRESENTATION_ACTIONNAIRES.pdf
  call "%~f0" "%SCRIPT_DIR%presentation-stockapp.html" "%SCRIPT_DIR%PRESENTATION_ACTIONNAIRES.pdf"
)
if exist "%SCRIPT_DIR%guide-installation-utilisation.html" (
  echo   - GUIDE_INSTALLATION_ET_UTILISATION.pdf
  call "%~f0" "%SCRIPT_DIR%guide-installation-utilisation.html" "%SCRIPT_DIR%GUIDE_INSTALLATION_ET_UTILISATION.pdf"
)
if exist "%SCRIPT_DIR%guide-depannage.html" (
  echo   - GUIDE_DEPANNAGE_OFFLINE.pdf
  call "%~f0" "%SCRIPT_DIR%guide-depannage.html" "%SCRIPT_DIR%GUIDE_DEPANNAGE_OFFLINE.pdf"
)
echo.
echo Termine. PDFs dans : %SCRIPT_DIR%
endlocal & exit /b 0

:usage
echo Usage :
echo   %~nx0 ^<input.html^> ^<output.pdf^>
echo   %~nx0 --all        ^(rend les 3 PDFs de la documentation^)
echo.
echo Le HTML doit utiliser le layout .page A4 (voir render-presentation.cjs).
endlocal & exit /b 1
