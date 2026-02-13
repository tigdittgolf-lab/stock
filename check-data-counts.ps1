$mysqlPath = "C:\wamp64\bin\mariadb\mariadb10.6.5\bin\mysql.exe"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION DES DONNEES DANS TOUTES LES BASES" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

$databases = @('2009_bu02', '2024_bu01', '2025_bu01', '2025_bu02', '2026_bu01', '2099_bu02')

foreach ($db in $databases) {
    Write-Host "`n=== BASE: $db ===" -ForegroundColor Yellow
    
    # Articles
    $articleCount = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM $db.article;" 2>$null
    Write-Host "  Articles:     $articleCount" -ForegroundColor Green
    
    # Clients
    $clientCount = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM $db.client;" 2>$null
    Write-Host "  Clients:      $clientCount" -ForegroundColor Green
    
    # Fournisseurs
    $fournisseurCount = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM $db.fournisseur;" 2>$null
    Write-Host "  Fournisseurs: $fournisseurCount" -ForegroundColor Green
    
    # Vérifier les doublons dans articles
    $articleDups = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM (SELECT Narticle, COUNT(*) as cnt FROM $db.article GROUP BY Narticle HAVING cnt > 1) as dups;" 2>$null
    if ($articleDups -gt 0) {
        Write-Host "  ⚠️  Articles en double: $articleDups codes" -ForegroundColor Red
    }
    
    # Vérifier les NULL dans articles
    $articleNulls = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM $db.article WHERE Narticle IS NULL OR Narticle = '';" 2>$null
    if ($articleNulls -gt 0) {
        Write-Host "  ⚠️  Articles avec code NULL/vide: $articleNulls" -ForegroundColor Red
    }
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION TERMINEE" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan
