# 🚀 Stock Management - Launcher Intelligent
# Détecte automatiquement le meilleur mode (Local/Cloud)

param(
    [switch]$ForceLocal,
    [switch]$ForceCloud,
    [switch]$ShowMenu
)

# Configuration
$AppName = "Stock Management"
$LocalUrl = "http://localhost:3002"
$CloudUrl = "https://frontend-c822v6que-tigdittgolf-9191s-projects.vercel.app"
$BackendPort = 3005

# Fonction pour tester la connectivité Internet
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

# Fonction pour démarrer le mode local
function Start-LocalMode {
    Write-Host "🏠 Démarrage en Mode Local..." -ForegroundColor Green
    
    # Vérifier si le backend fonctionne déjà
    if (Test-LocalBackend) {
        Write-Host "✅ Backend déjà en marche !" -ForegroundColor Green
    } else {
        Write-Host "📊 Démarrage du Backend..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; bun index.ts" -WindowStyle Minimized
        Start-Sleep -Seconds 5
    }
    
    # Vérifier si le frontend dev fonctionne
    try {
        $frontendTest = Invoke-WebRequest -Uri $LocalUrl -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        Write-Host "✅ Frontend déjà en marche !" -ForegroundColor Green
    } catch {
        Write-Host "🌐 Démarrage du Frontend..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Minimized
        Start-Sleep -Seconds 10
    }
    
    Write-Host "🎉 Ouverture de l'application locale..." -ForegroundColor Green
    Start-Process $LocalUrl
}

# Fonction pour ouvrir le mode cloud
function Start-CloudMode {
    Write-Host "☁️ Ouverture en Mode Cloud..." -ForegroundColor Cyan
    
    # Vérifier que le backend local fonctionne (nécessaire même pour le cloud)
    if (-not (Test-LocalBackend)) {
        Write-Host "⚠️ Backend local requis même pour le mode cloud..." -ForegroundColor Yellow
        Write-Host "📊 Démarrage du Backend..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; bun index.ts" -WindowStyle Minimized
        Start-Sleep -Seconds 5
    }
    
    Write-Host "🌍 Ouverture de l'application cloud..." -ForegroundColor Green
    Start-Process $CloudUrl
}

# Interface de sélection manuelle
function Show-ModeSelection {
    Clear-Host
    Write-Host "🚀 $AppName - Sélection du Mode" -ForegroundColor Magenta
    Write-Host "=" * 50 -ForegroundColor Gray
    Write-Host ""
    Write-Host "Choisissez votre mode de lancement :" -ForegroundColor White
    Write-Host ""
    Write-Host "1. 🏠 Mode Local    (Développement, Sans Internet)" -ForegroundColor Green
    Write-Host "2. ☁️ Mode Cloud    (Production, Avec Internet)" -ForegroundColor Cyan
    Write-Host "3. 🤖 Mode Auto     (Détection automatique)" -ForegroundColor Yellow
    Write-Host "4. ❌ Annuler" -ForegroundColor Red
    Write-Host ""
    
    do {
        $choice = Read-Host "Votre choix (1-4)"
        switch ($choice) {
            "1" { Start-LocalMode; return }
            "2" { Start-CloudMode; return }
            "3" { break }
            "4" { Write-Host "Annulé."; return }
            default { Write-Host "Choix invalide. Utilisez 1, 2, 3 ou 4." -ForegroundColor Red }
        }
    } while ($choice -ne "3")
}

# === LOGIQUE PRINCIPALE ===

Write-Host "🚀 $AppName - Launcher Intelligent" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Gray

# Mode forcé par paramètre
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

# === DÉTECTION AUTOMATIQUE ===

Write-Host "🤖 Détection automatique du meilleur mode..." -ForegroundColor Yellow

# Test 1: Internet disponible ?
$hasInternet = Test-InternetConnection
Write-Host "🌐 Internet: $(if($hasInternet){'✅ Disponible'}else{'❌ Indisponible'})" -ForegroundColor $(if($hasInternet){'Green'}else{'Red'})

# Test 2: Backend local disponible ?
$hasLocalBackend = Test-LocalBackend
Write-Host "📊 Backend Local: $(if($hasLocalBackend){'✅ En marche'}else{'❌ Arrêté'})" -ForegroundColor $(if($hasLocalBackend){'Green'}else{'Yellow'})

Write-Host ""

# Logique de décision intelligente
if ($hasInternet -and $hasLocalBackend) {
    Write-Host "🎯 Recommandation: Mode Cloud (Performance + Accès externe)" -ForegroundColor Cyan
    Write-Host "Voulez-vous utiliser le mode Cloud ? (O/n): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "" -or $response -eq "O" -or $response -eq "o" -or $response -eq "Y" -or $response -eq "y") {
        Start-CloudMode
    } else {
        Start-LocalMode
    }
} elseif ($hasLocalBackend) {
    Write-Host "🎯 Mode Local sélectionné (Backend déjà en marche)" -ForegroundColor Green
    Start-LocalMode
} elseif ($hasInternet) {
    Write-Host "🎯 Démarrage en Mode Local (Backend requis même pour le cloud)" -ForegroundColor Yellow
    Start-LocalMode
} else {
    Write-Host "🎯 Mode Local sélectionné (Pas d'Internet)" -ForegroundColor Green
    Start-LocalMode
}

Write-Host ""
Write-Host "✅ Launcher terminé. Bonne utilisation !" -ForegroundColor Green
Read-Host "Appuyez sur Entrée pour fermer"