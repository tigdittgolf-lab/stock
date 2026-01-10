# Test database structure for invoice details
Write-Host "🔍 Testing database structure for invoice details..." -ForegroundColor Green

# Test if we can access the backend
$headers = @{"X-Tenant" = "2025_bu01"}

Write-Host "📋 Testing backend connection..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-WebRequest -Uri "https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/test-exec-sql" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✅ Backend connection OK" -ForegroundColor Green
    Write-Host $testResponse.Content
} catch {
    Write-Host "❌ Backend connection failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📊 Testing invoice list..." -ForegroundColor Yellow
try {
    $invoiceListResponse = Invoke-WebRequest -Uri "https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/invoices" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✅ Invoice list retrieved" -ForegroundColor Green
    $invoiceData = $invoiceListResponse.Content | ConvertFrom-Json
    Write-Host "Found $($invoiceData.data.Count) invoices:" -ForegroundColor Cyan
    foreach ($invoice in $invoiceData.data) {
        Write-Host "  - Invoice $($invoice.nfact): $($invoice.montant_ht) DA HT" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Invoice list failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 Testing invoice 2 details..." -ForegroundColor Yellow
try {
    $invoice2Response = Invoke-WebRequest -Uri "https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/invoices/2" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✅ Invoice 2 retrieved" -ForegroundColor Green
    $invoice2Data = $invoice2Response.Content | ConvertFrom-Json
    Write-Host "Invoice 2 details count: $($invoice2Data.data.details.Count)" -ForegroundColor Cyan
    if ($invoice2Data.data.details.Count -gt 0) {
        Write-Host "🎉 SUCCESS: Invoice details are working!" -ForegroundColor Green
        foreach ($detail in $invoice2Data.data.details) {
            Write-Host "  - $($detail.designation) ($($detail.narticle)): Qty $($detail.qte), Price $($detail.prix) DA" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️ WARNING: No invoice details found - this is the issue we need to fix" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Invoice 2 details failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nDone!" -ForegroundColor Green