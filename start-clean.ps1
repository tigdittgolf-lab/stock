# =====================================================
# DEMARRAGE PROPRE DES SERVEURS
# =====================================================

Write-Host "`n" -NoNewline
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   DEMARRAGE PROPRE - SYSTEME DE PAIEMENTS MYSQL       " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# =====================================================
# ETAPE 1: Cleanup des processus existants
# =====================================================
Write-Host "1. Nettoyage des processus existants..." -ForegroundColor Yellow

$processes = Get-Process | Where-Object {$_.ProcessName -match "node|bun|npm"}
if ($processes) {
    Write-Host "   Arret de $($processes.Count) processus..." -ForegroundColor Gray
    $processes | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "   OK Processus arretes" -ForegroundColor Green
} else {
    Write-Host "   OK Aucun processus a arreter" -ForegroundColor Green
}

# =====================================================
# ETAPE 2: Verifier MySQL
# =====================================================
Write-Host "`n2. Verification de MySQL..." -ForegroundColor Yellow

$mysqlService = Get-Service | Where-Object {$_.Name -like "*mysql*"}
if ($mysqlService -and $mysqlService.Status -eq "Running") {
    Write-Host "   OK MySQL est en cours d'execution" -ForegroundColor Green
    Write-Host "   Service: $($mysqlService.DisplayName)" -ForegroundColor Gray
} else {
    Write-Host "   ERREUR MySQL n'est pas demarre!" -ForegroundColor Red
    Write-Host "   Veuillez demarrer WAMP" -ForegroundColor Yellow
    exit 1
}

# =====================================================
# ETAPE 3: Verifier la table payments
# =====================================================
Write-Host "`n3. Verification de la table payments..." -ForegroundColor Yellow

$mysqlPath = "C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe"
try {
    $result = & $mysqlPath -u root -P 3307 -e "USE stock_management; SELECT COUNT(*) as count FROM payments;" 2>&1
    
    if ($result -match "count") {
        Write-Host "   OK Table payments existe" -ForegroundColor Green
    } else {
        Write-Host "   ATTENTION Table payments n'existe pas, creation..." -ForegroundColor Yellow
        Get-Content setup-mysql-local.sql | & $mysqlPath -u root -P 3307 stock_management
        Write-Host "   OK Table creee" -ForegroundColor Green
    }
} catch {
    Write-Host "   ERREUR MySQL: $_" -ForegroundColor Red
    exit 1
}

# =====================================================
# ETAPE 4: Demarrer le backend
# =====================================================
Write-Host "`n4. Demarrage du backend..." -ForegroundColor Yellow

if (Test-Path "backend") {
    Write-Host "   Demarrage sur http://localhost:3005..." -ForegroundColor Gray
    
    # Demarrer en arriere-plan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; bun index.ts" -WindowStyle Minimized
    
    Start-Sleep -Seconds 3
    
    # Tester la connexion
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3005/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "   OK Backend demarre avec succes" -ForegroundColor Green
        } else {
            Write-Host "   ATTENTION Backend demarre mais ne repond pas encore" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ATTENTION Backend en cours de demarrage..." -ForegroundColor Yellow
    }
} else {
    Write-Host "   ATTENTION Dossier backend non trouve" -ForegroundColor Yellow
}

# =====================================================
# ETAPE 5: Demarrer le frontend
# =====================================================
Write-Host "`n5. Demarrage du frontend..." -ForegroundColor Yellow

if (Test-Path "frontend") {
    Write-Host "   Demarrage sur http://localhost:3000..." -ForegroundColor Gray
    
    # Demarrer en arriere-plan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Minimized
    
    Write-Host "   Attente du demarrage (15 secondes)..." -ForegroundColor Gray
    Start-Sleep -Seconds 15
    
    # Tester la connexion
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "   OK Frontend demarre avec succes" -ForegroundColor Green
        } else {
            Write-Host "   ATTENTION Frontend demarre mais ne repond pas encore" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ATTENTION Frontend en cours de demarrage..." -ForegroundColor Yellow
    }
} else {
    Write-Host "   ERREUR Dossier frontend non trouve" -ForegroundColor Red
    exit 1
}

# =====================================================
# ETAPE 6: Resume
# =====================================================
Write-Host "`n" -NoNewline
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   SERVEURS DEMARRES                                    " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

Write-Host "OK MySQL:    Running (port 3307)" -ForegroundColor Green
Write-Host "OK Backend:  http://localhost:3005" -ForegroundColor Green
Write-Host "OK Frontend: http://localhost:3000" -ForegroundColor Green

Write-Host "`nPROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ouvrir http://localhost:3000 dans votre navigateur" -ForegroundColor White
Write-Host "2. Aller dans Parametres > Configuration Base de Donnees" -ForegroundColor White
Write-Host "3. Selectionner MySQL Local" -ForegroundColor White
Write-Host "4. Configurer:" -ForegroundColor White
Write-Host "   - Host: localhost" -ForegroundColor Gray
Write-Host "   - Port: 3307" -ForegroundColor Gray
Write-Host "   - Database: stock_management" -ForegroundColor Gray
Write-Host "   - User: root" -ForegroundColor Gray
Write-Host "   - Password: (laisser vide)" -ForegroundColor Gray
Write-Host "5. Cliquer Tester la connexion puis Activer" -ForegroundColor White
Write-Host "6. Tester un paiement sur un bon de livraison" -ForegroundColor White

Write-Host "`nOU EXECUTER LES TESTS:" -ForegroundColor Yellow
Write-Host "   .\test-mysql-payments.ps1" -ForegroundColor White

Write-Host "`nPOUR ARRETER LES SERVEURS:" -ForegroundColor Yellow
Write-Host "   .\stop-servers.ps1" -ForegroundColor White

Write-Host "`nAppuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
