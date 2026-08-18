# =====================================================================
#  setup-first-run.ps1
#  Wizard de première installation : saisie des informations de base
#  de l'entreprise (raison sociale, adresse, contact, NIF/RC...).
#  Met à jour la table activite du tenant dans MariaDB.
#
#  Usage (appelé par StockApp-Launcher.ps1 au premier lancement) :
#    powershell -File setup-first-run.ps1 `
#      -MysqlCli "D:\StockApp_test\bin\mariadb\bin\mysql.exe" `
#      -Port 3306 -User root -Password x -Tenant 2025_bu01
# =====================================================================
param(
    [string]$MysqlCli,
    [int]$Port = 3306,
    [string]$User = 'root',
    [string]$Password = '',
    [string]$Tenant = '2025_bu01',
    [string]$CodeActivite = 'BU01'
)

$ErrorActionPreference = 'Continue'

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "  Configuration initiale de votre entreprise" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Ces informations apparaîtront sur vos documents (factures," -ForegroundColor DarkGray
Write-Host "  bons de livraison, proformas...) et dans vos paramètres." -ForegroundColor DarkGray
Write-Host ""

function Ask-Value {
    param([string]$Label, [string]$Default, [bool]$Required = $false)
    if ($Default) {
        $prompt = "  $Label [$Default] : "
    } else {
        $prompt = "  $Label : "
    }
    while ($true) {
        $val = Read-Host -Prompt "  $Label"
        if (-not $val -and $Default) { $val = $Default }
        if (-not $val -and $Required) {
            Write-Host "      [!] Ce champ est obligatoire." -ForegroundColor Yellow
            continue
        }
        if (-not $val) { $val = '' }
        return $val.Trim()
    }
}

$raison = Ask-Value "Raison sociale de l'entreprise" -Default 'Ma Société' -Required $true
$adresse = Ask-Value "Adresse" -Default ''
$commune = Ask-Value "Commune" -Default ''
$wilaya = Ask-Value "Wilaya" -Default ''
$tel = Ask-Value "Téléphone fixe" -Default ''
$telPort = Ask-Value "Téléphone portable" -Default ''
$email = Ask-Value "Email" -Default ''
$nif = Ask-Value "NIF" -Default ''
$rc = Ask-Value "RC" -Default ''
$nis = Ask-Value "NIS" -Default ''
$activite = Ask-Value "Domaine d'activité" -Default ''

Write-Host ""
Write-Host "-----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Récapitulatif :" -ForegroundColor Green
Write-Host "  Raison sociale : $raison"
if ($adresse) { Write-Host "  Adresse        : $adresse" }
if ($commune)   { Write-Host "  Commune        : $commune" }
if ($wilaya)    { Write-Host "  Wilaya         : $wilaya" }
if ($tel)       { Write-Host "  Téléphone      : $tel" }
if ($telPort)   { Write-Host "  Mobile         : $telPort" }
if ($email)     { Write-Host "  Email          : $email" }
if ($nif)       { Write-Host "  NIF            : $nif" }
if ($rc)        { Write-Host "  RC             : $rc" }
if ($nis)       { Write-Host "  NIS            : $nis" }
if ($activite)  { Write-Host "  Activité       : $activite" }
Write-Host "-----------------------------------------------------------" -ForegroundColor DarkGray
$confirm = Read-Host "Enregistrer ces informations ? (O/n)"
if ($confirm -and $confirm.ToLower() -eq 'n') {
    Write-Host "    [X] Configuration annulée. Les valeurs par défaut seront utilisées." -ForegroundColor Yellow
    exit 0
}

# Échappement des apostrophes pour SQL
function Escape-Sql([string]$v) {
    if ($null -eq $v) { return "''" }
    return "'" + ($v -replace "'", "''") + "'"
}

$sql = "UPDATE \`$Tenant\`.activite SET " +
    "raison_sociale = $(Escape-Sql $raison), " +
    "nom_entreprise = $(Escape-Sql $raison), " +
    "adresse = $(Escape-Sql $adresse), " +
    "commune = $(Escape-Sql $commune), " +
    "wilaya = $(Escape-Sql $wilaya), " +
    "tel_fixe = $(Escape-Sql $tel), " +
    "tel_port = $(Escape-Sql $telPort), " +
    "telephone = $(Escape-Sql $tel), " +
    "email = $(Escape-Sql $email), " +
    "e_mail = $(Escape-Sql $email), " +
    "nif = $(Escape-Sql $nif), " +
    "rc = $(Escape-Sql $rc), " +
    "nis = $(Escape-Sql $nis), " +
    "domaine_activite = $(Escape-Sql $activite) " +
    "WHERE tenant_id = '$Tenant';"

& $MysqlCli -h 127.0.0.1 -P $Port -u $User --password="$Password" -e $sql 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "    [OK] Informations enregistrées." -ForegroundColor Green
} else {
    Write-Host "    [X] Échec de l'enregistrement. Consultez les logs." -ForegroundColor Red
}

Write-Host ""
Write-Host "Vous pourrez modifier ces informations à tout moment dans" -ForegroundColor DarkGray
Write-Host "Paramètres > Informations de l'entreprise." -ForegroundColor DarkGray
Write-Host ""
