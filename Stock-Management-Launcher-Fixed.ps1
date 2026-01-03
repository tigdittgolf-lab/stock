# Stock Management - Launcher Intelligent Corrige
# Detecte automatiquement le meilleur mode (Local/Cloud)

param(
    [switch]$ForceLocal,
    [switch]$ForceCloud,
    [switch]$ShowMenu
)

# Configuration
$AppName = "Stock Management"
$LocalUrl = "http://localhost:3001"
$CloudUrl = "https://frontend-iota-six-72.vercel.app"
$BackendPort = 3005

# Fonction pour tester la connectivite Internet
function Test-InternetConnection {
    try {
        $response = Test-NetConnection -ComputerName "8.8.8.8" -Port 53 -InformationLevel Quiet -WarningAction SilentlyContinue
        return $response
    } catch {
        return $false
    }
}

# Fonction pour tester si le backend local fonctionne
function Test-LocalBackend {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$BackendPort/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# Fonction pour demarrer le mode local
function Start-LocalMode {
    Write-Host "Demarrage en Mode Local..." -ForegroundColor Green
    
    # Utiliser le script de demarrage propre
    Write-Host "Utilisation du demarrage propre pour eviter les conflits..." -ForegroundColor Cyan
    & "$PSScriptRoot\start-local-clean.ps1"
}

# Fonction pour ouvrir le mode cloud
function Start-CloudMode {
    Write-Host "Ouverture en Mode Cloud..." -ForegroundColor Cyan
    
    # Verifier que le backend local fonctionne (necessaire meme pour le cloud)
    if (-not (Test-LocalBackend)) {
        Write-Host "Backend local requis meme pour le mode cloud..." -ForegroundColor Yellow
        Write-Host "Demarrage du Backend..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; bun index.ts" -WindowStyle Minimized
        Start-Sleep -Seconds 5
    }
    
    Write-Host "Ouverture de l'application cloud Vercel..." -ForegroundColor Green
    Start-Process $CloudUrl
}

# Interface de selection manuelle
function Show-ModeSelection {
    Clear-Host
    Write-Host "$AppName - Selection du Mode" -ForegroundColor Magenta
    Write-Host "=" * 50 -ForegroundColor Gray
    Write-Host ""
    Write-Host "Choisissez votre mode de lancement :" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Mode Local    (Developpement, Sans Internet)" -ForegroundColor Green
    Write-Host "2. Mode Cloud    (Production, Avec Internet)" -ForegroundColor Cyan
    Write-Host "3. Mode Auto     (Detection automatique)" -ForegroundColor Yellow
    Write-Host "4. Annuler" -ForegroundColor Red
    Write-Host ""
    
    do {
        $choice = Read-Host "Votre choix (1-4)"
        switch ($choice) {
            "1" { Start-LocalMode; return }
            "2" { Start-CloudMode; return }
            "3" { break }
            "4" { Write-Host "Annule."; return }
            default { Write-Host "Choix invalide. Utilisez 1, 2, 3 ou 4." -ForegroundColor Red }
        }
    } while ($choice -ne "3")
}

# === LOGIQUE PRINCIPALE ===

Write-Host "$AppName - Launcher Intelligent" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Gray

# Mode force par parametre
if ($ForceLocal) {
    Start-LocalMode
    return
}

if ($ForceCloud) {
    Start-CloudMode
    return
}

if ($ShowMenu) {
    Show-ModeSelection
    return
}

# === DETECTION AUTOMATIQUE ===

Write-Host "Detection automatique du meilleur mode..." -ForegroundColor Yellow

# Test 1: Internet disponible ?
$hasInternet = Test-InternetConnection
Write-Host "Internet: $(if($hasInternet){'Disponible'}else{'Indisponible'})" -ForegroundColor $(if($hasInternet){'Green'}else{'Red'})

# Test 2: Backend local disponible ?
$hasLocalBackend = Test-LocalBackend
Write-Host "Backend Local: $(if($hasLocalBackend){'En marche'}else{'Arrete'})" -ForegroundColor $(if($hasLocalBackend){'Green'}else{'Yellow'})

Write-Host ""
Write-Host "MENU DE SELECTION FORCE - Choisissez votre mode:" -ForegroundColor Magenta
Write-Host ""

# Toujours afficher le menu de sélection
Show-ModeSelection

Write-Host ""
Write-Host "Launcher termine. Bonne utilisation !" -ForegroundColor Green
Read-Host "Appuyez sur Entree pour fermer"