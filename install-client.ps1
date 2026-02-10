# Script d'installation automatique pour client
# Stock Management System - Installation Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stock Management - Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier les droits admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERREUR: Ce script necessite les droits administrateur" -ForegroundColor Red
    Write-Host "Clic droit sur le script > Executer en tant qu'administrateur" -ForegroundColor Yellow
    pause
    exit 1
}

# Configuration
$INSTALL_DIR = "C:\StockManagement"
$MYSQL_ROOT_PASSWORD = ""
$APP_DB_PASSWORD = "StockApp2024!"

Write-Host "1. Verification des prerequis..." -ForegroundColor Yellow

# Vérifier Node.js
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  Node.js: NON INSTALLE" -ForegroundColor Red
    Write-Host "  Telechargement de Node.js..." -ForegroundColor Yellow
    $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
    Start-Process msiexec.exe -ArgumentList "/i $nodeInstaller /quiet /norestart" -Wait
    Write-Host "  Node.js installe!" -ForegroundColor Green
}

# Vérifier Bun
$bunVersion = bun --version 2>$null
if ($bunVersion) {
    Write-Host "  Bun: $bunVersion" -ForegroundColor Green
} else {
    Write-Host "  Bun: NON INSTALLE" -ForegroundColor Red
    Write-Host "  Installation de Bun..." -ForegroundColor Yellow
    powershell -c "irm bun.sh/install.ps1 | iex"
    Write-Host "  Bun installe!" -ForegroundColor Green
}

# Vérifier MySQL
$mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
if ($mysqlService) {
    Write-Host "  MySQL: INSTALLE" -ForegroundColor Green
} else {
    Write-Host "  MySQL: NON INSTALLE" -ForegroundColor Red
    Write-Host "  Veuillez installer MySQL manuellement depuis:" -ForegroundColor Yellow
    Write-Host "  https://dev.mysql.com/downloads/installer/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Appuyez sur une touche apres l'installation de MySQL..." -ForegroundColor Yellow
    pause
}

Write-Host ""
Write-Host "2. Creation du repertoire d'installation..." -ForegroundColor Yellow
if (Test-Path $INSTALL_DIR) {
    Write-Host "  Le repertoire existe deja. Voulez-vous le supprimer? (O/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "O" -or $response -eq "o") {
        Remove-Item -Path $INSTALL_DIR -Recurse -Force
        Write-Host "  Repertoire supprime" -ForegroundColor Green
    }
}
New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null
Write-Host "  Repertoire cree: $INSTALL_DIR" -ForegroundColor Green

Write-Host ""
Write-Host "3. Telechargement de l'application..." -ForegroundColor Yellow
Set-Location $INSTALL_DIR
git clone https://github.com/tigdittgolf-lab/stock.git .
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERREUR: Impossible de cloner le repository" -ForegroundColor Red
    Write-Host "  Verifiez que Git est installe" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host "  Application telechargee!" -ForegroundColor Green

Write-Host ""
Write-Host "4. Installation des dependances..." -ForegroundColor Yellow
Write-Host "  Backend..." -ForegroundColor Yellow
Set-Location "$INSTALL_DIR\backend"
bun install
Write-Host "  Frontend..." -ForegroundColor Yellow
Set-Location "$INSTALL_DIR\frontend"
npm install
Write-Host "  Dependances installees!" -ForegroundColor Green

Write-Host ""
Write-Host "5. Configuration de la base de donnees..." -ForegroundColor Yellow
Write-Host "  Entrez le mot de passe root MySQL:" -ForegroundColor Yellow
$MYSQL_ROOT_PASSWORD = Read-Host -AsSecureString
$MYSQL_ROOT_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($MYSQL_ROOT_PASSWORD))

# Créer la base de données
$mysqlCommands = @"
CREATE DATABASE IF NOT EXISTS stock_management;
USE stock_management;
CREATE USER IF NOT EXISTS 'stock_user'@'localhost' IDENTIFIED BY '$APP_DB_PASSWORD';
GRANT ALL PRIVILEGES ON stock_management.* TO 'stock_user'@'localhost';
FLUSH PRIVILEGES;
"@

