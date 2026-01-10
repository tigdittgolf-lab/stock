# Test script to verify invoice details fix
Write-Host "🧪 Testing Invoice Details Fix..." -ForegroundColor Green

$backendUrl = "https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/invoices/2"
$headers = @{
    "X-Tenant" = "2025_bu01"
    "Content-Type" = "application/json"
}

Write-Host "📞 Calling backend: $backendUrl" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $backendUrl -Method GET -Headers $headers
    
    Write-Host "✅ Backend Response received" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    
    if ($response.success -and $response.data) {
        Write-Host "📋 Invoice ID: $($response.data.nfact)" -ForegroundColor Cyan
        Write-Host "👤 Client: $($response.data.client_name)" -ForegroundColor Cyan
        Write-Host "💰 Total: $($response.data.montant_ttc) DA" -ForegroundColor Cyan
        
        $detailsCount = 0
        if ($response.data.details) { 
            $detailsCount = $response.data.details.Count 
        }
        Write-Host "📦 Details count: $detailsCount" -ForegroundColor Cyan
        
        if ($response.data.details -and $response.data.details.Count -gt 0) {
            Write-Host "📦 Article Details:" -ForegroundColor Magenta
            for ($i = 0; $i -lt $response.data.details.Count; $i++) {
                $detail = $response.data.details[$i]
                Write-Host "  $($i + 1). $($detail.designation) ($($detail.narticle)) - Qty: $($detail.qte), Price: $($detail.prix) DA" -ForegroundColor White
            }
            Write-Host "🎉 SUCCESS: Invoice details are now working!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ WARNING: No article details found - still showing 'Aucun détail d'article disponible'" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ ERROR: Backend returned error: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}