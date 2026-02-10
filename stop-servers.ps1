# =====================================================
# ARRÊT PROPRE DES SERVEURS
# =====================================================

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ARRÊT DES SERVEURS                                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "🛑 Arrêt de tous les processus Node.js, Bun et NPM..." -ForegroundColor Yellow

# Trouver tous les processus
$processes = Get-Process | Where-Object {$_.ProcessName -match "node|bun|npm"}

if ($processes) {
    Write-Host "`nProcessus trouvés:" -ForegroundColor Gray
    $processes | ForEach-Object {
        Write-Host "   - PID: $($_.Id) | Nom: $($_.ProcessName)" -ForegroundColor Gray
    }
    
    Write-Host "`nArrêt en cours..." -ForegroundColor Yellow
    $processes | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 2
    
    # Vérifier qu'ils sont bien arrêtés
    $remaining = Get-Process | Where-Object {$_.ProcessName -match "node|bun|npm"}
    
    if ($remaining) {
        Write-Host "   ⚠️  Certains processus résistent, force kill..." -ForegroundColor Yellow
        $remaining | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
    
    Write-Host "   ✅ Tous les processus sont arrêtés" -ForegroundColor Green
} else {
    Write-Host "   ✅ Aucun processus en cours d'exécution" -ForegroundColor Green
}

# Vérifier les ports
Write-Host "`n🔍 Vérification des ports..." -ForegroundColor Yellow

$ports = @(3000, 3005)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "   ⚠️  Port $port encore utilisé par PID $($connection.OwningProcess)" -ForegroundColor Yellow
        try {
            Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ Processus arrêté" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Impossible d'arrêter le processus" -ForegroundColor Red
        }
    } else {
        Write-Host "   ✅ Port $port libre" -ForegroundColor Green
    }
}

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   NETTOYAGE TERMINÉ                                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "✅ Tous les serveurs sont arrêtés" -ForegroundColor Green
Write-Host "`nPour redémarrer:" -ForegroundColor Yellow
Write-Host "   .\start-clean.ps1" -ForegroundColor White

Write-Host "`nAppuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
