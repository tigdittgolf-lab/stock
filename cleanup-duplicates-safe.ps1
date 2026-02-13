$mysqlPath = "C:\wamp64\bin\mariadb\mariadb10.6.5\bin\mysql.exe"
$mysqldumpPath = "C:\wamp64\bin\mariadb\mariadb10.6.5\bin\mysqldump.exe"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "NETTOYAGE SECURISE DES DOUBLONS ET CODES NULL" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

$databases = @('2009_bu02', '2025_bu02', '2099_bu02')
$backupDir = "C:\Users\SERVICE-INFO\Downloads\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Creer le dossier de sauvegarde
Write-Host "Creation du dossier de sauvegarde: $backupDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Sauvegarder chaque base avant modification
Write-Host "`nETAPE 1: SAUVEGARDE DES BASES DE DONNEES`n" -ForegroundColor Cyan
foreach ($db in $databases) {
    Write-Host "  Sauvegarde de $db..." -ForegroundColor Yellow
    $backupFile = Join-Path $backupDir "$db`_backup.sql"
    & $mysqldumpPath -u root $db > $backupFile
    $fileSize = (Get-Item $backupFile).Length / 1MB
    Write-Host "  OK - Sauvegarde creee: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
}

Write-Host "`nETAPE 2: NETTOYAGE DES DOUBLONS ET CODES NULL`n" -ForegroundColor Cyan

foreach ($db in $databases) {
    Write-Host "`n=== BASE: $db ===" -ForegroundColor Yellow
    
    # ARTICLES
    Write-Host "`n  Nettoyage table ARTICLE..." -ForegroundColor Cyan
    
    # Compter avant
    $countBefore = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.article;"
    Write-Host "    Articles avant: $countBefore" -ForegroundColor White
    
    # Supprimer les NULL/vides
    & $mysqlPath -u root -e "DELETE FROM ``$db``.article WHERE Narticle IS NULL OR Narticle = '';" 2>&1 | Out-Null
    $countAfterNull = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.article;"
    $deletedNull = $countBefore - $countAfterNull
    if ($deletedNull -gt 0) {
        Write-Host "    Supprimes (NULL/vide): $deletedNull" -ForegroundColor Yellow
    }
    
    # Supprimer les doublons (garder le premier)
    $dupQuery = "DELETE t1 FROM ``$db``.article t1 INNER JOIN ``$db``.article t2 WHERE t1.Narticle = t2.Narticle AND t1.Narticle > t2.Narticle;"
    & $mysqlPath -u root -e $dupQuery 2>&1 | Out-Null
    
    $countAfterDup = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.article;"
    $deletedDup = $countAfterNull - $countAfterDup
    if ($deletedDup -gt 0) {
        Write-Host "    Doublons supprimes: $deletedDup" -ForegroundColor Yellow
    }
    
    Write-Host "    Articles apres: $countAfterDup" -ForegroundColor Green
    Write-Host "    Total supprimes: $($countBefore - $countAfterDup)" -ForegroundColor Green
    
    # CLIENTS
    Write-Host "`n  Nettoyage table CLIENT..." -ForegroundColor Cyan
    
    $countBefore = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.client;"
    Write-Host "    Clients avant: $countBefore" -ForegroundColor White
    
    # Supprimer NULL/vides
    & $mysqlPath -u root -e "DELETE FROM ``$db``.client WHERE Nclient IS NULL OR Nclient = '';" 2>&1 | Out-Null
    $countAfterNull = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.client;"
    $deletedNull = $countBefore - $countAfterNull
    if ($deletedNull -gt 0) {
        Write-Host "    Supprimes (NULL/vide): $deletedNull" -ForegroundColor Yellow
    }
    
    # Supprimer doublons
    $dupQuery = "DELETE t1 FROM ``$db``.client t1 INNER JOIN ``$db``.client t2 WHERE t1.Nclient = t2.Nclient AND t1.Nclient > t2.Nclient;"
    & $mysqlPath -u root -e $dupQuery 2>&1 | Out-Null
    
    $countAfterDup = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.client;"
    $deletedDup = $countAfterNull - $countAfterDup
    if ($deletedDup -gt 0) {
        Write-Host "    Doublons supprimes: $deletedDup" -ForegroundColor Yellow
    }
    
    Write-Host "    Clients apres: $countAfterDup" -ForegroundColor Green
    Write-Host "    Total supprimes: $($countBefore - $countAfterDup)" -ForegroundColor Green
    
    # FOURNISSEURS
    Write-Host "`n  Nettoyage table FOURNISSEUR..." -ForegroundColor Cyan
    
    $countBefore = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.fournisseur;"
    Write-Host "    Fournisseurs avant: $countBefore" -ForegroundColor White
    
    # Supprimer NULL/vides
    & $mysqlPath -u root -e "DELETE FROM ``$db``.fournisseur WHERE Nfournisseur IS NULL OR Nfournisseur = '';" 2>&1 | Out-Null
    $countAfterNull = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.fournisseur;"
    $deletedNull = $countBefore - $countAfterNull
    if ($deletedNull -gt 0) {
        Write-Host "    Supprimes (NULL/vide): $deletedNull" -ForegroundColor Yellow
    }
    
    # Supprimer doublons
    $dupQuery = "DELETE t1 FROM ``$db``.fournisseur t1 INNER JOIN ``$db``.fournisseur t2 WHERE t1.Nfournisseur = t2.Nfournisseur AND t1.Nfournisseur > t2.Nfournisseur;"
    & $mysqlPath -u root -e $dupQuery 2>&1 | Out-Null
    
    $countAfterDup = & $mysqlPath -u root -N -e "SELECT COUNT(*) FROM ``$db``.fournisseur;"
    $deletedDup = $countAfterNull - $countAfterDup
    if ($deletedDup -gt 0) {
        Write-Host "    Doublons supprimes: $deletedDup" -ForegroundColor Yellow
    }
    
    Write-Host "    Fournisseurs apres: $countAfterDup" -ForegroundColor Green
    Write-Host "    Total supprimes: $($countBefore - $countAfterDup)" -ForegroundColor Green
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "NETTOYAGE TERMINE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "`nSauvegardes disponibles dans: $backupDir" -ForegroundColor Yellow
Write-Host "`nPour restaurer une base en cas de probleme:" -ForegroundColor White
Write-Host "  mysql -u root nom_base < $backupDir\nom_base_backup.sql`n" -ForegroundColor Gray
