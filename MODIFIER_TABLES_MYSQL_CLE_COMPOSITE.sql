-- =====================================================
-- MODIFICATION DES TABLES MYSQL POUR CLÉ COMPOSITE
-- Supprime les ID auto-incrémentés et utilise les clés naturelles
-- =====================================================

USE 2025_bu01;

-- ===== MODIFICATION DE LA TABLE bl_achat =====

-- 1. Supprimer la clé primaire actuelle
ALTER TABLE bl_achat DROP PRIMARY KEY;

-- 2. Supprimer la colonne nbl_achat (ID auto-incrémenté)
ALTER TABLE bl_achat DROP COLUMN nbl_achat;

-- 3. Modifier numero_bl_fournisseur pour qu'il soit NOT NULL
ALTER TABLE bl_achat MODIFY COLUMN numero_bl_fournisseur VARCHAR(100) NOT NULL;

-- 4. Modifier nfournisseur pour qu'il soit NOT NULL
ALTER TABLE bl_achat MODIFY COLUMN nfournisseur VARCHAR(20) NOT NULL;

-- 5. Ajouter la nouvelle clé primaire composite
ALTER TABLE bl_achat ADD PRIMARY KEY (numero_bl_fournisseur, nfournisseur);

-- 6. Ajouter un index sur la date pour les recherches
ALTER TABLE bl_achat ADD INDEX idx_date_bl (date_bl);


-- ===== MODIFICATION DE LA TABLE detail_bl_achat =====

-- 1. Supprimer la clé primaire actuelle (id)
ALTER TABLE detail_bl_achat DROP PRIMARY KEY;

-- 2. Supprimer la colonne id
ALTER TABLE detail_bl_achat DROP COLUMN id;

-- 3. Supprimer la colonne nbl_achat (référence à l'ancien ID)
ALTER TABLE detail_bl_achat DROP COLUMN nbl_achat;

-- 4. Ajouter les colonnes de la clé composite
ALTER TABLE detail_bl_achat ADD COLUMN numero_bl_fournisseur VARCHAR(100) NOT NULL FIRST;
ALTER TABLE detail_bl_achat ADD COLUMN nfournisseur VARCHAR(20) NOT NULL AFTER numero_bl_fournisseur;

-- 5. Modifier narticle pour qu'il soit NOT NULL
ALTER TABLE detail_bl_achat MODIFY COLUMN narticle VARCHAR(20) NOT NULL;

-- 6. Ajouter la nouvelle clé primaire composite
ALTER TABLE detail_bl_achat ADD PRIMARY KEY (numero_bl_fournisseur, nfournisseur, narticle);

-- 7. Ajouter la contrainte de clé étrangère
ALTER TABLE detail_bl_achat 
  ADD CONSTRAINT fk_detail_bl_achat 
  FOREIGN KEY (numero_bl_fournisseur, nfournisseur) 
  REFERENCES bl_achat(numero_bl_fournisseur, nfournisseur) 
  ON DELETE CASCADE;


-- ===== MODIFICATION DE LA TABLE fachat =====

-- 1. Vérifier s'il y a des données existantes
-- SELECT COUNT(*) FROM fachat;

-- 2. Supprimer la clé primaire actuelle
ALTER TABLE fachat DROP PRIMARY KEY;

-- 3. Modifier nfact pour qu'il soit VARCHAR (numéro de facture fournisseur)
ALTER TABLE fachat MODIFY COLUMN nfact VARCHAR(100) NOT NULL;

-- 4. Modifier nfournisseur pour qu'il soit NOT NULL
ALTER TABLE fachat MODIFY COLUMN nfournisseur VARCHAR(20) NOT NULL;

-- 5. Ajouter la nouvelle clé primaire composite
ALTER TABLE fachat ADD PRIMARY KEY (nfact, nfournisseur);

-- 6. Ajouter un index sur la date pour les recherches
ALTER TABLE fachat ADD INDEX idx_date_fact (date_fact);


-- ===== MODIFICATION DE LA TABLE fachat_detail =====

-- 1. Supprimer la clé primaire actuelle (id)
ALTER TABLE fachat_detail DROP PRIMARY KEY;

-- 2. Supprimer la colonne id
ALTER TABLE fachat_detail DROP COLUMN id;

-- 3. Modifier nfact pour qu'il soit VARCHAR
ALTER TABLE fachat_detail MODIFY COLUMN nfact VARCHAR(100) NOT NULL;

-- 4. Modifier nfournisseur pour qu'il soit NOT NULL
ALTER TABLE fachat_detail MODIFY COLUMN nfournisseur VARCHAR(20) NOT NULL;

-- 5. Modifier narticle pour qu'il soit NOT NULL
ALTER TABLE fachat_detail MODIFY COLUMN narticle VARCHAR(20) NOT NULL;

-- 6. Ajouter la nouvelle clé primaire composite
ALTER TABLE fachat_detail ADD PRIMARY KEY (nfact, nfournisseur, narticle);

-- 7. Ajouter la contrainte de clé étrangère
ALTER TABLE fachat_detail 
  ADD CONSTRAINT fk_fachat_detail 
  FOREIGN KEY (nfact, nfournisseur) 
  REFERENCES fachat(nfact, nfournisseur) 
  ON DELETE CASCADE;


-- ===== VÉRIFICATION =====

-- Vérifier la structure de bl_achat
DESCRIBE bl_achat;

-- Vérifier la structure de detail_bl_achat
DESCRIBE detail_bl_achat;

-- Vérifier la structure de fachat
DESCRIBE fachat;

-- Vérifier la structure de fachat_detail
DESCRIBE fachat_detail;

-- Afficher les clés primaires
SHOW KEYS FROM bl_achat WHERE Key_name = 'PRIMARY';
SHOW KEYS FROM detail_bl_achat WHERE Key_name = 'PRIMARY';
SHOW KEYS FROM fachat WHERE Key_name = 'PRIMARY';
SHOW KEYS FROM fachat_detail WHERE Key_name = 'PRIMARY';
