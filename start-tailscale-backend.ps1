# ============================================
# DEMARRAGE TAILSCALE + BACKEND
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEMARRAGE TAILSCALE + BACKEND" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Démarrer Tailscale
Write-Host "1. Demarrage de Tailscale..." -ForegroundColor Yellow
Start-Process "C:\Program Files\Tailscale\tailscale-ipn.exe"
Start-Sleep -Seconds 5

# 2. Attendre la connexion
Write-Host ""
Write-Host "2. Attente de la connexion Tailscale..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 3. Démarrer le backend
Write-Host ""
Write-Host "3. Demarrage du backend sur port 3005..." -ForegroundColor Yellow
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "bun run index.ts"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "SERVICES DEMARRES" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend local: http://localhost:3005" -ForegroundColor Cyan
Write-Host "Backend Tailscale: https://desktop-bhhs068.tail1d9c54.ts.net:3005" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
