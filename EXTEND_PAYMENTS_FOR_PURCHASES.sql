-- Extension de la table payments pour supporter les achats fournisseurs
-- Compatible Supabase (PostgreSQL) et MySQL

-- ===== POUR SUPABASE/POSTGRESQL =====
-- Modifier la contrainte pour accepter les types de documents d'achat
ALTER TABLE payments DROP CONSTRAINT IF EXISTS chk_document_type;

ALTER TABLE payments ADD CONSTRAINT chk_document_type 
CHECK (document_type IN (
    'delivery_note',           -- BL client (vente)
    'invoice',                 -- Facture client (vente)
    'purchase_delivery_note',  -- BL fournisseur (achat)
    'purchase_invoice'         -- Facture fournisseur (achat)
));

-- Ajouter un commentaire pour clarifier
COMMENT ON COLUMN payments.document_type IS 'Type de document: delivery_note, invoice (ventes) ou purchase_delivery_note, purchase_invoice (achats)';

-- ===== POUR MYSQL (à exécuter séparément) =====
-- MySQL utilise une syntaxe différente pour les contraintes CHECK

-- Étape 1: Trouver le nom de la contrainte
-- SELECT CONSTRAINT_NAME 
-- FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
-- WHERE TABLE_NAME = 'payments' 
--   AND CONSTRAINT_TYPE = 'CHECK' 
--   AND CONSTRAINT_NAME LIKE '%document_type%';

-- Étape 2: Supprimer la contrainte (remplacer 'payments_chk_1' par le nom trouvé)
-- ALTER TABLE payments DROP CHECK payments_chk_1;

-- Étape 3: Ajouter la nouvelle contrainte
-- ALTER TABLE payments ADD CONSTRAINT chk_document_type 
-- CHECK (document_type IN (
--     'delivery_note',
--     'invoice',
--     'purchase_delivery_note',
--     'purchase_invoice'
-- ));

-- OU PLUS SIMPLE: Recréer la table avec la nouvelle contrainte
-- (Sauvegarder d'abord les données existantes!)

-- Vérification
SELECT 
    'Payments table extended successfully!' as status,
    COUNT(*) as total_payments
FROM payments;
