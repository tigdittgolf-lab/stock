# =====================================================================
#  generate-license.ps1
#  OUTIL VENDEUR - Génère une clé de licence StockApp.
#
#  Deux types de licences :
#    T15   -> essai 15 jours
#    T30   -> essai 30 jours
#    PERP  -> licence durable (perpetuelle)
#
#  La clé est liée à l'ID machine du poste client ET à la structure (BU).
#
#  Utilisation :
#    .\generate-license.ps1 -MachineId A1B2C3D4E5F6 -Bu 2025_bu01 -Type T30
#    .\generate-license.ps1 -MachineId A1B2C3D4E5F6 -Bu 2025_bu01 -Type PERP
# =====================================================================
param(
    [Parameter(Mandatory = $true)]
    [string]$MachineId,          # ID machine affiché dans l'app (écran Licence)

    [Parameter(Mandatory = $true)]
    [string]$Bu,                # Structure / tenant (ex: 2025_bu01)

    [Parameter(Mandatory = $true)]
    [ValidateSet('T15', 'T30', 'PERP')]
    [string]$Type               # Type de licence
)

$ErrorActionPreference = 'Stop'

# SECRET : doit être IDENTIQUE à celui du backend (voir licenseService.ts)
$chars = 0x53, 0x74, 0x6f, 0x63, 0x6b, 0x41, 0x70, 0x70, 0x2d, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x2d, 0x32, 0x30, 0x32, 0x36, 0x2d, 0x62, 0x75, 0x31
$secretBytes = New-Object byte[] $chars.Length
for ($i = 0; $i -lt $chars.Length; $i++) {
    $secretBytes[$i] = $chars[$i] -bxor (($i * 7 + 3) % 256)
}
$SECRET = [System.Text.Encoding]::UTF8.GetString($secretBytes)

if ($Type -eq 'PERP') {
    $days = 0
} elseif ($Type -eq 'T15') {
    $days = 15
} else {
    $days = 30
}

# Signature : HMAC-SHA256( LICENSE_SECRET, "LIC|TYPE|BU|MACHINE|DAYS" ) -> 10 hex majuscules
$payload = "LIC|$Type|$Bu|$MachineId|$days"
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($SECRET)
$hashBytes = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($payload))
$sig = (($hashBytes | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 10).ToUpper()

$key = "LIC-$Type-$Bu-$MachineId-$sig"

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "  Clé de licence générée" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "  Machine ID : $MachineId"
Write-Host "  Structure  : $Bu"
Write-Host "  Type       : $Type ($(if ($Type -eq 'PERP') { 'Durable' } else { "$days jours" }))"
Write-Host ""
Write-Host "  Clé : " -NoNewline -ForegroundColor Green
Write-Host "$key" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host ""
Write-Host "  À transmettre au client, qui la saisira dans :" -ForegroundColor DarkGray
Write-Host "  Paramètres > Licence (ou /license)" -ForegroundColor DarkGray
Write-Host ""

# Copie dans le presse-papiers si possible (contexte interactif)
try {
    $key | Set-Clipboard
    Write-Host "  (clé copiée dans le presse-papiers)" -ForegroundColor DarkGray
} catch { }