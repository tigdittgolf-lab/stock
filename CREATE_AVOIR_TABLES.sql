-- =====================================================
-- RETOUR EN STOCK — Tables avoir + detail_avoir
-- Tables dans public avec colonne tenant
-- ETAPE 1: Supprimer les anciennes tables si elles existent
-- =====================================================

DROP TABLE IF EXISTS public.detail_avoir CASCADE;
DROP TABLE IF EXISTS public.avoir CASCADE;

-- =====================================================
-- ETAPE 2: Recréer les tables avec la colonne tenant
-- =====================================================

CREATE TABLE public.avoir (
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

CREATE TABLE public.detail_avoir (
  id SERIAL PRIMARY KEY,
  avoir_id INTEGER NOT NULL REFERENCES public.avoir(id) ON DELETE CASCADE,
  narticle VARCHAR(10) NOT NULL,
  qte NUMERIC(15,2) NOT NULL,
  prix NUMERIC(15,2) NOT NULL,
  tva NUMERIC(5,2) NOT NULL DEFAULT 19,
  total_ligne NUMERIC(15,2) NOT NULL
);

-- Index
CREATE INDEX idx_avoir_tenant ON public.avoir(tenant);
CREATE INDEX idx_avoir_nclient ON public.avoir(tenant, nclient);
CREATE INDEX idx_avoir_document ON public.avoir(tenant, document_type, document_ref);
CREATE INDEX idx_detail_avoir_id ON public.detail_avoir(avoir_id);

-- =====================================================
-- ETAPE 3: Fonctions RPC
-- =====================================================

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

CREATE OR REPLACE FUNCTION public.get_avoirs_by_tenant(p_tenant TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(row_to_json(a))
  INTO v_result
  FROM (
    SELECT id, tenant, nclient, date_avoir, document_type,
           document_ref, montant_ht, tva, montant_ttc, motif, created_at
    FROM public.avoir
    WHERE tenant = p_tenant
    ORDER BY date_avoir DESC, id DESC
  ) a;
  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_avoir_with_details(p_tenant TEXT, p_avoir_id INTEGER)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT row_to_json(t)
  INTO v_result
  FROM (
    SELECT av.id, av.tenant, av.nclient, av.date_avoir, av.document_type,
           av.document_ref, av.montant_ht, av.tva, av.montant_ttc, av.motif, av.created_at,
      (
        SELECT json_agg(row_to_json(d))
        FROM (
          SELECT da.id, da.avoir_id, da.narticle, da.qte, da.prix, da.tva, da.total_ligne
          FROM public.detail_avoir da
          WHERE da.avoir_id = av.id
        ) d
      ) AS details
    FROM public.avoir av
    WHERE av.id = p_avoir_id AND av.tenant = p_tenant
  ) t;
  RETURN v_result;
END;
$$;

-- =====================================================
-- ETAPE 4: Permissions
-- =====================================================

GRANT ALL ON public.avoir TO anon, authenticated, service_role;
GRANT ALL ON public.detail_avoir TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.avoir_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.detail_avoir_id_seq TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.insert_avoir TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.insert_detail_avoir TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_avoirs_by_tenant TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_avoir_with_details TO anon, authenticated, service_role;

-- Vérification finale
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'avoir'
ORDER BY ordinal_position;
