-- =====================================================
-- DIAGNOSTIC SIMPLE : Tables d'achats
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- 1. Lister toutes les tables du schéma 2025_bu01
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = '2025_bu01' 
ORDER BY table_name;

-- 2. Vérifier les fournisseurs
SELECT COUNT(*) as nb_fournisseurs FROM "2025_bu01".fournisseur;
SELECT * FROM "2025_bu01".fournisseur LIMIT 3;

-- 3. Vérifier la structure de la table article (colonnes liées aux prix)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'article'
AND column_name LIKE '%prix%'
ORDER BY ordinal_position;