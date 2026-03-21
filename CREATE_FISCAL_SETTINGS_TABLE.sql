-- ============================================================================
-- TABLE fiscal_settings — Paramètres fiscaux par tenant
-- ============================================================================
-- SUPABASE (PostgreSQL) : exécuter dans le SQL Editor Supabase
-- MySQL                 : exécuter dans phpMyAdmin ou MySQL Workbench
-- ============================================================================


-- ============================================================================
-- VERSION SUPABASE (PostgreSQL)
-- ============================================================================
-- Décommentez ce bloc si vous utilisez Supabase

/*
CREATE TABLE IF NOT EXISTS public.fiscal_settings (
  id                SERIAL PRIMARY KEY,
  tenant            TEXT NOT NULL UNIQUE,
  tva_normal        NUMERIC(5,2) NOT NULL DEFAULT 19,
  tva_reduit        NUMERIC(5,2) NOT NULL DEFAULT 9,
  tva_super_reduit  NUMERIC(5,2) NOT NULL DEFAULT 0,
  tap_rate          NUMERIC(5,2) NOT NULL DEFAULT 2,
  timbre_fiscal     NUMERIC(10,2) NOT NULL DEFAULT 0.5,
  ias_rate          NUMERIC(5,2) NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'DZD',
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- RLS : accessible uniquement via service role (API routes)
ALTER TABLE public.fiscal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.fiscal_settings
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_fiscal_settings_tenant ON public.fiscal_settings(tenant);
*/


-- ============================================================================
-- VERSION MySQL
-- ============================================================================
-- Décommentez ce bloc si vous utilisez MySQL
-- Remplacez `your_database` par le nom de votre base de données

/*
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
*/


-- ============================================================================
-- VERSIONS PRÊTES À L'EMPLOI (sans commentaires)
-- ============================================================================

-- >> SUPABASE : copier-coller directement dans le SQL Editor <<

CREATE TABLE IF NOT EXISTS public.fiscal_settings (
  id                SERIAL PRIMARY KEY,
  tenant            TEXT NOT NULL UNIQUE,
  tva_normal        NUMERIC(5,2) NOT NULL DEFAULT 19,
  tva_reduit        NUMERIC(5,2) NOT NULL DEFAULT 9,
  tva_super_reduit  NUMERIC(5,2) NOT NULL DEFAULT 0,
  tap_rate          NUMERIC(5,2) NOT NULL DEFAULT 2,
  timbre_fiscal     NUMERIC(10,2) NOT NULL DEFAULT 0.5,
  ias_rate          NUMERIC(5,2) NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'DZD',
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fiscal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.fiscal_settings
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_fiscal_settings_tenant ON public.fiscal_settings(tenant);
