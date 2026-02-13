$mysqlPath = "C:\wamp64\bin\mariadb\mariadb10.6.5\bin\mysql.exe"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "NETTOYAGE DES DOUBLONS - METHODE SURE" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

$databases = @('2009_bu02', '2025_bu02', '2099_bu02')

foreach ($db in $databases) {
    Write-Host "`n=== BASE: $db ===" -ForegroundColor Yellow
    
    # ARTICLES
    Write-Host "`n  Nettoyage ARTICLES..." -ForegroundColor Cyan
    
    $countBefore = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.article;"
    Write-Host "    Avant: $countBefore articles" -ForegroundColor White
    
    # Créer une table temporaire avec les doublons à supprimer
    $cleanupSQL = @"
USE ``$db``;

-- Supprimer les NULL/vides
DELETE FROM article WHERE Narticle IS NULL OR Narticle = '';

-- Créer une table temporaire avec les IDs à garder (le premier de chaque groupe)
CREATE TEMPORARY TABLE IF NOT EXISTS keep_ids AS
SELECT MIN(Narticle) as Narticle
FROM article
GROUP BY Narticle;

-- Supprimer tous les articles qui ne sont PAS dans la liste à garder
-- En utilisant une sous-requête pour éviter les problèmes de self-reference
DELETE FROM article 
WHERE Narticle NOT IN (SELECT Narticle FROM keep_ids);

DROP TEMPORARY TABLE IF EXISTS keep_ids;
"@
    
    $cleanupSQL | & $mysqlPath -u root 2>&1 | Out-Null
    
    $countAfter = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.article;"
    $deleted = $countBefore - $countAfter
    
    Write-Host "    Apres: $countAfter articles" -ForegroundColor Green
    if ($deleted -gt 0) {
        Write-Host "    Supprimes: $deleted" -ForegroundColor Yellow
    } else {
        Write-Host "    Aucun doublon trouve" -ForegroundColor Green
    }
    
    # CLIENTS
    Write-Host "`n  Nettoyage CLIENTS..." -ForegroundColor Cyan
    
    $countBefore = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.client;"
    Write-Host "    Avant: $countBefore clients" -ForegroundColor White
    
    $cleanupSQL = @"
USE ``$db``;
DELETE FROM client WHERE Nclient IS NULL OR Nclient = '';
CREATE TEMPORARY TABLE IF NOT EXISTS keep_ids AS SELECT MIN(Nclient) as Nclient FROM client GROUP BY Nclient;
DELETE FROM client WHERE Nclient NOT IN (SELECT Nclient FROM keep_ids);
DROP TEMPORARY TABLE IF EXISTS keep_ids;
"@
    
    $cleanupSQL | & $mysqlPath -u root 2>&1 | Out-Null
    
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
    
    $cleanupSQL = @"
USE ``$db``;
DELETE FROM fournisseur WHERE Nfournisseur IS NULL OR Nfournisseur = '';
CREATE TEMPORARY TABLE IF NOT EXISTS keep_ids AS SELECT MIN(Nfournisseur) as Nfournisseur FROM fournisseur GROUP BY Nfournisseur;
DELETE FROM fournisseur WHERE Nfournisseur NOT IN (SELECT Nfournisseur FROM keep_ids);
DROP TEMPORARY TABLE IF EXISTS keep_ids;
"@
    
    $cleanupSQL | & $mysqlPath -u root 2>&1 | Out-Null
    
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
