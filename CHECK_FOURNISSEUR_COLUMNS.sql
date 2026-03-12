-- Vérifier la structure exacte de la table fournisseur
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'fournisseur'
ORDER BY ordinal_position;

-- Vérifier aussi les autres tables
SELECT 'article' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'article'
  AND column_name IN ('Narticle', 'designation', 'Designation', 'stock', 'prix_vente')
UNION ALL
SELECT 'client', column_name, data_type
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'client'
  AND column_name IN ('Nclient', 'Raison_sociale', 'raison_sociale', 'adresse')
UNION ALL
SELECT 'fournisseur', column_name, data_type
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'fournisseur'
  AND column_name IN ('Nfournisseur', 'Raison_sociale', 'raison_sociale', 'adresse', 'Adresse_fourni');
