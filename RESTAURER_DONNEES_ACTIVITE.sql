-- =====================================================
-- RESTAURER LES VRAIES DONNÉES DE LA TABLE ACTIVITE
-- =====================================================

-- Restaurer les vraies données pour 2025_bu01
UPDATE "2025_bu01".activite 
SET 
  adresse = '10, Rue Belhandouz A.E.K, Mostaganem',
  telephone = '(213)045.42.35.20',
  email = 'outillagesaada@gmail.com',
  sous_domaine = 'Outillage et Équipements',
  slogan = 'Votre partenaire de confiance'
WHERE true;

-- Vérifier les données restaurées
SELECT 'Données restaurées pour 2025_bu01:' as info;
SELECT nom_entreprise, adresse, telephone, email, nif, rc, sous_domaine, slogan 
FROM "2025_bu01".activite LIMIT 1;

-- Si vous avez d'autres schémas avec des données de test, restaurez-les aussi
-- Remplacez XXXX_buXX par vos vrais schémas si nécessaire

-- Pour 2024_bu01 (si nécessaire)
UPDATE "2024_bu01".activite 
SET 
  adresse = '10, Rue Belhandouz A.E.K, Mostaganem',
  telephone = '(213)045.42.35.20',
  email = 'outillagesaada@gmail.com',
  sous_domaine = 'Outillage et Équipements',
  slogan = 'Votre partenaire de confiance'
WHERE true;

-- Pour 2025_bu02 (si nécessaire)
UPDATE "2025_bu02".activite 
SET 
  adresse = '10, Rue Belhandouz A.E.K, Mostaganem',
  telephone = '(213)045.42.35.20',
  email = 'outillagesaada@gmail.com',
  sous_domaine = 'Outillage et Équipements',
  slogan = 'Votre partenaire de confiance'
WHERE true;

-- Pour 2026_bu01 (si nécessaire)
UPDATE "2026_bu01".activite 
SET 
  adresse = '10, Rue Belhandouz A.E.K, Mostaganem',
  telephone = '(213)045.42.35.20',
  email = 'outillagesaada@gmail.com',
  sous_domaine = 'Outillage et Équipements',
  slogan = 'Votre partenaire de confiance'
WHERE true;