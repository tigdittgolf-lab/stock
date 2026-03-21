-- ============================================================================
-- TABLE fiscal_settings — Paramètres fiscaux par tenant
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.fiscal_settings (
  id          SERIAL PRIMARY KEY,
  tenant      TEXT NOT NULL UNIQUE,
  tva_normal  NUMERIC(5,2) NOT NULL DEFAULT 19,
  tva_reduit  NUMERIC(5,2) NOT NULL DEFAULT 9,
  tva_super_reduit NUMERIC(5,2) NOT NULL DEFAULT 0,
  tap_rate    NUMERIC(5,2) NOT NULL DEFAULT 2,
  timbre_fiscal NUMERIC(10,2) NOT NULL DEFAULT 0.5,
  ias_rate    NUMERIC(5,2) NOT NULL DEFAULT 0,
  currency    TEXT NOT NULL DEFAULT 'DZD',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: accessible uniquement via service role (API routes)
ALTER TABLE public.fiscal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.fiscal_settings
  USING (true)
  WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_fiscal_settings_tenant ON public.fiscal_settings(tenant);
