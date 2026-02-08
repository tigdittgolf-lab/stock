-- Script de vérification Supabase
-- Exécute ces requêtes dans le SQL Editor de Supabase pour vérifier que tout est en place

-- ============================================
-- 1. VÉRIFIER QUE LA TABLE EXISTE
-- ============================================
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'payments';

-- Résultat attendu : 1 ligne avec table_name = 'payments'


-- ============================================
-- 2. VÉRIFIER LES COLONNES
-- ============================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- Résultat attendu : 10 colonnes
-- id (bigint, NO)
-- tenant_id (text, NO)
-- document_type (text, NO)
-- document_id (integer, NO)
-- payment_date (date, NO)
-- amount (numeric, NO)
-- payment_method (text, YES)
-- notes (text, YES)
-- created_at (timestamp, NO)
-- updated_at (timestamp, NO)


-- ============================================
-- 3. VÉRIFIER LES INDEX
-- ============================================
SELECT 
    indexname, 
    indexdef
FROM pg_indexes
WHERE tablename = 'payments';

-- Résultat attendu : 3 index
-- payments_pkey (PRIMARY KEY sur id)
-- idx_payments_tenant_document (sur tenant_id, document_type, document_id)
-- idx_payments_date (sur payment_date)


-- ============================================
-- 4. VÉRIFIER LES CONTRAINTES
-- ============================================
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass;

-- Résultat attendu : 
-- payments_pkey (PRIMARY KEY)
-- payments_amount_check (CHECK amount > 0)
-- payments_document_type_check (CHECK document_type IN ('delivery_note', 'invoice'))


-- ============================================
-- 5. TESTER L'INSERTION D'UN PAIEMENT
-- ============================================
-- ATTENTION : Remplace 'VOTRE_TENANT_ID' par ton tenant_id réel (ex: 2025_bu01)
-- ATTENTION : Remplace '1' par un nbl existant dans ta table bons_livraison

INSERT INTO payments (
    tenant_id,
    document_type,
    document_id,
    payment_date,
    amount,
    payment_method,
    notes
) VALUES (
    '2025_bu01',  -- ← Remplace par ton tenant_id
    'delivery_note',
    1,  -- ← Remplace par un nbl existant
    CURRENT_DATE,
    5000.00,
    'cash',
    'Test de vérification'
);

-- Résultat attendu : 1 row inserted


-- ============================================
-- 6. VÉRIFIER QUE LE PAIEMENT EST INSÉRÉ
-- ============================================
SELECT 
    id,
    tenant_id,
    document_type,
    document_id,
    payment_date,
    amount,
    payment_method,
    notes,
    created_at
FROM payments
WHERE tenant_id = '2025_bu01'  -- ← Remplace par ton tenant_id
ORDER BY created_at DESC
LIMIT 5;

-- Résultat attendu : Tu devrais voir ton paiement de test


-- ============================================
-- 7. TESTER LA VALIDATION DU MONTANT
-- ============================================
-- Cette requête DOIT échouer (montant négatif)
INSERT INTO payments (
    tenant_id,
    document_type,
    document_id,
    payment_date,
    amount,
    payment_method
) VALUES (
    '2025_bu01',
    'delivery_note',
    1,
    CURRENT_DATE,
    -1000.00,  -- ← Montant négatif
    'cash'
);

-- Résultat attendu : ERROR: new row for relation "payments" violates check constraint "payments_amount_check"


-- ============================================
-- 8. TESTER LA VALIDATION DU TYPE DE DOCUMENT
-- ============================================
-- Cette requête DOIT échouer (type invalide)
INSERT INTO payments (
    tenant_id,
    document_type,
    document_id,
    payment_date,
    amount,
    payment_method
) VALUES (
    '2025_bu01',
    'invalid_type',  -- ← Type invalide
    1,
    CURRENT_DATE,
    1000.00,
    'cash'
);

-- Résultat attendu : ERROR: new row for relation "payments" violates check constraint "payments_document_type_check"


-- ============================================
-- 9. CALCULER LE SOLDE D'UN DOCUMENT
-- ============================================
-- ATTENTION : Remplace '1' par un nbl existant

WITH document_total AS (
    SELECT 
        nbl,
        COALESCE(montant_ttc, montant_ht + tva) AS total_amount
    FROM bons_livraison
    WHERE tenant_id = '2025_bu01'  -- ← Remplace par ton tenant_id
    AND nbl = 1  -- ← Remplace par un nbl existant
),
payments_total AS (
    SELECT 
        COALESCE(SUM(amount), 0) AS total_paid
    FROM payments
    WHERE tenant_id = '2025_bu01'  -- ← Remplace par ton tenant_id
    AND document_type = 'delivery_note'
    AND document_id = 1  -- ← Remplace par un nbl existant
)
SELECT 
    dt.nbl AS document_id,
    dt.total_amount,
    pt.total_paid,
    (dt.total_amount - pt.total_paid) AS balance,
    CASE 
        WHEN pt.total_paid = 0 THEN 'unpaid'
        WHEN pt.total_paid < dt.total_amount THEN 'partially_paid'
        WHEN pt.total_paid = dt.total_amount THEN 'paid'
        ELSE 'overpaid'
    END AS status
FROM document_total dt
CROSS JOIN payments_total pt;

-- Résultat attendu : 1 ligne avec le calcul du solde


-- ============================================
-- 10. NETTOYER LES DONNÉES DE TEST
-- ============================================
-- Supprime le paiement de test créé à l'étape 5
DELETE FROM payments
WHERE tenant_id = '2025_bu01'  -- ← Remplace par ton tenant_id
AND notes = 'Test de vérification';

-- Résultat attendu : 1 row deleted


-- ============================================
-- RÉSUMÉ DES VÉRIFICATIONS
-- ============================================
-- ✅ Étape 1 : Table existe
-- ✅ Étape 2 : 10 colonnes présentes
-- ✅ Étape 3 : 3 index créés
-- ✅ Étape 4 : Contraintes en place
-- ✅ Étape 5 : Insertion fonctionne
-- ✅ Étape 6 : Lecture fonctionne
-- ✅ Étape 7 : Validation montant fonctionne
-- ✅ Étape 8 : Validation type fonctionne
-- ✅ Étape 9 : Calcul solde fonctionne
-- ✅ Étape 10 : Suppression fonctionne

-- Si toutes les étapes passent, ta base de données est prête ! 🎉
