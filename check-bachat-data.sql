-- Vérifier les données dans la table bachat
SELECT COUNT(*) as total_bl FROM bachat;

-- Voir les 5 premiers BL
SELECT * FROM bachat LIMIT 5;

-- Vérifier les fournisseurs
SELECT COUNT(*) as total_fournisseurs FROM fournisseur;

-- Voir les détails d'un BL
SELECT * FROM bachat_detail LIMIT 5;
