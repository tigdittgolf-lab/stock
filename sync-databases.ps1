# Script PowerShell pour synchroniser les bases de données
# Usage: .\sync-databases.ps1 [-Verify] [-Help]

param(
    [switch]$Verify,
    [switch]$Help
)

function Show-Help {
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  Script de Synchronisation des Bases de Données       ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  .\sync-databases.ps1              Synchroniser les bases"
    Write-Host "  .\sync-databases.ps1 -Verify      Vérifier la synchronisation"
    Write-Host "  .\sync-databases.ps1 -Help        Afficher cette aide"
    Write-Host ""
    Write-Host "PRÉREQUIS:" -ForegroundColor Yellow
    Write-Host "  1. Node.js installé"
    Write-Host "  2. Fichier .env configuré avec les credentials"
    Write-Host "  3. npm install exécuté"
    Write-Host ""
    Write-Host "EXEMPLES:" -ForegroundColor Yellow
    Write-Host "  # Première utilisation"
    Write-Host "  npm install"
    Write-Host "  cp .env.example .env"
    Write-Host "  # Éditer .env avec vos credentials"
    Write-Host "  .\sync-databases.ps1"
    Write-Host ""
}

function Check-Prerequisites {
    Write-Host "🔍 Vérification des prérequis..." -ForegroundColor Cyan
    
    # Vérifier Node.js
    try {
        $nodeVersion = node --version
        Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Node.js n'est pas installé" -ForegroundColor Red
        Write-Host "     Téléchargez-le depuis: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
    
    # Vérifier .env
    if (-not (Test-Path ".env")) {
        Write-Host "  ❌ Fichier .env manquant" -ForegroundColor Red
        Write-Host "     Copiez .env.example vers .env et configurez-le" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  ✅ Fichier .env trouvé" -ForegroundColor Green
    
    # Vérifier node_modules
    if (-not (Test-Path "node_modules")) {
        Write-Host "  ⚠️  node_modules manquant, installation..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
            exit 1
        }
    }
    Write-Host "  ✅ Dépendances installées" -ForegroundColor Green
    Write-Host ""
}

function Run-Sync {
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  Synchronisation des Fonctions et Procédures          ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    Check-Prerequisites
    
    Write-Host "🚀 Démarrage de la synchronisation..." -ForegroundColor Cyan
    Write-Host ""
    
    node sync-database-objects-pg.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "✅ SYNCHRONISATION TERMINÉE AVEC SUCCÈS" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "📁 Fichiers générés:" -ForegroundColor Yellow
        Get-ChildItem -Filter "database-sync-*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object {
            Write-Host "   - $($_.Name)" -ForegroundColor Cyan
        }
        Get-ChildItem -Filter "database-sync-*-report.txt" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object {
            Write-Host "   - $($_.Name)" -ForegroundColor Cyan
        }
        Write-Host ""
        Write-Host "💡 Conseil: Exécutez '.\sync-databases.ps1 -Verify' pour vérifier" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host "❌ ERREUR LORS DE LA SYNCHRONISATION" -ForegroundColor Red
        Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host ""
        Write-Host "Consultez les logs ci-dessus pour plus de détails" -ForegroundColor Yellow
        exit 1
    }
}

function Run-Verify {
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  Vérification de la Synchronisation                   ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    Check-Prerequisites
    
    node verify-sync.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Vérification terminée" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Erreur lors de la vérification" -ForegroundColor Red
        exit 1
    }
}

# Main
if ($Help) {
    Show-Help
} elseif ($Verify) {
    Run-Verify
} else {
    Run-Sync
}
