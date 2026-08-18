# =====================================================================
#  StockApp-Launcher.ps1
#  Lanceur principal du mode offline.
# =====================================================================
#  Orchestre le demarrage de toute la chaine :
#    1. Lit/ cree la configuration (config.env)
#    2. (Standalone/Server) Demarre MySQL portable
#    3. (Standalone/Server) Initialise la base au premier lancement
#    4. (Standalone/Server) Demarre le backend Hono
#    5. (Standalone/Server) Demarre le frontend Next.js
#    6. Ouvre le navigateur sur la bonne URL
#    7. Gere l'arret propre (Ctrl+C) en fermant tous les processus
# =====================================================================
[CmdletBinding()]
param(
    [string]$AppRoot
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------
# 0. Resolution des chemins
# ---------------------------------------------------------------------
if (-not $AppRoot) { $AppRoot = Split-Path -Parent $PSScriptRoot }
$AppRoot = (Resolve-Path $AppRoot).Path

$ConfigPath     = Join-Path $AppRoot 'config.env'
$BinDir         = Join-Path $AppRoot 'bin'
$MysqlDir       = Join-Path $BinDir 'mariadb'
$MysqlDataDir   = Join-Path $AppRoot 'data\mysql'
$SchemaSql      = Join-Path $AppRoot 'database\schema-mysql.sql'
$SeedSql        = Join-Path $AppRoot 'database\seed-admin.sql'
$BackendDir     = Join-Path $AppRoot 'backend'
$FrontendDir    = Join-Path $AppRoot 'frontend'
$WaitScript     = Join-Path $PSScriptRoot 'wait-for-port.ps1'
$SetupScript    = Join-Path $PSScriptRoot 'setup-config.ps1'
$LogFile        = Join-Path $AppRoot 'logs\stockapp.log'

# Suivi des processus a nettoyer a la fermeture
$script:StartedProcesses = New-Object System.Collections.Generic.List[object]

function Write-Step($msg) {
    Write-Host ""
    Write-Host ">>> $msg" -ForegroundColor Cyan
}
function Write-Ok($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn2($msg){ Write-Host "    [!]  $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "    [X]  $msg" -ForegroundColor Red }

function Stop-StartedProcesses {
    Write-Host ""
    Write-Host ">>> Arret en cours..." -ForegroundColor Cyan
    foreach ($p in $script:StartedProcesses) {
        try {
            if ($p -and -not $p.HasExited) {
                Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
                Write-Host "    Processus $($p.ProcessName) (PID $($p.Id)) arrete." -ForegroundColor DarkGray
            }
        } catch {
            # ignore
        }
    }
}

# ---------------------------------------------------------------------
# 1. Lecture / creation de la configuration
# ---------------------------------------------------------------------
function Read-Config {
    param([string]$Path)
    $cfg = @{}
    if (Test-Path $Path) {
        Get-Content $Path | ForEach-Object {
            $line = $_.Trim()
            if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
                $idx = $line.IndexOf('=')
                $key = $line.Substring(0, $idx).Trim()
                $val = $line.Substring($idx + 1).Trim()
                $cfg[$key] = $val
            }
        }
    }
    return $cfg
}

# Garantir le dossier de logs
New-Item -ItemType Directory -Force -Path (Join-Path $AppRoot 'logs') | Out-Null
"=== StockApp demarre le $(Get-Date) ===" | Out-File -FilePath $LogFile -Append -Encoding UTF8

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "  StockApp - Gestion de Stock (mode offline)" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray
Write-Host "=============================================================" -ForegroundColor Cyan

if (-not (Test-Path $ConfigPath)) {
    Write-Step "Premier lancement : configuration requise"
    & $SetupScript -AppRoot $AppRoot
    if ($LASTEXITCODE) {
        Write-Err "Configuration annulee. Abandon."
        exit 1
    }
}

$config = Read-Config -Path $ConfigPath
if (-not $config.ContainsKey('MODE')) {
    Write-Err "Fichier config.env invalide. Supprimez-le et relancez."
    exit 1
}

$mode        = $config['MODE']
$mysqlHost   = $config['MYSQL_HOST']
$mysqlPort   = [int]($config['MYSQL_PORT'])
$mysqlUser   = $config['MYSQL_USER']
$mysqlPwd    = $config['MYSQL_PASSWORD']
$backendPort = [int]($config['BACKEND_PORT'])
$frontendPort= [int]($config['FRONTEND_PORT'])
$serverHost  = $config['SERVER_HOST']
$tenant      = $config['TENANT']
$codeActivite= if ($config['CODE_ACTIVITE']) { $config['CODE_ACTIVITE'] } else { 'BU01' }

Write-Host "Mode         : $mode"
Write-Host "MySQL        : $mysqlHost`:$mysqlPort"
Write-Host "Backend      : port $backendPort"
Write-Host "Frontend     : port $frontendPort"
Write-Host "Tenant       : $tenant"

# ---------------------------------------------------------------------
# 2. CLIENT : on n'heberge rien, on ouvre juste le navigateur
# ---------------------------------------------------------------------
if ($mode -eq 'client') {
    $serverIp = $config['SERVER_HOST']
    $url = "http://${serverIp}:$frontendPort"
    Write-Step "Mode client -> connexion a $url"
    Write-Host "    Ouverture du navigateur..." -ForegroundColor Green
try { Start-Process $url } catch { Write-Warn2 "Impossible d'ouvrir le navigateur : $($_.Exception.Message)" }
    Write-Host ""
    Write-Host "Vous pouvez fermer cette fenetre. Le navigateur reste connecte au serveur." -ForegroundColor DarkGray
    Start-Sleep -Seconds 2
    exit 0
}

# ---------------------------------------------------------------------
# 3. (standalone/server) Demarrage MySQL
# ---------------------------------------------------------------------
Write-Step "Demarrage de la base de donnees (MariaDB)"

$mysqldExe = Join-Path $MysqlDir 'bin\mysqld.exe'
if (-not (Test-Path $mysqldExe)) {
    Write-Err "MariaDB introuvable : $mysqldExe"
    Write-Err "Placez le dossier portable MariaDB dans : $MysqlDir"
    Write-Err "(Voir offline-pack/README.md - section packaging)"
    exit 1
}

# Initialisation du datadir au tout premier lancement
if (-not (Test-Path (Join-Path $MysqlDataDir 'mysql'))) {
    Write-Host "    Premier lancement : initialisation du dossier de donnees..." -ForegroundColor DarkGray
    New-Item -ItemType Directory -Force -Path $MysqlDataDir | Out-Null
    $savedEA = $ErrorActionPreference
    $ErrorActionPreference = 'Continue' # empeche les warnings stderr de tout arreter
    Push-Location (Join-Path $MysqlDir 'bin')
    $initOutput = & .\mariadbd.exe --initialize-insecure "--datadir" "$MysqlDataDir" 2>&1
    Pop-Location
    $ErrorActionPreference = $savedEA
    if ($LASTEXITCODE) {
        Write-Err "Echec de l'initialisation MariaDB (code $LASTEXITCODE) :"
        $initOutput | ForEach-Object { Write-Host "        $_" -ForegroundColor Red }
        Stop-StartedProcesses
        exit 1
    }
    Write-Ok "Dossier de donnees initialise"
}

# Fichier de config MySQL minimal (my.ini)
$myIni = Join-Path $AppRoot 'data\my.ini'
$myIniContent = @"
[mysqld]
basedir=$MysqlDir
datadir=$MysqlDataDir
port=$mysqlPort
bind-address=0.0.0.0
skip-name-resolve
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
max_connections=100
"@
Set-Content -Path $myIni -Value $myIniContent -Encoding ASCII

# Lancer mysqld
$mysqlArgs = @("--defaults-file=`"$myIni`"", "--console")
$mysqlProc = Start-Process -FilePath $mysqldExe -ArgumentList $mysqlArgs -PassThru -WindowStyle Hidden
$script:StartedProcesses.Add($mysqlProc) | Out-Null
Write-Host "    MariaDB demarre (PID $($mysqlProc.Id))" -ForegroundColor DarkGray

# Attendre que le port reponde
$mysqlUp = & $WaitScript -Port $mysqlPort -HostName '127.0.0.1' -TimeoutSeconds 30
if (-not $mysqlUp) {
    Write-Err "MariaDB n'a pas demarre dans les temps. Voir $LogFile"
    Stop-StartedProcesses
    exit 1
}
Write-Ok "Base de donnees prete"

# ---------------------------------------------------------------------
# 4. Initialisation du schema (si premiere fois)
# ---------------------------------------------------------------------
$mysqlCli = Join-Path $MysqlDir 'bin\mysql.exe'
$dbMarker = Join-Path $AppRoot 'data\.schema-initialized'
if (-not (Test-Path $dbMarker)) {
    Write-Step "Initialisation du schema de la base"
    & $mysqlCli -h 127.0.0.1 -P $mysqlPort -u $mysqlUser --password="$mysqlPwd" -e "source $SchemaSql" 2>&1 |
        Out-File -FilePath $LogFile -Append -Encoding UTF8
    & $mysqlCli -h 127.0.0.1 -P $mysqlPort -u $mysqlUser --password="$mysqlPwd" -e "source $SeedSql" 2>&1 |
        Out-File -FilePath $LogFile -Append -Encoding UTF8
    New-Item -ItemType File -Path $dbMarker -Force | Out-Null
    Write-Ok "Schema cree + utilisateur admin par defaut (admin / admin123)"

    # Wizard de premiere configuration : informations de l'entreprise
    Write-Step "Configuration initiale de l'entreprise"
    $WizardScript = Join-Path $AppRoot 'scripts\setup-first-run.ps1'
    if (Test-Path $WizardScript) {
        & $WizardScript `
            -MysqlCli $mysqlCli `
            -Port $mysqlPort `
            -User $mysqlUser `
            -Password $mysqlPwd `
            -Tenant $tenant `
            -CodeActivite $codeActivite
    } else {
        Write-Warn2 "Wizard de configuration absent ($WizardScript)"
    }
} else {
    Write-Ok "Base deja initialisee"
}

# ---------------------------------------------------------------------
# 5. Demarrage du backend Hono
# ---------------------------------------------------------------------
Write-Step "Demarrage du backend (port $backendPort)"

# Construire le .env du backend pour ce mode
$backendEnv = @"
PORT=$backendPort
MYSQL_HOST=127.0.0.1
MYSQL_PORT=$mysqlPort
MYSQL_DATABASE=$tenant
MYSQL_USER=$mysqlUser
MYSQL_PASSWORD=$mysqlPwd
NODE_ENV=production
SUPABASE_URL=http://localhost:8000
SUPABASE_SERVICE_ROLE_KEY=offline-mode-no-supabase-needed
LICENSE_FILE=$(Join-Path $AppRoot 'data\license.json')
"@
Set-Content -Path (Join-Path $BackendDir '.env') -Value $backendEnv -Encoding UTF8

# Priorite au JS compile (dist/), sinon .ts source
$backendEntry = Join-Path $BackendDir 'dist\index.js'
if (-not (Test-Path $backendEntry)) {
    $backendEntry = Join-Path $BackendDir 'index.ts'
}

# Rediriger la sortie vers un log pour diagnostic
$backendOutLog = Join-Path $AppRoot 'logs\backend-out.log'
$backendErrLog = Join-Path $AppRoot 'logs\backend-err.log'

$nodeExe = Join-Path $BinDir 'node\node.exe'
if (Test-Path $nodeExe) {
    $backendProc = Start-Process -FilePath $nodeExe -ArgumentList @($backendEntry) -WorkingDirectory $BackendDir -PassThru -RedirectStandardOutput $backendOutLog -RedirectStandardError $backendErrLog
    Write-Host "    Backend demarre (PID $($backendProc.Id))" -ForegroundColor DarkGray
} else {
    Write-Err "Node.js introuvable dans $BinDir"
    Stop-StartedProcesses
    exit 1
}
$script:StartedProcesses.Add($backendProc) | Out-Null

$backendUp = & $WaitScript -Port $backendPort -HostName '127.0.0.1' -TimeoutSeconds 25
if (-not $backendUp) {
    Write-Err "Le backend n'a pas demarre. Voir $LogFile"
    Stop-StartedProcesses
    exit 1
}
Write-Ok "Backend pret"

# ---------------------------------------------------------------------
# 6. Demarrage du frontend Next.js
# ---------------------------------------------------------------------
Write-Step "Demarrage du frontend (port $frontendPort)"

$frontendEnv = @"
NEXT_PUBLIC_OFFLINE_MODE=$mode
NEXT_PUBLIC_API_URL=http://localhost:$backendPort/api
NEXT_PUBLIC_DB_TYPE=mysql
NEXT_PUBLIC_TENANT=$tenant
PORT=$frontendPort
NODE_ENV=production
"@
Set-Content -Path (Join-Path $FrontendDir '.env.local') -Value $frontendEnv -Encoding UTF8

$nodeExe = Join-Path $BinDir 'node\node.exe'
$feArgs = @('node_modules\next\dist\bin\next', 'start', '-p', "$frontendPort", '-H', '0.0.0.0')
$frontendProc = Start-Process -FilePath $nodeExe -ArgumentList $feArgs -WorkingDirectory $FrontendDir -PassThru -WindowStyle Minimized
$script:StartedProcesses.Add($frontendProc) | Out-Null

$frontendUp = & $WaitScript -Port $frontendPort -HostName '127.0.0.1' -TimeoutSeconds 30
if (-not $frontendUp) {
    Write-Err "Le frontend n'a pas demarre. Voir $LogFile"
    Stop-StartedProcesses
    exit 1
}
Write-Ok "Frontend pret"

# ---------------------------------------------------------------------
# 7. Ouverture du navigateur
# ---------------------------------------------------------------------
$accessIp = if ($mode -eq 'standalone') { 'localhost' } else { ($config['DETECTED_LAN_IP']) }
if (-not $accessIp) { $accessIp = 'localhost' }
$url = "http://${accessIp}:$frontendPort"

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Green
Write-Host "  StockApp est pret !" -ForegroundColor Green
Write-Host "  URL d'acces : $url" -ForegroundColor White
if ($mode -eq 'server') {
    Write-Host "  (Les clients LAN utilisent cette meme URL)" -ForegroundColor DarkGray
}
Write-Host "  Identifiants par defaut : admin / admin123" -ForegroundColor Yellow
Write-Host "  Logs : $LogFile" -ForegroundColor DarkGray
Write-Host "  Appuyez sur Ctrl+C pour tout arreter proprement." -ForegroundColor DarkGray
Write-Host "=============================================================" -ForegroundColor Green
Write-Host ""

try { Start-Process $url } catch { Write-Warn2 "Impossible d'ouvrir le navigateur : $($_.Exception.Message)" }

# Capturer Ctrl+C pour un arret propre
$null = Register-EngineEvent PowerShell.Exiting -Action { Stop-StartedProcesses }
try {
    Write-Host "En attente... (Ctrl+C pour quitter)" -ForegroundColor DarkGray
    while ($true) {
        Start-Sleep -Seconds 5
        # Surveiller les processus : si l'un meurt, on arrete tout
        foreach ($p in $script:StartedProcesses) {
            if ($p.HasExited) {
                Write-Warn2 "Processus $($p.ProcessName) s'est arrete. Fermeture."
                Stop-StartedProcesses
                exit 1
            }
        }
    }
} finally {
    Stop-StartedProcesses
}
