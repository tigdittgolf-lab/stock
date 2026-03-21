-- ============================================================================
-- TABLE fiscal_settings — Paramètres fiscaux par tenant
-- VERSION MySQL
-- ============================================================================
-- Exécuter dans phpMyAdmin, MySQL Workbench, ou via CLI :
--   mysql -u root -p your_database < CREATE_FISCAL_SETTINGS_TABLE_MYSQL.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS `fiscal_settings` (
  `id`                INT AUTO_INCREMENT PRIMARY KEY,
  `tenant`            VARCHAR(100) NOT NULL UNIQUE,
  `tva_normal`        DECIMAL(5,2) NOT NULL DEFAULT 19,
  `tva_reduit`        DECIMAL(5,2) NOT NULL DEFAULT 9,
  `tva_super_reduit`  DECIMAL(5,2) NOT NULL DEFAULT 0,
  `tap_rate`          DECIMAL(5,2) NOT NULL DEFAULT 2,
  `timbre_fiscal`     DECIMAL(10,2) NOT NULL DEFAULT 0.5,
  `ias_rate`          DECIMAL(5,2) NOT NULL DEFAULT 0,
  `currency`          VARCHAR(10) NOT NULL DEFAULT 'DZD',
  `updated_at`        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_fiscal_settings_tenant` (`tenant`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
