-- Fix get_purchase_invoices_list function to use correct table name 'fachat'
-- The function was looking for 'facture_achat' but the actual table is 'fachat'

DROP FUNCTION IF EXISTS get_purchase_invoices_list(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION get_purchase_invoices_list(p_tenant TEXT) 
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN '[]'::json;
  END IF;
  
  -- Vérifier si la table fachat existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'fachat'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN '[]'::json;
  END IF;
  
  -- Récupérer les factures d'achat depuis la table fachat
  -- Colonnes: nfact (varchar), nfournisseur, date_fact, montant_ht, tva, timbre, autre_taxe
  EXECUTE format('
    SELECT COALESCE(json_agg(
      json_build_object(
        ''nfact_achat'', nfact,
        ''nfournisseur'', nfournisseur,
        ''numero_facture_fournisseur'', nfact,
        ''date_fact'', date_fact,
        ''montant_ht'', COALESCE(montant_ht, 0),
        ''tva'', COALESCE(tva, 0),
        ''timbre'', COALESCE(timbre, 0),
        ''autre_taxe'', COALESCE(autre_taxe, 0),
        ''total_ttc'', COALESCE(montant_ht, 0) + COALESCE(tva, 0) + COALESCE(timbre, 0) + COALESCE(autre_taxe, 0),
        ''created_at'', date_fact
      )
    ), ''[]''::json)
    FROM (
      SELECT * FROM %I.fachat ORDER BY date_fact DESC
    ) ordered_invoices
  ', p_tenant) INTO result;
  
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN '[]'::json;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_purchase_invoices_list(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_invoices_list(TEXT) TO anon;

-- Test query
SELECT get_purchase_invoices_list('2009_bu02');
