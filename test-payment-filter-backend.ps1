# Script de test pour verifier que la route backend fonctionne

Write-Host "Test de la route backend: /api/sales/delivery-notes-by-payment-status" -ForegroundColor Cyan
Write-Host ""

# Test 1: Verifier que le backend tourne
Write-Host "1. Verification que le backend tourne sur port 3005..." -ForegroundColor Yellow
$backendRunning = netstat -ano | Select-String ":3005.*LISTENING"
if ($backendRunning) {
    Write-Host "   OK Backend tourne sur port 3005" -ForegroundColor Green
} else {
    Write-Host "   ERREUR Backend ne tourne PAS sur port 3005" -ForegroundColor Red
    Write-Host "   SOLUTION: Demarrez le backend avec: cd backend && npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Tester la route avec status=paid
Write-Host "2. Test de la route avec status=paid..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/api/sales/delivery-notes-by-payment-status?status=paid" -Headers @{"X-Tenant" = "2009_bu02"; "X-Database-Type" = "mysql"} -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "   OK Route fonctionne! Status: $($response.StatusCode)" -ForegroundColor Green
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   Resultat: $($data.count) BLs avec status 'paid'" -ForegroundColor Cyan
    } else {
        Write-Host "   ATTENTION Status inattendu: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ERREUR 404: La route n'existe pas!" -ForegroundColor Red
        Write-Host "   SOLUTION: Redemarrez le backend (Ctrl+C puis npm run dev)" -ForegroundColor Yellow
    } else {
        Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""

# Test 3: Tester la route avec status=partially_paid
Write-Host "3. Test de la route avec status=partially_paid..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/api/sales/delivery-notes-by-payment-status?status=partially_paid" -Headers @{"X-Tenant" = "2009_bu02"; "X-Database-Type" = "mysql"} -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "   OK Route fonctionne! Status: $($response.StatusCode)" -ForegroundColor Green
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   Resultat: $($data.count) BLs avec status 'partially_paid'" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 4: Tester la route avec status=unpaid
Write-Host "4. Test de la route avec status=unpaid..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/api/sales/delivery-notes-by-payment-status?status=unpaid" -Headers @{"X-Tenant" = "2009_bu02"; "X-Database-Type" = "mysql"} -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "   OK Route fonctionne! Status: $($response.StatusCode)" -ForegroundColor Green
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   Resultat: $($data.count) BLs avec status 'unpaid'" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "TOUS LES TESTS SONT PASSES!" -ForegroundColor Green
Write-Host "Vous pouvez maintenant tester le filtre dans l'interface web" -ForegroundColor Cyan
