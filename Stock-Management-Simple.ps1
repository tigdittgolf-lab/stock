# Stock Management - Menu Simple
# Interface claire pour choisir le mode

function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "       STOCK MANAGEMENT SYSTEM" -ForegroundColor White
    Write-Host "            Version 1.0.0" -ForegroundColor Gray
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Test rapide du statut
    Write-Host "STATUT SYSTEME:" -ForegroundColor Yellow
    
    try {
        $internetTest = Test-NetConnection -ComputerName "8.8.8.8" -Port 53 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($internetTest) {
            Write-Host "Internet     : Disponible" -ForegroundColor Green
        } else {
            Write-Host "Internet     : Indisponible" -ForegroundColor Red
        }
    } catch {
        Write-Host "Internet     : Indisponible" -ForegroundColor Red
    }
    
    try {
        $backendTest = Invoke-WebRequest -Uri "http://localhost:3005/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($backendTest.StatusCode -eq 200) {
            Write-Host "Backend Local: En marche (Port 3005)" -ForegroundColor Green
        } else {
            Write-Host "Backend Local: Arrete" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Backend Local: Arrete" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "CHOISISSEZ VOTRE MODE:" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "1. Mode Local" -ForegroundColor Green
    Write-Host "   - Fonctionne sans Internet"
    Write-Host "   - Donnees locales"
    Write-Host "   - URL: http://localhost:3001"
    Write-Host ""
    Write-Host "2. Mode Cloud" -ForegroundColor Cyan
    Write-Host "   - Necessite Internet"
    Write-Host "   - Version Vercel"
    Write-Host "   - URL: frontend-iota-six-72.vercel.app"
    Write-Host ""
    Write-Host "3. Quitter" -ForegroundColor Red
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Gray
    Write-Host ""
}

function Start-LocalMode {
    Write-Host ""
    Write-Host "DEMARRAGE MODE LOCAL..." -ForegroundColor Green
    Write-Host "Lancement du script de demarrage..." -ForegroundColor Yellow
    
    & "$PSScriptRoot\start-local-clean.ps1"
}

function Start-CloudMode {
    Write-Host ""
    Write-Host "DEMARRAGE MODE CLOUD..." -ForegroundColor Cyan
    
    # Vérifier le backend
    try {
        $backendTest = Invoke-WebRequest -Uri "http://localhost:3005/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($backendTest.StatusCode -ne 200) {
            Write-Host "Demarrage du backend local..." -ForegroundColor Yellow
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; bun index.ts" -WindowStyle Normal
            Start-Sleep -Seconds 3
        }
    } catch {
        Write-Host "Demarrage du backend local..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; bun index.ts" -WindowStyle Normal
        Start-Sleep -Seconds 3
    }
    
    Write-Host "Ouverture de l'application cloud..." -ForegroundColor Green
    Start-Process "https://frontend-iota-six-72.vercel.app"
    
    Write-Host "Application cloud ouverte !" -ForegroundColor Green
}

# === MENU PRINCIPAL ===
do {
    Show-Menu
    
    $choice = Read-Host "Votre choix (1-3)"
    
    switch ($choice) {
        "1" { 
            Start-LocalMode
            Write-Host ""
            Read-Host "Appuyez sur Entree pour continuer"
        }
        "2" { 
            Start-CloudMode
            Write-Host ""
            Read-Host "Appuyez sur Entree pour continuer"
        }
        "3" { 
            Write-Host ""
            Write-Host "Au revoir !" -ForegroundColor Green
            break
        }
        default { 
            Write-Host ""
            Write-Host "Choix invalide. Utilisez 1, 2 ou 3." -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
} while ($choice -ne "3")