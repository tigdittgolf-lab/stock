# =====================================================================
#  backup.ps1
#  Sauvegarde de la base de données MySQL (mode offline).
# =====================================================================
#  Crée un dump SQL horodaté de toutes les bases du tenant + auth.
#  À planifier quotidiennement via le Planificateur de tâches Windows.
#
#  Utilisation manuelle :
#    .\backup.ps1
#    .\backup.ps1 -AppRoot C:\StockApp -OutputDir D:\Sauvegardes
#
#  Planification automatique (tous les jours à 22h00) :
#   schtasks /Create /TN "StockApp Backup" /TR "powershell.exe -File
#       C:\StockApp\scripts\backup.ps1 -AppRoot C:\StockApp" /SC DAILY /ST 22:00 /RL HIGHEST
# =====================================================================
[CmdletBinding()]
param(
    [string]$AppRoot,
    [string]$OutputDir,
    [int]$KeepDays = 30
)

$ErrorActionPreference = 'Stop'

if (-not $AppRoot) { $AppRoot = Split-Path -Parent $PSScriptRoot }
if (-not $OutputDir) { $OutputDir = Join-Path $AppRoot 'backups' }

# Charger la config
$ConfigPath = Join-Path $AppRoot 'config.env'
if (-not (Test-Path $ConfigPath)) {
    Write-Host "Aucun config.env trouve. L'application n'est pas configuree." -ForegroundColor Red
    exit 1
}
$config = @{}
Get-Content $ConfigPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
        $idx = $line.IndexOf('=')
        $config[$line.Substring(0, $idx).Trim()] = $line.Substring($idx + 1).Trim()
    }
}

$mysqlPort = $config['MYSQL_PORT']
$mysqlUser = $config['MYSQL_USER']
$mysqlPwd  = $config['MYSQL_PASSWORD']
$tenant    = $config['TENANT']
$mysqldump = Join-Path $AppRoot 'bin\mariadb\bin\mysqldump.exe'

if (-not (Test-Path $mysqldump)) {
    Write-Host "mysqldump introuvable : $mysqldump" -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$timestamp = Get-Date -Format 'yyyy-MM-dd_HHmm'
$dumpFile  = Join-Path $OutputDir "stockapp_${tenant}_$timestamp.sql"

Write-Host "Sauvegarde en cours..." -ForegroundColor Cyan

$args = @(
    '-h', '127.0.0.1',
    '-P', $mysqlPort,
    '-u', $mysqlUser
)
if ($mysqlPwd) { $args += @('--password=' + $mysqlPwd) }
$args += @(
    '--single-transaction',
    '--routines',
    '--triggers',
    '--databases', $tenant, 'stock_management_auth',
    '--result-file=' + $dumpFile
)

& $mysqldump @args

if (Test-Path $dumpFile) {
    $size = (Get-Item $dumpFile).Length / 1KB
    Write-Host "[OK] Sauvegarde creee : $dumpFile ($([math]::Round($size, 1)) Ko)" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] La sauvegarde a echoue." -ForegroundColor Red
    exit 1
}

# Nettoyer les sauvegardes de plus de N jours
$cutoff = (Get-Date).AddDays(-$KeepDays)
Get-ChildItem -Path $OutputDir -Filter 'stockapp_*.sql' |
    Where-Object { $_.LastWriteTime -lt $cutoff } |
    ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host "Ancienne sauvegarde supprimee : $($_.Name)" -ForegroundColor DarkGray
    }

Write-Host "Termine." -ForegroundColor Green
