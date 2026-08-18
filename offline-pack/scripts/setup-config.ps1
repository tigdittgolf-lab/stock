# =====================================================================
#  setup-config.ps1
#  Assistant de configuration du mode offline.
# =====================================================================
#  Demande a l'utilisateur comment il va utiliser l'application et
#  genere le fichier config.env utilise par le lanceur principal.
#
#  Trois modes :
#    - standalone : 1 seul PC, tout en localhost
#    - server     : ce PC heberge MySQL + backend pour le reseau LAN
#    - client     : ce PC se connecte a un serveur existant sur le LAN
# =====================================================================
[CmdletBinding()]
param(
    [string]$AppRoot,
    [switch]$NonInteractive
)

if (-not $AppRoot) { $AppRoot = Split-Path -Parent $PSScriptRoot }
$ConfigPath = Join-Path $AppRoot 'config.env'
$ConfigExamplePath = Join-Path $AppRoot 'scripts'

function Get-LocalIp {
    try {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 |
               Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.PrefixOrigin -eq 'Dhcp' } |
               Select-Object -First 1).IPAddress
        if (-not $ip) {
            $ip = (Get-NetIPAddress -AddressFamily IPv4 |
                   Where-Object { $_.InterfaceAlias -notmatch 'Loopback' } |
                   Select-Object -First 1).IPAddress
        }
        return $ip
    } catch {
        return $null
    }
}

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "  Configuration du mode offline - StockApp" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""

# --- Mode d'utilisation ---
if ($NonInteractive) {
    $mode = 'standalone'
} else {
    Write-Host "Comment allez-vous utiliser l'application ?" -ForegroundColor Yellow
    Write-Host "  [1] Ce PC uniquement (mode standalone)"
    Write-Host "  [2] Ce PC SERT de serveur pour le reseau (LAN)"
    Write-Host "  [3] Ce PC est un CLIENT (se connecter a un serveur existant)"
    Write-Host ""
    $choice = Read-Host "Votre choix (1/2/3) [defaut: 1]"

    switch ($choice) {
        '2' { $mode = 'server' }
        '3' { $mode = 'client' }
        default { $mode = 'standalone' }
    }
}

$config = @{
    MODE = $mode
    MYSQL_HOST = '127.0.0.1'
    MYSQL_PORT = '3306'
    MYSQL_USER = 'root'
    MYSQL_PASSWORD = ''
    BACKEND_PORT = '3005'
    FRONTEND_PORT = '3000'
    DB_TYPE = 'mysql'
    TENANT = '2025_bu01'
}

if ($mode -eq 'client') {
    # Le client doit connaitre l'IP du serveur
    Write-Host ""
    if (-not $NonInteractive) {
        $serverIp = Read-Host "Adresse IP du PC serveur (ex: 192.168.1.50)"
        if (-not $serverIp) { $serverIp = '127.0.0.1' }
    } else {
        $serverIp = '127.0.0.1'
    }
    $config.MYSQL_HOST = $serverIp
    $config.SERVER_HOST = $serverIp
} else {
    $config.SERVER_HOST = '0.0.0.0'  # ecoute toutes les interfaces (LAN)
    $localIp = Get-LocalIp
    if ($localIp) {
        $config.DETECTED_LAN_IP = $localIp
    }
}

# --- Confirmation ---
Write-Host ""
Write-Host "-----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Configuration generee :" -ForegroundColor Green
Write-Host "  Mode           : $($config.MODE)"
Write-Host "  MySQL host     : $($config.MYSQL_HOST):$($config.MYSQL_PORT)"
Write-Host "  Backend port   : $($config.BACKEND_PORT)"
Write-Host "  Frontend port  : $($config.FRONTEND_PORT)"
Write-Host "  Type de base   : $($config.DB_TYPE)"
Write-Host "  Tenant         : $($config.TENANT)"
if ($config.DETECTED_LAN_IP) {
    Write-Host "  IP LAN detectee: $($config.DETECTED_LAN_IP)" -ForegroundColor Yellow
    Write-Host "  (Les clients du reseau devront utiliser cette IP)" -ForegroundColor DarkGray
}
Write-Host "-----------------------------------------------------------" -ForegroundColor DarkGray

if (-not $NonInteractive) {
    $confirm = Read-Host "Confirmer et enregistrer ? (O/n)"
    if ($confirm -match '^[nN]') {
        Write-Host "Configuration annulee." -ForegroundColor Red
        exit 1
    }
}

# --- Ecriture du fichier config.env ---
$lines = @(
    "# Configuration StockApp - generee le $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    "# NE PAS MODIFIER MANUELLEMENT (utiliser l'assistant setup-config.ps1)",
    ""
)
foreach ($key in $config.Keys) {
    $lines += "$key=$($config[$key])"
}

Set-Content -Path $ConfigPath -Value $lines -Encoding UTF8
Write-Host ""
Write-Host "[OK] Configuration enregistree dans : $ConfigPath" -ForegroundColor Green

if ($mode -eq 'server') {
    Write-Host ""
    Write-Host "MODE SERVEUR : pensez a ouvrir les ports dans le pare-feu." -ForegroundColor Yellow
    Write-Host "  -> Lancez : scripts\install-firewall-rules.ps1" -ForegroundColor DarkGray
}

exit 0
