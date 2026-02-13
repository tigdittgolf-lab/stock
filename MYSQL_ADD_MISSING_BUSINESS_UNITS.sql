-- ==========================================
-- AJOUTER LES BU MANQUANTES DANS MYSQL
-- ==========================================
-- L'utilisateur admin a accès à 6 BU mais seulement 4 sont dans la table business_units
-- BU autorisées: 2009_bu02, 2024_bu01, 2025_bu01, 2025_bu02, 2026_bu01, 2099_bu02
-- BU actuelles dans la table: 2024_bu01, 2025_bu01, 2025_bu02, 2026_bu01 (4 BU)
-- BU manquantes: 2009_bu02, 2099_bu02

USE stock_management_auth;

-- Vérifier les BU existantes
SELECT schema_name, bu_code, year, nom_entreprise, active 
FROM business_units 
ORDER BY year DESC, bu_code;

-- Ajouter les BU manquantes
INSERT INTO business_units (schema_name, bu_code, year, nom_entreprise, adresse, telephone, email, active, created_at, updated_at)
VALUES 
  ('2009_bu02', 'BU02', 2009, 'ETS BENAMAR BOUZID MENOUAR - Archives 2009', 'Alger, Algérie', '021-123456', 'contact@benamar.dz', 1, NOW(), NOW()),
  ('2099_bu02', 'BU02', 2099, 'ETS BENAMAR BOUZID MENOUAR - Test/Demo', 'Alger, Algérie', '021-123456', 'contact@benamar.dz', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  nom_entreprise = VALUES(nom_entreprise),
  active = VALUES(active),
  updated_at = NOW();

-- Vérifier que toutes les 6 BU sont maintenant présentes
SELECT 
  schema_name, 
  bu_code, 
  year, 
  nom_entreprise, 
  active,
  CASE 
    WHEN schema_name IN ('2009_bu02', '2024_bu01', '2025_bu01', '2025_bu02', '2026_bu01', '2099_bu02') 
    THEN '✅ Autorisée pour admin'
    ELSE '❌ Non autorisée'
  END as statut_admin
FROM business_units 
ORDER BY year DESC, bu_code;

-- Compter les BU actives
SELECT COUNT(*) as total_bu_actives 
FROM business_units 
WHERE active = 1;
