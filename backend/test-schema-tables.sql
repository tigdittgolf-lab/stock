-- Script pour vérifier l'existence des schémas et tables
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier si le schéma 2025_bu01 existe
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = '2025_bu01';

-- 2. Vérifier quelles tables existent dans le schéma 2025_bu01
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = '2025_bu01';

-- 3. Vérifier la structure de la table fact si elle existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' 
AND table_name = 'fact'
ORDER BY ordinal_position;