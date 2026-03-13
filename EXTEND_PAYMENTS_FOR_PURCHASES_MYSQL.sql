-- Extension de la table payments pour MySQL
-- Support des achats fournisseurs

-- Étape 1: Trouver le nom de la contrainte CHECK existante
SELECT CONSTRAINT_NAME 
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'payments' 
  AND CONSTRAINT_TYPE = 'CHECK' 
  AND CONSTRAINT_NAME LIKE '%document_type%';

-- Étape 2: Supprimer la contrainte (remplacer le nom si différent)
-- Note: Le nom peut être 'payments_chk_1', 'payments_chk_2', ou 'chk_document_type'
-- Essayez ces commandes une par une jusqu'à ce que l'une fonctionne:

ALTER TABLE payments DROP CHECK payments_chk_1;
-- OU
-- ALTER TABLE payments DROP CHECK payments_chk_2;
-- OU
-- ALTER TABLE payments DROP CHECK chk_document_type;

-- Étape 3: Ajouter la nouvelle contrainte avec les types d'achats
ALTER TABLE payments ADD CONSTRAINT chk_document_type 
CHECK (document_type IN (
    'delivery_note',           -- BL client (vente)
    'invoice',                 -- Facture client (vente)
    'purchase_delivery_note',  -- BL fournisseur (achat)
    'purchase_invoice'         -- Facture fournisseur (achat)
));

-- Vérification
SELECT 
    'Payments table extended successfully for MySQL!' as status,
    COUNT(*) as total_payments
FROM payments;

-- Test: Essayer d'insérer un paiement d'achat (devrait fonctionner maintenant)
-- INSERT INTO payments (tenant_id, document_type, document_id, payment_date, amount)
-- VALUES ('2009_bu02', 'purchase_invoice', 1, CURDATE(), 100.00);
