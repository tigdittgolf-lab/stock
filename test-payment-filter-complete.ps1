# Test Payment Filter - Complete Test Suite
# Run this AFTER restarting the backend

Write-Host "🧪 Payment Filter Test Suite" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3005"
$tenant = "2009_bu02"

# Test 1: Check backend is running
Write-Host "Test 1: Checking if backend is running..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host "   Please start the backend first:" -ForegroundColor Red
    Write-Host "   cd backend" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Supabase - Paid BLs
Write-Host "Test 2: Supabase - Paid BLs (should return BL 8703)" -ForegroundColor Yellow
try {
    $headers = @{
        "X-Tenant" = $tenant
        "X-Database-Type" = "supabase"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sales/delivery-notes-by-payment-status?status=paid" -Headers $headers -Method Get
    
    if ($response.success -and $response.count -gt 0) {
        Write-Host "✅ SUCCESS: Found $($response.count) paid BL(s)" -ForegroundColor Green
        $response.data | ForEach-Object {
            Write-Host "   - BL $($_.nbl): $($_.montant_ttc) DA (paid: $($_.total_paid) DA)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ FAILED: No paid BLs found (expected BL 8703)" -ForegroundColor Red
        Write-Host "   Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Supabase - Partially Paid BLs
Write-Host "Test 3: Supabase - Partially Paid BLs (should return BL 8701)" -ForegroundColor Yellow
try {
    $headers = @{
        "X-Tenant" = $tenant
        "X-Database-Type" = "supabase"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sales/delivery-notes-by-payment-status?status=partially_paid" -Headers $headers -Method Get
    
    if ($response.success -and $response.count -gt 0) {
        Write-Host "✅ SUCCESS: Found $($response.count) partially paid BL(s)" -ForegroundColor Green
        $response.data | ForEach-Object {
            Write-Host "   - BL $($_.nbl): $($_.montant_ttc) DA (paid: $($_.total_paid) DA, balance: $($_.balance) DA)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ FAILED: No partially paid BLs found (expected BL 8701)" -ForegroundColor Red
        Write-Host "   Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Supabase - Unpaid BLs
Write-Host "Test 4: Supabase - Unpaid BLs (should return many BLs)" -ForegroundColor Yellow
try {
    $headers = @{
        "X-Tenant" = $tenant
        "X-Database-Type" = "supabase"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sales/delivery-notes-by-payment-status?status=unpaid" -Headers $headers -Method Get
    
    if ($response.success) {
        Write-Host "✅ SUCCESS: Found $($response.count) unpaid BL(s)" -ForegroundColor Green
        if ($response.count -gt 0) {
            Write-Host "   First 3 unpaid BLs:" -ForegroundColor Gray
            $response.data | Select-Object -First 3 | ForEach-Object {
                Write-Host "   - BL $($_.nbl): $($_.montant_ttc) DA (paid: 0 DA)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "⚠️  WARNING: Query succeeded but returned 0 unpaid BLs" -ForegroundColor Yellow
        Write-Host "   This might be correct if all BLs have payments" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 5: MySQL - Paid BLs
Write-Host "Test 5: MySQL - Paid BLs" -ForegroundColor Yellow
try {
    $headers = @{
        "X-Tenant" = $tenant
        "X-Database-Type" = "mysql"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sales/delivery-notes-by-payment-status?status=paid" -Headers $headers -Method Get
    
    if ($response.success) {
        Write-Host "✅ SUCCESS: Found $($response.count) paid BL(s) in MySQL" -ForegroundColor Green
        if ($response.count -gt 0) {
            $response.data | Select-Object -First 3 | ForEach-Object {
                Write-Host "   - BL $($_.nbl): $($_.montant_ttc) DA (paid: $($_.total_paid) DA)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "⚠️  Query succeeded but returned 0 paid BLs" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 6: Performance Test
Write-Host "Test 6: Performance Test (should be fast, <3 seconds)" -ForegroundColor Yellow
try {
    $headers = @{
        "X-Tenant" = $tenant
        "X-Database-Type" = "supabase"
    }
    $startTime = Get-Date
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sales/delivery-notes-by-payment-status?status=paid" -Headers $headers -Method Get
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    if ($duration -lt 3) {
        Write-Host "✅ SUCCESS: Query completed in $([math]::Round($duration, 2)) seconds" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WARNING: Query took $([math]::Round($duration, 2)) seconds (expected <3s)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================`n" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan
Write-Host "If all tests passed:" -ForegroundColor Green
Write-Host "  ✅ Backend is working correctly" -ForegroundColor Green
Write-Host "  ✅ Supabase payment filter is fixed" -ForegroundColor Green
Write-Host "  ✅ MySQL payment filter is working" -ForegroundColor Green
Write-Host "  ✅ Performance is good (<3 seconds)" -ForegroundColor Green
Write-Host ""
Write-Host "If tests failed:" -ForegroundColor Red
Write-Host "  1. Check backend console for errors" -ForegroundColor Yellow
Write-Host "  2. Verify you restarted the backend" -ForegroundColor Yellow
Write-Host "  3. Run: node test-supabase-payments-direct.mjs" -ForegroundColor Yellow
Write-Host "  4. Read: PAYMENT_FILTER_FIX_COMPLETE.md" -ForegroundColor Yellow
Write-Host ""
