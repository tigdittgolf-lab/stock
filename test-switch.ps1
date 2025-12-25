# Test du switch vers MySQL
Write-Host "=== Test Switch vers MySQL ===" -ForegroundColor Green

$body = @{
    type = "mysql"
    host = "localhost"
    port = 3307
    database = "stock_management"
    username = "root"
    password = ""
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3005/api/database/switch" -Method POST -Body $body -ContentType "application/json" -Headers @{"X-Tenant"="2025_bu01"}
Write-Host "Switch MySQL Response:" -ForegroundColor Yellow
$response | ConvertTo-Json -Depth 3

Write-Host "`n=== Test Récupération Fournisseurs ===" -ForegroundColor Green
$suppliers = Invoke-RestMethod -Uri "http://localhost:3005/api/suppliers" -Method GET -Headers @{"X-Tenant"="2025_bu01"}
Write-Host "Fournisseurs MySQL:" -ForegroundColor Yellow
$suppliers | ConvertTo-Json -Depth 3

Write-Host "`n=== Test Switch vers PostgreSQL ===" -ForegroundColor Green
$bodyPG = @{
    type = "postgresql"
    host = "localhost"
    port = 5432
    database = "stock_management"
    username = "postgres"
    password = "postgres"
} | ConvertTo-Json

$responsePG = Invoke-RestMethod -Uri "http://localhost:3005/api/database/switch" -Method POST -Body $bodyPG -ContentType "application/json" -Headers @{"X-Tenant"="2025_bu01"}
Write-Host "Switch PostgreSQL Response:" -ForegroundColor Yellow
$responsePG | ConvertTo-Json -Depth 3

$suppliersPG = Invoke-RestMethod -Uri "http://localhost:3005/api/suppliers" -Method GET -Headers @{"X-Tenant"="2025_bu01"}
Write-Host "Fournisseurs PostgreSQL:" -ForegroundColor Yellow
$suppliersPG | ConvertTo-Json -Depth 3