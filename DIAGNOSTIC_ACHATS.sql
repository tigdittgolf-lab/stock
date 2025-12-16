-- =====================================================
-- DIAGNOSTIC : Structure des tables d'achats
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- 1. Vérifier les tables d'achats existantes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = '2025_bu01' 
AND table_name IN ('facture_achat', 'detail_facture_achat', 'bon_commande', 'detail_bc', 'bachat', 'fachat', 'bachat_detail', 'fachat_detail')
ORDER BY table_name;

-- 2. Vérifier la structure de la table facture_achat (si elle existe)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'facture_achat'
ORDER BY ordinal_position;

-- 3. Vérifier la structure de la table detail_facture_achat (si elle existe)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'detail_facture_achat'
ORDER BY ordinal_position;

-- 4. Vérifier les données existantes (si les tables existent)
-- SELECT * FROM "2025_bu01".facture_achat LIMIT 5;
-- SELECT * FROM "2025_bu01".detail_facture_achat LIMIT 5;

-- 5. Vérifier les fournisseurs
SELECT nfournisseur, nom_fournisseur, adresse_fourni 
FROM "2025_bu01".fournisseur 
ORDER BY nfournisseur;

-- 6. Vérifier les articles pour les achats
SELECT narticle, designation, stock_bl, stock_f, prix_vente
FROM "2025_bu01".article 
ORDER BY narticle 
LIMIT 5;

-- 7. Vérifier la structure complète de la table article
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'article'
ORDER BY ordinal_position;