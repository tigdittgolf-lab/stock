# Script de test: Création d'un paiement dans MySQL
# Vérifie que les paiements sont bien enregistrés dans MySQL et non dans Supabase

Write-Host "=== TEST: Création de paiement dans MySQL ===" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier le nombre de paiements dans MySQL AVANT
Write-Host "1. Nombre de paiements dans MySQL AVANT:" -ForegroundColor Yellow
mysql -u root -P 3306 -e "SELECT COUNT(*) as total FROM payments;" stock_management
Write-Host ""

# 2. Instructions pour l'utilisateur
Write-Host "2. ACTIONS À FAIRE:" -ForegroundColor Green
Write-Host "   - Ouvrez l'application dans le navigateur"
Write-Host "   - Vérifiez que vous êtes sur MySQL (en haut à droite)"
Write-Host "   - Allez sur un bon de livraison (ex: BL 3 ou BL 5)"
Write-Host "   - Ajoutez un nouveau paiement de test (ex: 50 DA)"
Write-Host "   - Appuyez sur ENTRÉE ici quand c'est fait"
Write-Host ""
Read-Host "Appuyez sur ENTRÉE après avoir créé le paiement"
Write-Host ""

# 3. Vérifier le nombre de paiements dans MySQL APRÈS
Write-Host "3. Nombre de paiements dans MySQL APRÈS:" -ForegroundColor Yellow
mysql -u root -P 3306 -e "SELECT COUNT(*) as total FROM payments;" stock_management
Write-Host ""

# 4. Afficher les derniers paiements
Write-Host "4. Les 3 derniers paiements dans MySQL:" -ForegroundColor Yellow
mysql -u root -P 3306 -e "SELECT id, document_id, amount, payment_date, notes FROM payments ORDER BY id DESC LIMIT 3;" stock_management
Write-Host ""

# 5. Vérifier Supabase (ne devrait PAS avoir le nouveau paiement)
Write-Host "5. VÉRIFICATION MANUELLE SUPABASE:" -ForegroundColor Magenta
Write-Host "   - Allez sur https://supabase.com"
Write-Host "   - Ouvrez votre projet"
Write-Host "   - Allez dans Table Editor > payments"
Write-Host "   - Vérifiez que le nouveau paiement N'EST PAS là"
Write-Host ""

Write-Host "=== FIN DU TEST ===" -ForegroundColor Cyan
