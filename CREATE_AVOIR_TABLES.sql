-- =====================================================
-- RETOUR EN STOCK — Tables avoir + detail_avoir
-- Tables dans public avec colonne tenant
-- A exécuter UNE SEULE FOIS dans Supabase SQL Editor
-- =====================================================

-- 1. Table avoir
CREATE TABLE IF NOT EXISTS public.avoir (
  id SERIAL PRIMARY KEY,
  tenant TEXT NOT NULL,
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

-- 2. Table detail_avoir
CREATE TABLE IF NOT EXISTS public.detail_avoir (
  id SERIAL PRIMARY KEY,
  avoir_id INTEGER NOT NULL REFERENCES public.avoir(id) ON DELETE CASCADE,
  narticle VARCHAR(10) NOT NULL,
  qte NUMERIC(15,2) NOT NULL,
  prix NUMERIC(15,2) NOT NULL,
  tva NUMERIC(5,2) NOT NULL DEFAULT 19,
  total_ligne NUMERIC(15,2) NOT NULL
);

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_avoir_tenant ON public.avoir(tenant);
CREATE INDEX IF NOT EXISTS idx_avoir_nclient ON public.avoir(tenant, nclient);
CREATE INDEX IF NOT EXISTS idx_avoir_document ON public.avoir(tenant, document_type, document_ref);
CREATE INDEX IF NOT EXISTS idx_detail_avoir_id ON public.detail_avoir(avoir_id);

-- 4. Fonction: insérer un avoir
CREATE OR REPLACE FUNCTION public.insert_avoir(
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
  INSERT INTO public.avoir (tenant, nclient, date_avoir, document_type, document_ref, montant_ht, tva, montant_ttc, motif)
  VALUES (p_tenant, p_nclient, p_date_avoir, p_document_type, p_document_ref, p_montant_ht, p_tva, p_montant_ttc, p_motif)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 5. Fonction: insérer un détail avoir
CREATE OR REPLACE FUNCTION public.insert_detail_avoir(
  p_tenant TEXT,
  p_avoir_id INTEGER,
  p_narticle TEXT,
  p_qte NUMERIC,
  p_prix NUMERIC,
  p_tva NUMERIC,
  p_total_ligne NUMERIC
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.detail_avoir (avoir_id, narticle, qte, prix, tva, total_ligne)
  VALUES (p_avoir_id, p_narticle, p_qte, p_prix, p_tva, p_total_ligne);
END;
$$;

-- 6. Fonction: lister les avoirs d'un tenant
CREATE OR REPLACE FUNCTION public.get_avoirs_by_tenant(p_tenant TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSON;
BEGIN
  EXECUTE format(
    'SELECT json_agg(row_to_json(a)) FROM (
       SELECT av.*, c.raison_sociale AS client_name
       FROM public.avoir av
       LEFT JOIN %I.client c ON av.nclient = c."Nclient"
       WHERE av.tenant = $1
       ORDER BY av.date_avoir DESC, av.id DESC
     ) a',
    p_tenant
  ) INTO v_result USING p_tenant;
  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

-- 7. Fonction: récupérer un avoir avec ses détails
CREATE OR REPLACE FUNCTION public.get_avoir_with_details(p_tenant TEXT, p_avoir_id INTEGER)
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
            FROM public.detail_avoir da
            LEFT JOIN %I.article a ON da.narticle = a."Narticle"
            WHERE da.avoir_id = av.id
          ) d
         ) AS details
       FROM public.avoir av
       LEFT JOIN %I.client c ON av.nclient = c."Nclient"
       WHERE av.id = $1 AND av.tenant = $2
     ) t',
    p_tenant, p_tenant
  ) INTO v_result USING p_avoir_id, p_tenant;
  RETURN v_result;
END;
$$;

-- 8. Permissions
GRANT ALL ON public.avoir TO anon, authenticated, service_role;
GRANT ALL ON public.detail_avoir TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.avoir_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.detail_avoir_id_seq TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.insert_avoir TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.insert_detail_avoir TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_avoirs_by_tenant TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_avoir_with_details TO anon, authenticated, service_role;

-- Vérification
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_name IN ('avoir', 'detail_avoir')
AND table_schema = 'public';
