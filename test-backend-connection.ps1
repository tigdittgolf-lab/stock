# Test de connexion au backend via Tailscale

Write-Host "Test de connexion au backend" -ForegroundColor Cyan
Write-Host ""

$BACKEND_URL = "https://desktop-bhhs068.tail1d9c54.ts.net/api"

# Test 1: Health check
Write-Host "1 Test health check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/health" -Method GET -UseBasicParsing
    Write-Host "OK Health check: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "FAILED Health check: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Articles
Write-Host "2 Test GET /api/sales/articles..." -ForegroundColor Yellow
try {
    $headers = @{
        "X-Tenant" = "2025_bu01"
    }
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/sales/articles" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "OK Articles: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Nombre articles: $($data.data.Count)"
} catch {
    Write-Host "FAILED Articles: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Clients
Write-Host "3 Test GET /api/sales/clients..." -ForegroundColor Yellow
try {
    $headers = @{
        "X-Tenant" = "2025_bu01"
    }
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/sales/clients" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "OK Clients: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Nombre clients: $($data.data.Count)"
} catch {
    Write-Host "FAILED Clients: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Suppliers
Write-Host "4 Test GET /api/sales/suppliers..." -ForegroundColor Yellow
try {
    $headers = @{
        "X-Tenant" = "2025_bu01"
    }
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/sales/suppliers" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "OK Suppliers: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Nombre fournisseurs: $($data.data.Count)"
} catch {
    Write-Host "FAILED Suppliers: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Resume" -ForegroundColor Cyan
Write-Host "Backend URL: $BACKEND_URL"
