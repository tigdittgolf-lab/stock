$mysqlPath = "C:\wamp64\bin\mariadb\mariadb10.6.5\bin\mysql.exe"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "NETTOYAGE DES DOUBLONS AVEC ID TEMPORAIRE" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

$databases = @('2009_bu02', '2025_bu02', '2099_bu02')

foreach ($db in $databases) {
    Write-Host "`n=== BASE: $db ===" -ForegroundColor Yellow
    
    # ARTICLES
    Write-Host "`n  Nettoyage ARTICLES..." -ForegroundColor Cyan
    
    $countBefore = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.article;"
    Write-Host "    Avant: $countBefore articles" -ForegroundColor White
    
    # Ajouter une colonne ID temporaire
    & $mysqlPath -u root ``$db`` -e "ALTER TABLE article ADD COLUMN temp_id INT AUTO_INCREMENT PRIMARY KEY FIRST;" 2>&1 | Out-Null
    
    # Supprimer NULL/vides
    & $mysqlPath -u root ``$db`` -e "DELETE FROM article WHERE Narticle IS NULL OR Narticle = '';" 2>&1 | Out-Null
    
    # Supprimer les doublons en gardant le plus petit temp_id
    & $mysqlPath -u root ``$db`` -e "
DELETE a1 FROM article a1
INNER JOIN article a2 
WHERE a1.Narticle = a2.Narticle 
AND a1.temp_id > a2.temp_id;
" 2>&1 | Out-Null
    
    # Supprimer la colonne temporaire
    & $mysqlPath -u root ``$db`` -e "ALTER TABLE article DROP COLUMN temp_id;" 2>&1 | Out-Null
    
    $countAfter = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.article;"
    $deleted = $countBefore - $countAfter
    
    Write-Host "    Apres: $countAfter articles" -ForegroundColor Green
    if ($deleted -gt 0) {
        Write-Host "    Supprimes: $deleted" -ForegroundColor Yellow
    } else {
        Write-Host "    Aucun doublon" -ForegroundColor Green
    }
    
    # CLIENTS
    Write-Host "`n  Nettoyage CLIENTS..." -ForegroundColor Cyan
    
    $countBefore = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.client;"
    Write-Host "    Avant: $countBefore clients" -ForegroundColor White
    
    & $mysqlPath -u root ``$db`` -e "ALTER TABLE client ADD COLUMN temp_id INT AUTO_INCREMENT PRIMARY KEY FIRST;" 2>&1 | Out-Null
    & $mysqlPath -u root ``$db`` -e "DELETE FROM client WHERE Nclient IS NULL OR Nclient = '';" 2>&1 | Out-Null
    & $mysqlPath -u root ``$db`` -e "DELETE c1 FROM client c1 INNER JOIN client c2 WHERE c1.Nclient = c2.Nclient AND c1.temp_id > c2.temp_id;" 2>&1 | Out-Null
    & $mysqlPath -u root ``$db`` -e "ALTER TABLE client DROP COLUMN temp_id;" 2>&1 | Out-Null
    
    $countAfter = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.client;"
    $deleted = $countBefore - $countAfter
    
    Write-Host "    Apres: $countAfter clients" -ForegroundColor Green
    if ($deleted -gt 0) {
        Write-Host "    Supprimes: $deleted" -ForegroundColor Yellow
    }
    
    # FOURNISSEURS
    Write-Host "`n  Nettoyage FOURNISSEURS..." -ForegroundColor Cyan
    
    $countBefore = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.fournisseur;"
    Write-Host "    Avant: $countBefore fournisseurs" -ForegroundColor White
    
    & $mysqlPath -u root ``$db`` -e "ALTER TABLE fournisseur ADD COLUMN temp_id INT AUTO_INCREMENT PRIMARY KEY FIRST;" 2>&1 | Out-Null
    & $mysqlPath -u root ``$db`` -e "DELETE FROM fournisseur WHERE Nfournisseur IS NULL OR Nfournisseur = '';" 2>&1 | Out-Null
    & $mysqlPath -u root ``$db`` -e "DELETE f1 FROM fournisseur f1 INNER JOIN fournisseur f2 WHERE f1.Nfournisseur = f2.Nfournisseur AND f1.temp_id > f2.temp_id;" 2>&1 | Out-Null
    & $mysqlPath -u root ``$db`` -e "ALTER TABLE fournisseur DROP COLUMN temp_id;" 2>&1 | Out-Null
    
    $countAfter = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.fournisseur;"
    $deleted = $countBefore - $countAfter
    
    Write-Host "    Apres: $countAfter fournisseurs" -ForegroundColor Green
    if ($deleted -gt 0) {
        Write-Host "    Supprimes: $deleted" -ForegroundColor Yellow
    }
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "NETTOYAGE TERMINE" -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Cyan

# Verification finale
Write-Host "`nVERIFICATION FINALE:" -ForegroundColor Yellow
.\check-data-counts.ps1
