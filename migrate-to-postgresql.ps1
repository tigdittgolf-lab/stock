# =====================================================
# MIGRATION VERS POSTGRESQL LOCAL
# =====================================================

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   MIGRATION VERS POSTGRESQL LOCAL                      " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$env:PGPASSWORD = "postgres"
$PGUSER = "postgres"
$PGHOST = "localhost"
$PGPORT = "5432"
$PGDB = "stock_management"

# 1. Créer la base de données si elle n'existe pas
Write-Host "1. Creation de la base stock_management..." -ForegroundColor Yellow
$createDb = psql -U $PGUSER -h $PGHOST -p $PGPORT -d postgres -c "CREATE DATABASE stock_management;" 2>&1
if ($createDb -match "already exists") {
    Write-Host "   OK Base existe deja" -ForegroundColor Green
} elseif ($LASTEXITCODE -eq 0) {
    Write-Host "   OK Base creee" -ForegroundColor Green
} else {
    Write-Host "   ERREUR: $createDb" -ForegroundColor Red
}

# 2. Créer la table payments
Write-Host "`n2. Creation de la table payments..." -ForegroundColor Yellow
$result = psql -U $PGUSER -h $PGHOST -p $PGPORT -d $PGDB -f setup-postgresql-payments.sql 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   OK Table creee" -ForegroundColor Green
} else {
    Write-Host "   ERREUR: $result" -ForegroundColor Red
    exit 1
}

# 3. Récupérer les paiements depuis MySQL (port 3306)
Write-Host "`n3. Recuperation des paiements depuis MySQL..." -ForegroundColor Yellow
$mysqlPath = "C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe"
$payments = & $mysqlPath -u root -P 3306 -e "SELECT tenant_id, document_type, document_id, payment_date, amount, payment_method, notes, created_at, updated_at FROM stock_management.payments;" --batch --skip-column-names 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERREUR: Impossible de recuperer les donnees MySQL" -ForegroundColor Red
    Write-Host "   $payments" -ForegroundColor Red
    exit 1
}

$lines = $payments -split "`n" | Where-Object { $_.Trim() }
Write-Host "   OK $($lines.Count) paiements trouves" -ForegroundColor Green

# 4. Insérer les paiements dans PostgreSQL
Write-Host "`n4. Insertion des paiements dans PostgreSQL..." -ForegroundColor Yellow
$imported = 0
$errors = 0

foreach ($line in $lines) {
    $fields = $line -split "`t"
    if ($fields.Count -ge 7) {
        $tenant = $fields[0]
        $docType = $fields[1]
        $docId = $fields[2]
        $payDate = $fields[3]
        $amount = $fields[4]
        $method = if ($fields[5]) { "'$($fields[5])'" } else { "NULL" }
        $notes = if ($fields[6]) { "'$($fields[6] -replace "'", "''")'" } else { "NULL" }
        $createdAt = if ($fields[7]) { "'$($fields[7])'" } else { "CURRENT_TIMESTAMP" }
        $updatedAt = if ($fields[8]) { "'$($fields[8])'" } else { "CURRENT_TIMESTAMP" }
        
        $insertQuery = @"
INSERT INTO payments (tenant_id, document_type, document_id, payment_date, amount, payment_method, notes, created_at, updated_at)
VALUES ('$tenant', '$docType', $docId, '$payDate', $amount, $method, $notes, $createdAt, $updatedAt);
"@
        
        $result = psql -U $PGUSER -h $PGHOST -p $PGPORT -d $PGDB -c $insertQuery 2>&1
        if ($LASTEXITCODE -eq 0) {
            $imported++
            Write-Host "   Importe: $docType/$docId - $amount DA" -ForegroundColor Gray
        } else {
            $errors++
            Write-Host "   ERREUR: $docType/$docId - $result" -ForegroundColor Red
        }
    }
}

Write-Host "   OK $imported paiements importes, $errors erreurs" -ForegroundColor Green

# 5. Vérification finale
Write-Host "`n5. Verification finale..." -ForegroundColor Yellow
$count = psql -U $PGUSER -h $PGHOST -p $PGPORT -d $PGDB -t -c "SELECT COUNT(*) FROM payments;" 2>&1
Write-Host "   Total dans PostgreSQL: $($count.Trim()) paiements" -ForegroundColor Cyan

# 6. Afficher les paiements
Write-Host "`n6. Paiements dans PostgreSQL:" -ForegroundColor Yellow
psql -U $PGUSER -h $PGHOST -p $PGPORT -d $PGDB -c "SELECT id, document_type, document_id, amount, payment_date FROM payments ORDER BY id;"

# Résumé
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   MIGRATION TERMINEE                                   " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

Write-Host "OK $imported paiements migres vers PostgreSQL" -ForegroundColor Green
Write-Host ""
Write-Host "CONFIGURATION POUR L'APPLICATION:" -ForegroundColor Yellow
Write-Host "  Host:     localhost" -ForegroundColor White
Write-Host "  Port:     5432" -ForegroundColor White
Write-Host "  Database: stock_management" -ForegroundColor White
Write-Host "  User:     postgres" -ForegroundColor White
Write-Host "  Password: postgres" -ForegroundColor White
Write-Host ""
Write-Host "PROCHAINE ETAPE:" -ForegroundColor Yellow
Write-Host "  Activer PostgreSQL dans l'interface de l'application" -ForegroundColor White
Write-Host ""

Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
