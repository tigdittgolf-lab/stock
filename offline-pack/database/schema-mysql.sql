-- =====================================================================
-- Stock Management - Schéma MySQL complet (mode offline / local)
-- =====================================================================
-- Compatible MariaDB 10.x et MySQL 8.x
-- Ce fichier crée toutes les tables nécessaires, avec les contraintes,
-- les index et un utilisateur admin par défaut.
--
-- Utilisation :
--   mysql -u root -p < schema-mysql.sql
-- ou via le lanceur (initialisation automatique au premier démarrage).
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- Base de données principale (tenant par défaut)
-- Le nom correspond au tenant_id utilisé par l'application (ex: 2025_bu01)
-- ---------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `2025_bu01`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Base d'authentification (séparée, comme dans auth-mysql.ts)
CREATE DATABASE IF NOT EXISTS `stock_management_auth`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- BASE D'AUTHENTIFICATION
-- =====================================================================
USE `stock_management_auth`;

USE `stock_management_auth`;

-- ---------------------------------------------------------------------
-- Table license_state (état de licence, anti-réinitialisation)
-- machine_id : clé primaire = ID machine Windows
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `license_state` (
  `machine_id` VARCHAR(32) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'unlicensed' COMMENT 'unlicensed | trial | active',
  `type` VARCHAR(10) DEFAULT NULL COMMENT 'T15 | T30 | PERP',
  `bu` VARCHAR(50) DEFAULT NULL,
  `activated_at` VARCHAR(64) DEFAULT NULL,
  `expires_at` VARCHAR(64) DEFAULT NULL,
  `license_key` VARCHAR(255) DEFAULT NULL,
  `trial_started_at` VARCHAR(64) DEFAULT NULL,
  `trial_days` INT DEFAULT 15,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`machine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(64) NOT NULL COMMENT 'SHA-256 hex',
  `profil` VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT 'USER | ADMIN',
  `has_login` TINYINT(1) NOT NULL DEFAULT 1,
  `activite` VARCHAR(255) DEFAULT NULL,
  `code_activite` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- BASE MÉTIER (tenant par défaut : 2025_bu01)
-- =====================================================================
USE `2025_bu01`;

-- ---------------------------------------------------------------------
-- Table activite (infos société / business unit)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activite` (
  `tenant_id` VARCHAR(50) PRIMARY KEY,
  `code_activite` VARCHAR(20) DEFAULT NULL,
  `domaine_activite` VARCHAR(255) DEFAULT NULL,
  `sous_domaine` VARCHAR(255) DEFAULT NULL,
  `raison_sociale` VARCHAR(255) DEFAULT NULL,
  `nom_entreprise` VARCHAR(200) DEFAULT NULL,
  `adresse` TEXT,
  `commune` VARCHAR(255) DEFAULT NULL,
  `wilaya` VARCHAR(255) DEFAULT NULL,
  `tel_fixe` VARCHAR(20) DEFAULT NULL,
  `tel_port` VARCHAR(20) DEFAULT NULL,
  `telephone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `e_mail` VARCHAR(255) DEFAULT NULL,
  `nrc` VARCHAR(50) DEFAULT NULL,
  `nis` VARCHAR(50) DEFAULT NULL,
  `nart` VARCHAR(50) DEFAULT NULL,
  `nif` VARCHAR(50) DEFAULT NULL,
  `rc` VARCHAR(50) DEFAULT NULL,
  `ident_fiscal` VARCHAR(50) DEFAULT NULL,
  `banq` VARCHAR(255) DEFAULT NULL,
  `slogan` TEXT,
  `entete_bon` TEXT,
  `logo_url` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table famille_art (familles d'articles)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `famille_art` (
  `famille` VARCHAR(50) PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table fournisseur
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fournisseur` (
  `Nfournisseur` VARCHAR(10) PRIMARY KEY,
  `Nom_fournisseur` VARCHAR(100) NOT NULL,
  `Resp_fournisseur` VARCHAR(50) DEFAULT NULL,
  `Adresse_fourni` VARCHAR(255) DEFAULT NULL,
  `Tel` VARCHAR(20) DEFAULT NULL,
  `tel1` VARCHAR(20) DEFAULT NULL,
  `tel2` VARCHAR(20) DEFAULT NULL,
  `CAF` DECIMAL(15,2) DEFAULT 0.00,
  `CABL` DECIMAL(15,2) DEFAULT 0.00,
  `EMAIL` VARCHAR(100) DEFAULT NULL,
  `commentaire` TEXT,
  INDEX `idx_fournisseur_nom` (`Nom_fournisseur`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table article
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `article` (
  `Narticle` VARCHAR(10) PRIMARY KEY,
  `famille` VARCHAR(50) NOT NULL,
  `designation` VARCHAR(150) NOT NULL,
  `Nfournisseur` VARCHAR(10) DEFAULT NULL,
  `prix_unitaire` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `marge` INT NOT NULL DEFAULT 0,
  `tva` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `prix_vente` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `seuil` INT NOT NULL DEFAULT 0,
  `stock_f` INT NOT NULL DEFAULT 0,
  `stock_bl` INT NOT NULL DEFAULT 0,
  INDEX `idx_article_famille` (`famille`),
  INDEX `idx_article_fournisseur` (`Nfournisseur`),
  INDEX `idx_article_designation` (`designation`),
  CONSTRAINT `fk_article_famille` FOREIGN KEY (`famille`)
    REFERENCES `famille_art`(`famille`) ON UPDATE CASCADE,
  CONSTRAINT `fk_article_fournisseur` FOREIGN KEY (`Nfournisseur`)
    REFERENCES `fournisseur`(`Nfournisseur`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table client
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `client` (
  `Nclient` VARCHAR(10) PRIMARY KEY,
  `Raison_sociale` VARCHAR(150) DEFAULT NULL,
  `adresse` VARCHAR(255) DEFAULT NULL,
  `contact_person` VARCHAR(50) DEFAULT NULL,
  `C_affaire_fact` DECIMAL(15,2) DEFAULT 0.00,
  `C_affaire_bl` DECIMAL(15,2) DEFAULT 0.00,
  `NRC` VARCHAR(50) DEFAULT NULL,
  `Date_RC` DATE DEFAULT NULL,
  `Lieu_RC` VARCHAR(50) DEFAULT NULL,
  `I_Fiscal` VARCHAR(50) DEFAULT NULL,
  `N_article` VARCHAR(50) DEFAULT NULL,
  `Tel` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `Commentaire` TEXT,
  INDEX `idx_client_raison` (`Raison_sociale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table fact (factures)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fact` (
  `NFact` INT AUTO_INCREMENT PRIMARY KEY,
  `Nclient` VARCHAR(10) NOT NULL,
  `date_fact` DATE NOT NULL,
  `montant_ht` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `timbre` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `TVA` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `autre_taxe` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `marge` DECIMAL(15,2) DEFAULT 0.00,
  `banq` VARCHAR(255) DEFAULT NULL,
  `ncheque` VARCHAR(255) DEFAULT NULL,
  `nbc` VARCHAR(255) DEFAULT NULL,
  `date_bc` DATE DEFAULT NULL,
  `nom_preneur` VARCHAR(255) DEFAULT NULL,
  INDEX `idx_fact_client` (`Nclient`),
  INDEX `idx_fact_date` (`date_fact`),
  CONSTRAINT `fk_fact_client` FOREIGN KEY (`Nclient`)
    REFERENCES `client`(`Nclient`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `detail_fact` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `NFact` INT NOT NULL,
  `Narticle` VARCHAR(10) NOT NULL,
  `Qte` INT NOT NULL DEFAULT 1,
  `tva` DECIMAL(5,2) DEFAULT NULL,
  `pr_achat` DECIMAL(15,2) DEFAULT 0.00,
  `prix` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_ligne` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  INDEX `idx_detail_fact_nfact` (`NFact`),
  CONSTRAINT `fk_detail_fact_fact` FOREIGN KEY (`NFact`)
    REFERENCES `fact`(`NFact`) ON DELETE CASCADE,
  CONSTRAINT `fk_detail_fact_article` FOREIGN KEY (`Narticle`)
    REFERENCES `article`(`Narticle`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table bl (bons de livraison)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bl` (
  `NFact` INT AUTO_INCREMENT PRIMARY KEY,
  `Nclient` VARCHAR(10) NOT NULL,
  `date_fact` DATE NOT NULL,
  `montant_ht` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `timbre` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `TVA` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `autre_taxe` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `facturer` TINYINT(1) NOT NULL DEFAULT 0,
  `nbc` VARCHAR(255) DEFAULT NULL,
  `date_bc` DATE DEFAULT NULL,
  `nom_preneur` VARCHAR(255) DEFAULT NULL,
  `banq` VARCHAR(255) DEFAULT NULL,
  `ncheque` VARCHAR(255) DEFAULT NULL,
  INDEX `idx_bl_client` (`Nclient`),
  INDEX `idx_bl_date` (`date_fact`),
  CONSTRAINT `fk_bl_client` FOREIGN KEY (`Nclient`)
    REFERENCES `client`(`Nclient`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `detail_bl` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `NFact` INT NOT NULL,
  `Narticle` VARCHAR(10) NOT NULL,
  `Qte` INT NOT NULL DEFAULT 1,
  `tva` DECIMAL(5,2) DEFAULT NULL,
  `prix` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_ligne` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `facturer` TINYINT(1) NOT NULL DEFAULT 0,
  INDEX `idx_detail_bl_nfact` (`NFact`),
  CONSTRAINT `fk_detail_bl_bl` FOREIGN KEY (`NFact`)
    REFERENCES `bl`(`NFact`) ON DELETE CASCADE,
  CONSTRAINT `fk_detail_bl_article` FOREIGN KEY (`Narticle`)
    REFERENCES `article`(`Narticle`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table fprof (factures proforma)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fprof` (
  `NFact` INT AUTO_INCREMENT PRIMARY KEY,
  `Nclient` VARCHAR(10) NOT NULL,
  `date_fact` DATE NOT NULL,
  `montant_ht` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `timbre` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `TVA` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `autre_taxe` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `marge` DECIMAL(15,2) DEFAULT 0.00,
  `banq` VARCHAR(255) DEFAULT NULL,
  `ncheque` VARCHAR(255) DEFAULT NULL,
  `nbc` VARCHAR(255) DEFAULT NULL,
  `date_bc` DATE DEFAULT NULL,
  `nom_preneur` VARCHAR(255) DEFAULT NULL,
  INDEX `idx_fprof_client` (`Nclient`),
  CONSTRAINT `fk_fprof_client` FOREIGN KEY (`Nclient`)
    REFERENCES `client`(`Nclient`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `detail_fprof` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `NFact` INT NOT NULL,
  `Narticle` VARCHAR(10) NOT NULL,
  `Qte` INT NOT NULL DEFAULT 1,
  `tva` DECIMAL(5,2) DEFAULT NULL,
  `pr_achat` DECIMAL(15,2) DEFAULT 0.00,
  `prix` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_ligne` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  INDEX `idx_detail_fprof_nfact` (`NFact`),
  CONSTRAINT `fk_detail_fprof_fprof` FOREIGN KEY (`NFact`)
    REFERENCES `fprof`(`NFact`) ON DELETE CASCADE,
  CONSTRAINT `fk_detail_fprof_article` FOREIGN KEY (`Narticle`)
    REFERENCES `article`(`Narticle`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table fachat (factures d'achat)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fachat` (
  `NFact` INT AUTO_INCREMENT PRIMARY KEY,
  `Nfournisseur` VARCHAR(10) NOT NULL,
  `date_fact` DATE NOT NULL,
  `montant_ht` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `timbre` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `TVA` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `autre_taxe` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `banq` VARCHAR(255) DEFAULT NULL,
  `ncheque` VARCHAR(255) DEFAULT NULL,
  INDEX `idx_fachat_fournisseur` (`Nfournisseur`),
  INDEX `idx_fachat_date` (`date_fact`),
  CONSTRAINT `fk_fachat_fournisseur` FOREIGN KEY (`Nfournisseur`)
    REFERENCES `fournisseur`(`Nfournisseur`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `fachat_detail` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `NFact` INT NOT NULL,
  `Narticle` VARCHAR(10) NOT NULL,
  `Qte` INT NOT NULL DEFAULT 1,
  `tva` DECIMAL(5,2) DEFAULT NULL,
  `prix` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_ligne` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  INDEX `idx_fachat_detail_nfact` (`NFact`),
  CONSTRAINT `fk_fachat_detail_fachat` FOREIGN KEY (`NFact`)
    REFERENCES `fachat`(`NFact`) ON DELETE CASCADE,
  CONSTRAINT `fk_fachat_detail_article` FOREIGN KEY (`Narticle`)
    REFERENCES `article`(`Narticle`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table user_info (infos utilisateurs côté métier)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_info` (
  `username` VARCHAR(50) PRIMARY KEY,
  `pass_word` VARCHAR(255) NOT NULL,
  `profil` VARCHAR(20) DEFAULT 'USER',
  `has_login` TINYINT(1) DEFAULT 0,
  `activite` VARCHAR(255) DEFAULT NULL,
  `code_activite` VARCHAR(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table stock_table_parameter (compteurs de numérotation)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_table_parameter` (
  `code_activite` VARCHAR(20) PRIMARY KEY,
  `db_name` VARCHAR(255) DEFAULT NULL,
  `n_bl` INT DEFAULT 1,
  `n_fact` INT DEFAULT 1,
  `n_prof` INT DEFAULT 1,
  `user_bd` VARCHAR(255) DEFAULT NULL,
  `passwd_bd` VARCHAR(255) DEFAULT NULL,
  `lieu_backup` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table payments (paiements - utilisée par paymentRepository)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `doc_type` VARCHAR(20) NOT NULL COMMENT 'BL | FACTURE | PROFORMA',
  `doc_id` INT NOT NULL,
  `client_code` VARCHAR(10) DEFAULT NULL,
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `payment_date` DATE NOT NULL,
  `due_date` DATE DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT NULL COMMENT 'ESPECES | CHEQUE | VIREMENT',
  `reference` VARCHAR(255) DEFAULT NULL,
  `note` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_payments_doc` (`doc_type`, `doc_id`),
  INDEX `idx_payments_client` (`client_code`),
  INDEX `idx_payments_date` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table avoirs (notes de crédit)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `avoirs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `doc_type` VARCHAR(20) NOT NULL COMMENT 'BL | FACTURE',
  `doc_id` INT NOT NULL,
  `client_code` VARCHAR(10) DEFAULT NULL,
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `reason` VARCHAR(255) DEFAULT NULL,
  `avoir_date` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_avoirs_doc` (`doc_type`, `doc_id`),
  INDEX `idx_avoirs_client` (`client_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- DONNÉES INITIALES
-- =====================================================================

-- Tenant par défaut
INSERT IGNORE INTO `activite` (`tenant_id`, `code_activite`, `raison_sociale`)
VALUES ('2025_bu01', 'BU01', 'Ma Société');

-- Familles par défaut
INSERT IGNORE INTO `famille_art` (`famille`) VALUES
  ('Divers'),
  ('Non classé');

-- Compteurs de numérotation
INSERT IGNORE INTO `stock_table_parameter` (`code_activite`, `db_name`, `n_bl`, `n_fact`, `n_prof`)
VALUES ('BU01', '2025_bu01', 1, 1, 1);

-- =====================================================================
-- FIN
-- =====================================================================
