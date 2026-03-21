-- =====================================================
-- RETOUR EN STOCK — Tables avoir + detail_avoir
-- A exécuter UNE FOIS PAR SCHÉMA TENANT dans Supabase SQL Editor
-- Remplacer '2009_bu02' par le schéma voulu avant d'exécuter
-- =====================================================

-- Étape 1: Se placer dans le bon schéma
SET search_path TO '2009_bu02';  -- ← CHANGER ICI

-- Étape 2: Table avoir (note de crédit / retour client)
CREATE TABLE IF NOT EXISTS avoir (
  id SERIAL PRIMARY KEY,
  nclient VARCHAR(10) NOT NULL,
  date_avoir DATE NOT NULL DEFAULT CURRENT_DATE,
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('bl', 'invoice')),
  document_ref INTEGER NOT NULL,
  montant_ht NUMERIC(15,2) NOT NULL DEFAULT 0,
  tva NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_ttc NUMERIC(15,2) NOT NULL DEFAULT 0,
  motif TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Étape 3: Table detail_avoir
CREATE TABLE IF NOT EXISTS detail_avoir (
  id SERIAL PRIMARY KEY,
  avoir_id INTEGER NOT NULL REFERENCES avoir(id) ON DELETE CASCADE,
  narticle VARCHAR(10) NOT NULL,
  qte NUMERIC(15,2) NOT NULL,
  prix NUMERIC(15,2) NOT NULL,
  tva NUMERIC(5,2) NOT NULL DEFAULT 19,
  total_ligne NUMERIC(15,2) NOT NULL
);

-- Étape 4: Index
CREATE INDEX IF NOT EXISTS idx_avoir_nclient ON avoir(nclient);
CREATE INDEX IF NOT EXISTS idx_avoir_document ON avoir(document_type, document_ref);
CREATE INDEX IF NOT EXISTS idx_detail_avoir_id ON detail_avoir(avoir_id);

-- Vérification
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_name IN ('avoir', 'detail_avoir')
AND table_schema = current_schema();

-- =====================================================
-- Étape 5: Fonctions RPC (dans le schéma public)
-- Ces fonctions accèdent dynamiquement au schéma tenant
-- =====================================================
RESET search_path;

-- Fonction: insérer un avoir
CREATE OR REPLACE FUNCTION insert_avoir(
  p_tenant TEXT,
  p_nclient TEXT,
  p_date_avoir DATE,
  p_document_type TEXT,
  p_document_ref INTEGER,
  p_montant_ht NUMERIC,
  p_tva NUMERIC,
  p_montant_ttc NUMERIC,
  p_motif TEXT DEFAULT NULL
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id INTEGER;
BEGIN
  EXECUTE format(
    'INSERT INTO %I.avoir (nclient, date_avoir, document_type, document_ref, montant_ht, tva, montant_ttc, motif)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
    p_tenant
  )
  INTO v_id
  USING p_nclient, p_date_avoir, p_document_type, p_document_ref,
        p_montant_ht, p_tva, p_montant_ttc, p_motif;
  RETURN v_id;
END;
$$;

-- Fonction: insérer un détail avoir
CREATE OR REPLACE FUNCTION insert_detail_avoir(
  p_tenant TEXT,
  p_avoir_id INTEGER,
  p_narticle TEXT,
  p_qte NUMERIC,
  p_prix NUMERIC,
  p_tva NUMERIC,
  p_total_ligne NUMERIC
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  EXECUTE format(
    'INSERT INTO %I.detail_avoir (avoir_id, narticle, qte, prix, tva, total_ligne)
     VALUES ($1, $2, $3, $4, $5, $6)',
    p_tenant
  )
  USING p_avoir_id, p_narticle, p_qte, p_prix, p_tva, p_total_ligne;
END;
$$;

-- Fonction: lister les avoirs d'un tenant
CREATE OR REPLACE FUNCTION get_avoirs_by_tenant(p_tenant TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSON;
BEGIN
  EXECUTE format(
    'SELECT json_agg(row_to_json(a)) FROM (
       SELECT av.*, c.raison_sociale AS client_name
       FROM %I.avoir av
       LEFT JOIN %I.client c ON av.nclient = c."Nclient"
       ORDER BY av.date_avoir DESC, av.id DESC
     ) a',
    p_tenant, p_tenant
  ) INTO v_result;
  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

-- Fonction: récupérer un avoir avec ses détails
CREATE OR REPLACE FUNCTION get_avoir_with_details(p_tenant TEXT, p_avoir_id INTEGER)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSON;
BEGIN
  EXECUTE format(
    'SELECT row_to_json(t) FROM (
       SELECT av.*,
         c.raison_sociale AS client_name,
         (SELECT json_agg(row_to_json(d))
          FROM (
            SELECT da.*, a.designation
            FROM %I.detail_avoir da
            LEFT JOIN %I.article a ON da.narticle = a."Narticle"
            WHERE da.avoir_id = av.id
          ) d
         ) AS details
       FROM %I.avoir av
       LEFT JOIN %I.client c ON av.nclient = c."Nclient"
       WHERE av.id = $1
     ) t',
    p_tenant, p_tenant, p_tenant, p_tenant
  ) INTO v_result USING p_avoir_id;
  RETURN v_result;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION insert_avoir TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION insert_detail_avoir TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_avoirs_by_tenant TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_avoir_with_details TO anon, authenticated, service_role;
