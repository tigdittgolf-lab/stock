-- Extension de la table payments pour supporter les achats fournisseurs
-- Compatible Supabase (PostgreSQL) et MySQL

-- Pour Supabase/PostgreSQL:
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

-- Pour MySQL (à exécuter séparément si nécessaire):
/*
ALTER TABLE payments DROP CHECK chk_document_type;

ALTER TABLE payments ADD CONSTRAINT chk_document_type 
CHECK (document_type IN (
    'delivery_note',
    'invoice',
    'purchase_delivery_note',
    'purchase_invoice'
));
*/

-- Vérification
SELECT 
    'Payments table extended successfully!' as status,
    COUNT(*) as total_payments
FROM payments;
