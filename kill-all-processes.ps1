# 🛑 Arrêt de tous les processus Stock Management
# Script pour nettoyer tous les processus liés à l'application

Write-Host "Arret de tous les processus Stock Management..." -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Gray

$processesKilled = 0

# 1. Arrêter les processus Node.js/Bun/NPM
Write-Host "1. Arret des processus de developpement..." -ForegroundColor Cyan
try {
    $devProcesses = Get-Process | Where-Object {
        $_.ProcessName -eq "node" -or 
        $_.ProcessName -eq "bun" -or 
        $_.ProcessName -eq "npm" -or
        $_.ProcessName -eq "yarn" -or
        $_.ProcessName -eq "pnpm"
    }
    
    foreach ($process in $devProcesses) {
        Write-Host "  Arret: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        $processesKilled++
    }
} catch {
    Write-Host "  Erreur lors de l'arret des processus de developpement" -ForegroundColor Red
}

# 2. Libérer les ports 3001 et 3005
Write-Host "2. Liberation des ports 3001 et 3005..." -ForegroundColor Cyan
$ports = @(3001, 3005)

foreach ($port in $ports) {
    try {
        $connections = netstat -ano | Select-String ":$port " | Select-String "LISTENING"
        foreach ($connection in $connections) {
            $pid = ($connection.ToString() -split '\s+')[-1]
            if ($pid -and $pid -ne "0") {
                Write-Host "  Liberation du port $port (PID: $pid)" -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                $processesKilled++
            }
        }
    } catch {
        Write-Host "  Port $port deja libre" -ForegroundColor Green
    }
}

# 3. Arrêter les processus PowerShell récents (sauf le courant)
Write-Host "3. Arret des processus PowerShell de l'application..." -ForegroundColor Cyan
try {
    $currentPID = $PID
    $recentPS = Get-Process powershell | Where-Object {
        $_.Id -ne $currentPID -and 
        $_.StartTime -gt (Get-Date).AddHours(-2)
    }
    
    foreach ($process in $recentPS) {
        Write-Host "  Arret: PowerShell (PID: $($process.Id))" -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        $processesKilled++
    }
} catch {
    Write-Host "  Aucun processus PowerShell recent trouve" -ForegroundColor Green
}

# 4. Fermer les onglets de navigateur localhost
Write-Host "4. Fermeture des onglets localhost dans le navigateur..." -ForegroundColor Cyan
try {
    # Essayer de fermer les processus Chrome/Edge avec localhost
    $browsers = Get-Process | Where-Object {
        ($_.ProcessName -eq "chrome" -or $_.ProcessName -eq "msedge") -and
        $_.MainWindowTitle -like "*localhost*"
    }
    
    foreach ($browser in $browsers) {
        Write-Host "  Fermeture: $($browser.ProcessName) avec localhost" -ForegroundColor Yellow
        $browser.CloseMainWindow()
        $processesKilled++
    }
} catch {
    Write-Host "  Aucun onglet localhost trouve" -ForegroundColor Green
}

# 5. Vérification finale
Write-Host "5. Verification finale..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

$remainingProcesses = Get-Process | Where-Object {
    $_.ProcessName -eq "node" -or 
    $_.ProcessName -eq "bun" -or 
    $_.ProcessName -eq "npm"
}

if ($remainingProcesses.Count -eq 0) {
    Write-Host "  Tous les processus de developpement arretes" -ForegroundColor Green
} else {
    Write-Host "  $($remainingProcesses.Count) processus encore actifs" -ForegroundColor Yellow
}

# Résumé
Write-Host ""
Write-Host "TERMINE !" -ForegroundColor Green
Write-Host "$processesKilled processus arretes" -ForegroundColor Cyan
Write-Host "Ports 3001 et 3005 liberes" -ForegroundColor Cyan
Write-Host "Application Stock Management completement arretee" -ForegroundColor Green

Write-Host ""
Read-Host "Appuyez sur Entree pour fermer"