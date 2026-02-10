# Test de l'API balance

Write-Host "=== TEST API BALANCE ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Test de l'API balance pour le BL 3..." -ForegroundColor Yellow
Write-Host ""

try {
    $headers = @{
        "X-Tenant" = "2025_bu01"
        "X-Database-Type" = "mysql"
    }
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/payments/balance?documentType=delivery_note&documentId=3" -Headers $headers -UseBasicParsing
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "❌ ERREUR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "Détails de l'erreur:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== FIN DU TEST ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si vous voyez une erreur, le frontend doit être redémarré:" -ForegroundColor Yellow
Write-Host "   .\restart-frontend-only.ps1" -ForegroundColor Cyan
Write-Host ""
