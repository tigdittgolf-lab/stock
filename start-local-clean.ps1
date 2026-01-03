# 🚀 Démarrage Local Propre - Stock Management
# Script pour démarrer l'application locale en nettoyant d'abord

Write-Host "Demarrage Local Propre - Stock Management" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host ""

# Étape 1: Nettoyer tous les processus
Write-Host "Etape 1: Nettoyage des processus existants..." -ForegroundColor Yellow
& "$PSScriptRoot\kill-all-processes.ps1"

Write-Host ""
Write-Host "Etape 2: Nettoyage des fichiers de verrous..." -ForegroundColor Yellow

# Supprimer les verrous Next.js
$lockPaths = @(
    "frontend\.next\dev\lock",
    "frontend\.next\cache",
    "frontend\.next\dev"
)

foreach ($lockPath in $lockPaths) {
    if (Test-Path $lockPath) {
        Remove-Item $lockPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Supprime: $lockPath" -ForegroundColor Green
    }
}

# Supprimer les fichiers de cache
$cachePaths = @(
    "frontend\node_modules\.cache",
    "backend\node_modules\.cache"
)

foreach ($cachePath in $cachePaths) {
    if (Test-Path $cachePath) {
        Remove-Item $cachePath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Cache supprime: $cachePath" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Etape 3: Demarrage du Backend..." -ForegroundColor Yellow

# Démarrer le backend
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command", 
    "cd '$PSScriptRoot\backend'; Write-Host 'Demarrage Backend...' -ForegroundColor Green; bun index.ts"
) -WindowStyle Normal

Write-Host "  Backend en cours de demarrage..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Vérifier que le backend fonctionne
$backendReady = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3005/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "  Backend pret !" -ForegroundColor Green
            $backendReady = $true
            break
        }
    } catch {
        Write-Host "  Tentative $i/10 - Backend en cours de demarrage..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $backendReady) {
    Write-Host "  ATTENTION: Backend pas encore pret, mais on continue..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Etape 4: Demarrage du Frontend..." -ForegroundColor Yellow

# Démarrer le frontend avec nettoyage
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command", 
    "cd '$PSScriptRoot'; .\start-frontend-3001.ps1"
) -WindowStyle Normal

Write-Host "  Frontend en cours de demarrage..." -ForegroundColor Cyan
Start-Sleep -Seconds 8

# Vérifier que le frontend fonctionne sur différents ports possibles
$frontendReady = $false
$frontendPort = $null
$possiblePorts = @(3001, 3002, 3003, 3000)

for ($i = 1; $i -le 15; $i++) {
    foreach ($port in $possiblePorts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "  Frontend pret sur le port $port !" -ForegroundColor Green
                $frontendReady = $true
                $frontendPort = $port
                break
            }
        } catch {
            # Continue to next port
        }
    }
    
    if ($frontendReady) {
        break
    }
    
    Write-Host "  Tentative $i/15 - Frontend en cours de demarrage..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

Write-Host ""
if ($frontendReady -and $frontendPort) {
    Write-Host "SUCCES ! Application locale prete !" -ForegroundColor Green
    Write-Host "Ouverture du navigateur..." -ForegroundColor Cyan
    Start-Process "http://localhost:$frontendPort"
    
    Write-Host ""
    Write-Host "Application Stock Management demarree en mode local !" -ForegroundColor Green
    Write-Host "Frontend: http://localhost:$frontendPort" -ForegroundColor Cyan
    Write-Host "Backend:  http://localhost:3005" -ForegroundColor Cyan
} else {
    Write-Host "Frontend en cours de demarrage..." -ForegroundColor Yellow
    Write-Host "Ouverture du navigateur (peut prendre quelques secondes)..." -ForegroundColor Cyan
    
    # Essayer d'ouvrir sur le port le plus probable
    $defaultPort = 3001
    if ($frontendPort) {
        $defaultPort = $frontendPort
    }
    Start-Process "http://localhost:$defaultPort"
    
    Write-Host ""
    Write-Host "Application Stock Management en cours de demarrage..." -ForegroundColor Yellow
    Write-Host "Frontend: http://localhost:$defaultPort (en cours)" -ForegroundColor Yellow
    Write-Host "Backend:  http://localhost:3005" -ForegroundColor Cyan
}

Write-Host ""
Read-Host "Appuyez sur Entree pour fermer ce script (les serveurs continuent)"