$mysqlCommands | mysql -u root -p$MYSQL_ROOT_PASSWORD_PLAIN

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Base de donnees creee!" -ForegroundColor Green
} else {
    Write-Host "  ERREUR: Impossible de creer la base de donnees" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "6. Configuration des fichiers..." -ForegroundColor Yellow

# Backend .env
$backendEnv = @"
DB_HOST=localhost
DB_PORT=3306
DB_USER=stock_user
DB_PASSWORD=$APP_DB_PASSWORD
DB_NAME=stock_management
PORT=3005
NODE_ENV=production
JWT_SECRET=$(New-Guid)
"@
$backendEnv | Out-File -FilePath "$INSTALL_DIR\backend\.env" -Encoding UTF8
Write-Host "  Backend configure" -ForegroundColor Green

# Frontend .env.local
$frontendEnv = @"
NEXT_PUBLIC_API_URL=http://localhost:3005
BACKEND_URL=http://localhost:3005
"@
$frontendEnv | Out-File -FilePath "$INSTALL_DIR\frontend\.env.local" -Encoding UTF8
Write-Host "  Frontend configure" -ForegroundColor Green

Write-Host ""
Write-Host "7. Creation des scripts de demarrage..." -ForegroundColor Yellow

# Script de démarrage
$startScript = @"
@echo off
echo Demarrage de Stock Management...
echo.

REM Demarrer MySQL
net start MySQL80 2>nul
if errorlevel 1 (
    echo MySQL deja demarre ou erreur
)

REM Demarrer le backend
start "Stock Backend" cmd /k "cd /d $INSTALL_DIR\backend && bun run dev"

REM Attendre 5 secondes
timeout /t 5 /nobreak >nul

REM Demarrer le frontend
start "Stock Frontend" cmd /k "cd /d $INSTALL_DIR\frontend && npm run dev"

echo.
echo Application demarree!
echo Backend: http://localhost:3005
echo Frontend: http://localhost:3000
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause >nul
"@
$startScript | Out-File -FilePath "$INSTALL_DIR\start-app.bat" -Encoding ASCII

# Script d'arrêt
$stopScript = @"
@echo off
echo Arret de Stock Management...
taskkill /FI "WINDOWTITLE eq Stock Backend*" /F
taskkill /FI "WINDOWTITLE eq Stock Frontend*" /F
echo Application arretee!
pause
"@
$stopScript | Out-File -FilePath "$INSTALL_DIR\stop-app.bat" -Encoding ASCII

Write-Host "  Scripts crees!" -ForegroundColor Green

Write-Host ""
Write-Host "8. Configuration du pare-feu..." -ForegroundColor Yellow
netsh advfirewall firewall add rule name="Stock Backend" dir=in action=allow protocol=TCP localport=3005 | Out-Null
netsh advfirewall firewall add rule name="Stock Frontend" dir=in action=allow protocol=TCP localport=3000 | Out-Null
Write-Host "  Pare-feu configure!" -ForegroundColor Green

Write-Host ""
Write-Host "9. Creation du raccourci sur le bureau..." -ForegroundColor Yellow
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Stock Management.lnk")
$Shortcut.TargetPath = "$INSTALL_DIR\start-app.bat"
$Shortcut.WorkingDirectory = $INSTALL_DIR
$Shortcut.IconLocation = "$INSTALL_DIR\frontend\public\icon.ico"
$Shortcut.Description = "Stock Management System"
$Shortcut.Save()
Write-Host "  Raccourci cree!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  INSTALLATION TERMINEE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pour demarrer l'application:" -ForegroundColor Yellow
Write-Host "  - Double-cliquez sur le raccourci 'Stock Management' sur le bureau" -ForegroundColor White
Write-Host "  - OU executez: $INSTALL_DIR\start-app.bat" -ForegroundColor White
Write-Host ""
Write-Host "Acces:" -ForegroundColor Yellow
Write-Host "  - Interface: http://localhost:3000" -ForegroundColor White
Write-Host "  - API: http://localhost:3005" -ForegroundColor White
Write-Host ""
Write-Host "Identifiants par defaut:" -ForegroundColor Yellow
Write-Host "  - Utilisateur: admin" -ForegroundColor White
Write-Host "  - Mot de passe: admin" -ForegroundColor White
Write-Host "  (A changer lors de la premiere connexion)" -ForegroundColor Red
Write-Host ""
Write-Host "Documentation: $INSTALL_DIR\GUIDE_INSTALLATION_CLIENT.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "Voulez-vous demarrer l'application maintenant? (O/N)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq "O" -or $response -eq "o") {
    Start-Process "$INSTALL_DIR\start-app.bat"
}

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Gray
pause
