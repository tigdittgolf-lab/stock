# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    INSTALLATEUR PROFESSIONNEL                                ║
# ║              Application de Gestion de Stock - Version 1.0                   ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

param(
    [string]$ClientName = "Client",
    [string]$InstallPath = "C:\StockApp",
    [switch]$SkipDependencies = $false
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Couleurs
$ColorTitle = "Cyan"
$ColorSuccess = "G