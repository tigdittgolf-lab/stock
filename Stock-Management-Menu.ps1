# 🚀 Stock Management - Menu Principal
# Interface simple et claire pour choisir le mode

# Configuration
$AppName = "Stock Management"
$LocalUrl = "http://localhost:3001"
$CloudUrl = "https://frontend-iota-six-72.vercel.app"

function Show-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  ██████╗ ████████╗ ██████╗  ██████╗██╗  ██╗" -ForegroundColor Cyan
    Write-Host "  ██╔═══██╗╚══██╔══╝██╔═══██╗██╔════╝██║ ██╔╝" -ForegroundColor Cyan  
    Write-Host "  ██║   ██║   ██║   ██║   ██║██║     █████╔╝ " -ForegroundColor Cyan
    Write-Host "  ██║   ██║   ██║   ██║   ██║██║     ██╔═██╗ " -ForegroundColor Cyan
    Write-Host "  ╚██████╔╝   ██║   ╚██████╔╝╚██████╗██║  ██╗" -ForegroundColor Cyan
    Write-Host "   ╚═════╝    ╚═╝    ╚═════╝  ╚═════╝╚═╝  ╚═╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "           STOCK MANAGEMENT SYSTEM" -ForegroundColor White
    Write-Host "              Version 1.0.0" -ForegroundColor Gray
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Gray
}

function Test-InternetConnection {
    try {
        $response = Test-NetConnection -ComputerName "8.8.8.8" -Port 53 -InformationLevel Quiet -WarningAction SilentlyContinue
        return $response
    } catch {
        return $false
    }
}

function Test-LocalBackend {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3005/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Start-LocalMode {
    Write-Host ""
    Write-Host "🏠 DEMARRAGE MODE LOCAL" -ForegroundColor Green
    Write-Host "=" * 30 -ForegroundColor Green
    Write-Host ""
    Write-Host "Lancement du script de demarrage local..." -ForegroundColor Yellow
    
    & "$PSScriptRoot\start-local-clean.ps1"
}

function Start-CloudMode {
    Write-Host ""
    Write-Host "☁️ DEMARRAGE MODE CLOUD" -ForegroundColor Cyan
    Write-Host "=" * 30 -ForegroundColor Cyan
    Write-Host ""
    
    # Vérifier que le backend local fonctionne (nécessaire pour le cloud)
    if (-not (Test-LocalBackend)) {
        Write-Host "Demarrage du backend local (requis pour le cloud)..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; bun index.ts" -WindowStyle Normal
        Write-Host "Attente du demarrage du backend..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
    
    Write-Host "Ouverture de l'application cloud..." -ForegroundColor Green
    Start-Process $CloudUrl
    
    Write-Host ""
    Write-Host "Application cloud ouverte dans votre navigateur !" -ForegroundColor Green
}

function Show-Status {
    Write-Host ""
    Write-Host "📊 STATUT SYSTEME" -ForegroundColor Yellow
    Write-Host "=" * 20 -ForegroundColor Yellow
    
    $hasInternet = Test-InternetConnection
    $hasBackend = Test-LocalBackend
    
    Write-Host "Internet     : " -NoNewline
    if ($hasInternet) {
        Write-Host "✅ Disponible" -ForegroundColor Green
    } else {
        Write-Host "❌ Indisponible" -ForegroundColor Red
    }
    
    Write-Host "Backend Local: " -NoNewline
    if ($hasBackend) {
        Write-Host "✅ En marche (Port 3005)" -ForegroundColor Green
    } else {
        Write-Host "⏸️ Arrete" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

function Show-Menu {
    do {
        Show-Header
        Show-Status
        
        Write-Host "🎯 CHOISISSEZ VOTRE MODE" -ForegroundColor Magenta
        Write-Host "=" * 30 -ForegroundColor Magenta
        Write-Host ""
        Write-Host "1. 🏠 Mode Local" -ForegroundColor Green
        Write-Host "   • Fonctionne sans Internet"
        Write-Host "   • Donnees locales"
        Write-Host "   • Port: http://localhost:3001"
        Write-Host ""
        Write-Host "2. ☁️ Mode Cloud" -ForegroundColor Cyan  
        Write-Host "   • Necessite Internet"
        Write-Host "   • Version Vercel"
        Write-Host "   • URL: frontend-iota-six-72.vercel.app"
        Write-Host ""
        Write-Host "3. 🔄 Rafraichir le statut" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "4. ❌ Quitter" -ForegroundColor Red
        Write-Host ""
        Write-Host "=" * 60 -ForegroundColor Gray
        Write-Host ""
        
        $choice = Read-Host "Votre choix (1-4)"
        
        switch ($choice) {
            "1" { 
                Start-LocalMode
                Write-Host ""
                Read-Host "Appuyez sur Entree pour revenir au menu"
            }
            "2" { 
                Start-CloudMode
                Write-Host ""
                Read-Host "Appuyez sur Entree pour revenir au menu"
            }
            "3" { 
                # Rafraîchir - la boucle va recommencer
            }
            "4" { 
                Write-Host ""
                Write-Host "Au revoir ! 👋" -ForegroundColor Green
                return 
            }
            default { 
                Write-Host ""
                Write-Host "❌ Choix invalide. Utilisez 1, 2, 3 ou 4." -ForegroundColor Red
                Start-Sleep -Seconds 2
            }
        }
    } while ($true)
}

# === EXECUTION PRINCIPALE ===
Show-Menu