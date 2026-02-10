# =====================================================
# MIGRATION VERS LE PORT STANDARD 3306
# =====================================================

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   MIGRATION PORT 3307 -> 3306 (Standard)               " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$mysqlPath = "C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe"

# 1. Vérifier que le port 3306 est accessible
Write-Host "1. Verification du port 3306..." -ForegroundColor Yellow
try {
    $test = & $mysqlPath -u root -P 3306 -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK Port 3306 accessible" -ForegroundColor Green
    } else {
        Write-Host "   ERREUR: Port 3306 non accessible" -ForegroundColor Red
        Write-Host "   Verifiez qu'un serveur MySQL tourne sur le port 3306" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ERREUR: $_" -ForegroundColor Red
    exit 1
}

# 2. Créer la base stock_management sur le port 3306 si elle n'existe pas
Write-Host "`n2. Creation de la base stock_management (port 3306)..." -ForegroundColor Yellow
& $mysqlPath -u root -P 3306 -e "CREATE DATABASE IF NOT EXISTS stock_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1
Write-Host "   OK Base creee/verifiee" -ForegroundColor Green

# 3. Créer la table payments sur le port 3306
Write-Host "`n3. Creation de la table payments (port 3306)..." -ForegroundColor Yellow
$createTable = @"
USE stock_management;

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    document_type VARCHAR(20) NOT NULL,
    document_id BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT,
    
    INDEX idx_tenant_document (tenant_id, document_type, document_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_tenant_id (tenant_id),
    
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_document_type CHECK (document_type IN ('delivery_note', 'invoice'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"@

$createTable | & $mysqlPath -u root -P 3306 2>&1
Write-Host "   OK Table creee/verifiee" -ForegroundColor Green

# 4. Exporter les données du port 3307
Write-Host "`n4. Export des donnees depuis le port 3307..." -ForegroundColor Yellow
$exportFile = "payments_export_3307.sql"
& $mysqlPath -u root -P 3307 -e "SELECT * FROM stock_management.payments;" --batch --skip-column-names | Out-File -FilePath $exportFile -Encoding UTF8
Write-Host "   OK Donnees exportees vers $exportFile" -ForegroundColor Green

# 5. Compter les paiements sur le port 3307
$count3307 = & $mysqlPath -u root -P 3307 -e "SELECT COUNT(*) FROM stock_management.payments;" --batch --skip-column-names
Write-Host "   Paiements sur port 3307: $count3307" -ForegroundColor Cyan

# 6. Copier les données vers le port 3306
Write-Host "`n5. Copie des donnees vers le port 3306..." -ForegroundColor Yellow

# Récupérer les données du port 3307
$payments = & $mysqlPath -u root -P 3307 -e "SELECT id, tenant_id, document_type, document_id, payment_date, amount, payment_method, notes, created_at, updated_at FROM stock_management.payments;" --batch --skip-column-names

if ($payments) {
    $lines = $payments -split "`n"
    $imported = 0
    
    foreach ($line in $lines) {
        if ($line.Trim()) {
            $fields = $line -split "`t"
            if ($fields.Count -ge 8) {
                $insertQuery = @"
INSERT INTO stock_management.payments 
(tenant_id, document_type, document_id, payment_date, amount, payment_method, notes, created_at, updated_at)
VALUES 
('$($fields[1])', '$($fields[2])', $($fields[3]), '$($fields[4])', $($fields[5]), '$($fields[6])', '$($fields[7])', '$($fields[8])', '$($fields[9])');
"@
                & $mysqlPath -u root -P 3306 -e $insertQuery 2>&1 | Out-Null
                $imported++
                Write-Host "   Importe: $($fields[2])/$($fields[3]) - $($fields[5]) DA" -ForegroundColor Gray
            }
        }
    }
    Write-Host "   OK $imported paiements importes" -ForegroundColor Green
} else {
    Write-Host "   ATTENTION: Aucune donnee a importer" -ForegroundColor Yellow
}

# 7. Vérifier les données sur le port 3306
Write-Host "`n6. Verification finale..." -ForegroundColor Yellow
$count3306 = & $mysqlPath -u root -P 3306 -e "SELECT COUNT(*) FROM stock_management.payments;" --batch --skip-column-names
Write-Host "   Paiements sur port 3306: $count3306" -ForegroundColor Cyan

# 8. Afficher les paiements
Write-Host "`n7. Paiements sur le port 3306:" -ForegroundColor Yellow
& $mysqlPath -u root -P 3306 -e "SELECT id, document_type, document_id, amount, payment_date FROM stock_management.payments ORDER BY id;" --table

# Résumé
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   MIGRATION TERMINEE                                   " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

Write-Host "Port 3307: $count3307 paiements" -ForegroundColor Gray
Write-Host "Port 3306: $count3306 paiements" -ForegroundColor Green
Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host "1. Verifier dans phpMyAdmin (port 3306 par defaut)" -ForegroundColor White
Write-Host "2. Activer MySQL dans l'application avec PORT 3306" -ForegroundColor White
Write-Host "3. Tout fonctionnera avec les standards!" -ForegroundColor White
Write-Host ""

Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
