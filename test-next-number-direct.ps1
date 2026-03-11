# Test direct de la route next-number

Write-Host "🧪 Testing /api/sales/delivery-notes/next-number" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3005"
$tenant = "2025_bu01"

# Test 1: Sans headers
Write-Host "Test 1: Sans headers (devrait échouer avec 400)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/sales/delivery-notes/next-number" -Method Get -ErrorAction Stop
    Write-Host "✅ Response: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Error: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host $responseBody -ForegroundColor Gray
}

Write-Host ""

# Test 2: Avec header X-Tenant
Write-Host "Test 2: Avec header X-Tenant (devrait fonctionner)" -ForegroundColor Yellow
try {
    $headers = @{
        "X-Tenant" = $tenant
        "X-Database-Type" = "supabase"
    }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/sales/delivery-notes/next-number" -Headers $headers -Method Get -ErrorAction Stop
    Write-Host "✅ Response: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Error: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody -ForegroundColor Gray
    }
}

Write-Host ""

# Test 3: Avec curl (pour comparer)
Write-Host "Test 3: Avec curl.exe" -ForegroundColor Yellow
curl.exe http://localhost:3005/api/sales/delivery-notes/next-number -H "X-Tenant: $tenant" -H "X-Database-Type: supabase" -v

Write-Host ""
Write-Host "============================`n" -ForegroundColor Cyan
