# Test simple de modification de BL
$headers = @{
    "X-Tenant" = "2025_bu01"
    "Content-Type" = "application/json"
}

$body = @{
    Nclient = "415"
    date_fact = "2025-01-12"
    detail_bl = @(
        @{
            narticle = "142"
            qte = 15
            prix = 200.00
            tva = 19
        }
    )
} | ConvertTo-Json -Depth 3

Write-Host "🧪 Testing BL modification..."
Write-Host "Body: $body"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/api/sales/delivery-notes/5" -Method PUT -Headers $headers -Body $body -UseBasicParsing
    Write-Host "✅ Response Status: $($response.StatusCode)"
    Write-Host "📊 Response Content: $($response.Content)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
}