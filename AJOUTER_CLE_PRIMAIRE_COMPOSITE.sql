-- =====================================================
-- AJOUTER LES CLÉS PRIMAIRES COMPOSITES
-- Pour les tables bachat, bachat_detail, fachat, fachat_detail
-- =====================================================

-- Quelle base de données utilisez-vous ?
-- Remplacez 'votre_base' par le nom de votre base (ex: stock_management, 2013, etc.)
USE stock_management;

-- ===== TABLE bachat (BL d'achats) =====

-- 1. Modifier les colonnes pour qu'elles soient NOT NULL
ALTER TABLE bachat MODIFY COLUMN nfact VARCHAR(20) NOT NULL;
ALTER TABLE bachat MODIFY COLUMN nfournisseur VARCHAR(20) NOT NULL;

-- 2. Ajouter la clé primaire composite
ALTER TABLE bachat ADD PRIMARY KEY (nfact, nfournisseur);

-- 3. Ajouter un index sur la date pour les recherches
ALTER TABLE bachat ADD INDEX idx_date_fact (date_fact);

SHOW CREATE TABLE bachat;


-- ===== TABLE bachat_detail (Détails BL d'achats) =====

-- 1. Modifier les colonnes pour qu'elles soient NOT NULL
ALTER TABLE bachat_detail MODIFY COLUMN NFact VARCHAR(20) NOT NULL;
ALTER TABLE bachat_detail MODIFY COLUMN nfournisseur VARCHAR(20) NOT NULL;
ALTER TABLE bachat_detail MODIFY COLUMN Narticle VARCHAR(20) NOT NULL;

-- 2. Ajouter la clé primaire composite (nfact, nfournisseur, narticle)
ALTER TABLE bachat_detail ADD PRIMARY KEY (NFact, nfournisseur, Narticle);

-- 3. Ajouter la contrainte de clé étrangère
ALTER TABLE bachat_detail 
  ADD CONSTRAINT fk_bachat_detail 
  FOREIGN KEY (NFact, nfournisseur) 
  REFERENCES bachat(nfact, nfournisseur) 
  ON DELETE CASCADE;

SHOW CREATE TABLE bachat_detail;


-- ===== TABLE fachat (Factures d'achats) =====

-- Les colonnes sont déjà NOT NULL, on ajoute juste la clé primaire
ALTER TABLE fachat ADD PRIMARY KEY (nfact, nfournisseur);

-- Ajouter un index sur la date pour les recherches
ALTER TABLE fachat ADD INDEX idx_date_fact (date_fact);

SHOW CREATE TABLE fachat;


-- ===== TABLE fachat_detail (Détails factures d'achats) =====

-- 1. Modifier les colonnes pour qu'elles soient NOT NULL
ALTER TABLE fachat_detail MODIFY COLUMN NFact VARCHAR(20) NOT NULL;
ALTER TABLE fachat_detail MODIFY COLUMN nfournisseur VARCHAR(20) NOT NULL;
ALTER TABLE fachat_detail MODIFY COLUMN Narticle VARCHAR(20) NOT NULL;

-- 2. Ajouter la clé primaire composite
ALTER TABLE fachat_detail ADD PRIMARY KEY (NFact, nfournisseur, Narticle);

-- 3. Ajouter la contrainte de clé étrangère
ALTER TABLE fachat_detail 
  ADD CONSTRAINT fk_fachat_detail 
  FOREIGN KEY (NFact, nfournisseur) 
  REFERENCES fachat(nfact, nfournisseur) 
  ON DELETE CASCADE;

SHOW CREATE TABLE fachat_detail;


-- ===== VÉRIFICATION FINALE =====

-- Afficher les clés primaires
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    ORDINAL_POSITION,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('bachat', 'bachat_detail', 'fachat', 'fachat_detail')
  AND COLUMN_KEY = 'PRI'
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- Afficher les contraintes de clés étrangères
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('bachat_detail', 'fachat_detail')
  AND REFERENCED_TABLE_NAME IS NOT NULL;
