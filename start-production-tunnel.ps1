# Script PowerShell pour démarrer le backend avec tunnel
# Usage: .\start-production-tunnel.ps1

param(
    [string]$TunnelService = "ngrok",  # ngrok ou cloudflare
    [int]$Port = 3005
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "   BACKEND LOCAL POUR PRODUCTION" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Fonction pour vérifier si un port est utilisé
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Fonction pour attendre qu'un port soit disponible
function Wait-ForPort {
    param([int]$Port, [int]$TimeoutSeconds = 30)
    
    $timeout = (Get-Date).AddSeconds($TimeoutSeconds)
    
    while ((Get-Date) -lt $timeout) {
        if (Test-Port -Port $Port) {
            return $true
        }
        Start-Sleep -Seconds 1
        Write-Host "." -NoNewline
    }
    return $false
}

try {
    # Vérifier Node.js
    Write-Host "🔍 Vérification des prérequis..." -ForegroundColor Yellow
    
    $nodeVersion = node --version 2>$null
    if (-not $nodeVersion) {
        throw "Node.js n'est pas installé. Téléchargez depuis: https://nodejs.org/"
    }
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green

    # Vérifier le dossier backend
    if (-not (Test-Path "backend")) {
        throw "Dossier backend non trouvé. Assurez-vous d'être dans le répertoire racine du projet."
    }
    Write-Host "✅ Dossier backend trouvé" -ForegroundColor Green

    # Installer les dépendances
    Write-Host ""
    Write-Host "📦 Installation des dépendances backend..." -ForegroundColor Yellow
    Set-Location backend
    
    $installResult = npm install
    if ($LASTEXITCODE -ne 0) {
        throw "Erreur lors de l'installation des dépendances"
    }
    Write-Host "✅ Dépendances installées" -ForegroundColor Green

    # Démarrer le backend
    Write-Host ""
    Write-Host "🚀 Démarrage du backend local sur le port $Port..." -ForegroundColor Yellow
    
    $backendJob = Start-Job -ScriptBlock {
        param($Port)
        Set-Location $using:PWD
        npm run dev
    } -ArgumentList $Port

    # Attendre que le backend démarre
    Write-Host "⏳ Attente du démarrage du backend" -NoNewline -ForegroundColor Yellow
    if (Wait-ForPort -Port $Port -TimeoutSeconds 30) {
        Write-Host ""
        Write-Host "✅ Backend démarré avec succès sur http://localhost:$Port" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️ Le backend met du temps à démarrer, continuons..." -ForegroundColor Yellow
    }

    # Créer le tunnel
    Write-Host ""
    Write-Host "🌐 Création du tunnel public avec $TunnelService..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 INSTRUCTIONS:" -ForegroundColor Cyan
    Write-Host "   1. Copiez l'URL publique qui va apparaître" -ForegroundColor White
    Write-Host "   2. Ouvrez votre application web" -ForegroundColor White
    Write-Host "   3. Cliquez sur '⚙️ Configurer Backend'" -ForegroundColor White
    Write-Host "   4. Collez l'URL du tunnel" -ForegroundColor White
    Write-Host "   5. Testez et sauvegardez la configuration" -ForegroundColor White
    Write-Host ""

    switch ($TunnelService.ToLower()) {
        "ngrok" {
            # Vérifier ngrok
            $ngrokVersion = ngrok version 2>$null
            if (-not $ngrokVersion) {
                Write-Host "❌ ngrok n'est pas installé" -ForegroundColor Red
                Write-Host ""
                Write-Host "📥 INSTALLATION NGROK:" -ForegroundColor Yellow
                Write-Host "   1. Aller sur: https://ngrok.com/" -ForegroundColor White
                Write-Host "   2. Créer un compte gratuit" -ForegroundColor White
                Write-Host "   3. Télécharger ngrok" -ForegroundColor White
                Write-Host "   4. Configurer le token: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor White
                throw "ngrok non installé"
            }
            
            Write-Host "🔄 Démarrage de ngrok..." -ForegroundColor Yellow
            Write-Host "   (Appuyez sur Ctrl+C pour arrêter)" -ForegroundColor Gray
            Write-Host ""
            
            ngrok http $Port
        }
        "cloudflare" {
            # Vérifier cloudflared
            $cloudflaredVersion = cloudflared --version 2>$null
            if (-not $cloudflaredVersion) {
                Write-Host "❌ cloudflared n'est pas installé" -ForegroundColor Red
                Write-Host ""
                Write-Host "📥 INSTALLATION CLOUDFLARE TUNNEL:" -ForegroundColor Yellow
                Write-Host "   Télécharger depuis: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/" -ForegroundColor White
                throw "cloudflared non installé"
            }
            
            Write-Host "🔄 Démarrage de Cloudflare Tunnel..." -ForegroundColor Yellow
            Write-Host "   (Appuyez sur Ctrl+C pour arrêter)" -ForegroundColor Gray
            Write-Host ""
            
            cloudflared tunnel --url "http://localhost:$Port"
        }
        default {
            throw "Service de tunnel non supporté: $TunnelService. Utilisez 'ngrok' ou 'cloudflare'"
        }
    }

} catch {
    Write-Host ""
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    # Suggestions d'alternatives
    Write-Host "🔄 ALTERNATIVES:" -ForegroundColor Yellow
    Write-Host "   • Essayer l'autre service de tunnel:" -ForegroundColor White
    Write-Host "     .\start-production-tunnel.ps1 -TunnelService cloudflare" -ForegroundColor Gray
    Write-Host "   • Utiliser en mode développement local uniquement" -ForegroundColor White
    Write-Host "   • Déployer le backend sur un service cloud" -ForegroundColor White
    
} finally {
    # Nettoyer les jobs en arrière-plan
    if ($backendJob) {
        Write-Host ""
        Write-Host "🛑 Arrêt du backend..." -ForegroundColor Yellow
        Stop-Job $backendJob -ErrorAction SilentlyContinue
        Remove-Job $backendJob -ErrorAction SilentlyContinue
    }
    
    Set-Location ..
    Write-Host ""
    Write-Host "✅ Nettoyage terminé" -ForegroundColor Green
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")