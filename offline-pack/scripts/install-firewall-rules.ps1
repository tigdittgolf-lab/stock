# =====================================================================
#  install-firewall-rules.ps1
#  Ouvre les ports necessaires dans le pare-feu Windows (mode serveur).
# =====================================================================
#  Doit etre execute en ADMINISTRATEUR sur le PC qui sert de serveur.
#  Cree des regles entrantes pour les ports :
#    - 3000 (frontend Next.js)
#    - 3005 (backend Hono)
#    - 3306 (MySQL)  -- optionnel, deconseille sur le LAN publique
# =====================================================================
[CmdletBinding()]
param(
    [switch]$IncludeMysql
)

# Verifier les privileges administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Ce script doit etre execute en tant qu'administrateur." -ForegroundColor Red
    Write-Host "Clic droit sur PowerShell -> 'Executer en tant qu'administrateur'." -ForegroundColor Yellow
    exit 1
}

$rules = @(
    @{ Name='StockApp-Frontend'; Port=3000; Protocol='TCP' }
    @{ Name='StockApp-Backend';  Port=3005; Protocol='TCP' }
)

if ($IncludeMysql) {
    $rules += @{ Name='StockApp-MySQL'; Port=3306; Protocol='TCP' }
}

foreach ($rule in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "[...] La regle '$($rule.Name)' existe deja, mise a jour..." -ForegroundColor DarkGray
        Remove-NetFirewallRule -DisplayName $rule.Name
    }

    New-NetFirewallRule `
        -DisplayName $rule.Name `
        -Direction Inbound `
        -Protocol $rule.Protocol `
        -LocalPort $rule.Port `
        -Action Allow `
        -Profile Private,Domain `
        -Enabled True | Out-Null

    Write-Host "[OK] Regle '$($rule.Name)' creee (port $($rule.Port)/$($rule.Protocol))." -ForegroundColor Green
}

Write-Host ""
Write-Host "Pare-feu configure. Les PC du reseau local peuvent maintenant se connecter." -ForegroundColor Cyan
Write-Host "Note : seuls les profils 'Prive' et 'Domaine' sont concernes (pas 'Public')." -ForegroundColor DarkGray
