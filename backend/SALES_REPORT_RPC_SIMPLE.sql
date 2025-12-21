-- Fonction RPC simplifiée pour le rapport des ventes
-- Utilise les mêmes fonctions RPC que les endpoints existants

CREATE OR REPLACE FUNCTION get_sales_report_with_margin(
  p_tenant TEXT,
  p_date_from DATE,
  p_date_to DATE,
  p_type_filter TEXT DEFAULT 'ALL',
  p_client_code TEXT DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  final_result JSON;
  sql_query TEXT;
BEGIN
  -- Version simplifiée qui utilise les vraies tables de votre schéma
  sql_query := format('
    WITH combined_sales AS (
      -- Bons de livraison (utilise la même structure que vos endpoints)
      SELECT 
        ''BL'' as type,
        COALESCE(nfact, nbl) as numero,
        date_fact as date,
        nclient as client_code,
        nclient as client_name,  -- Sera enrichi côté application
        COALESCE(montant_ht, 0) as montant_ht,
        COALESCE(tva, 0) as tva,
        COALESCE(montant_ht + tva, 0) as montant_ttc,
        -- Marge simplifiée (25%% par défaut, sera calculée plus tard)
        COALESCE(montant_ht * 0.25, 0) as marge,
        25.0 as marge_percentage,
        COALESCE(created_at, NOW()) as created_at
      FROM %I.bl
      WHERE date_fact BETWEEN $2 AND $3
        AND ($4 = ''ALL'' OR $4 = ''BL'')
        AND ($5 IS NULL OR nclient ILIKE ''%%'' || $5 || ''%%'')
      
      UNION ALL
      
      -- Factures
      SELECT 
        ''FACTURE'' as type,
        nfact as numero,
        date_fact as date,
        nclient as client_code,
        nclient as client_name,  -- Sera enrichi côté application
        COALESCE(montant_ht, 0) as montant_ht,
        COALESCE(tva, 0) as tva,
        COALESCE(total_ttc, montant_ht + tva, 0) as montant_ttc,
        -- Marge simplifiée (25%% par défaut, sera calculée plus tard)
        COALESCE(montant_ht * 0.25, 0) as marge,
        25.0 as marge_percentage,
        COALESCE(created_at, NOW()) as created_at
      FROM %I.factures
      WHERE date_fact BETWEEN $2 AND $3
        AND ($4 = ''ALL'' OR $4 = ''FACTURE'')
        AND ($5 IS NULL OR nclient ILIKE ''%%'' || $5 || ''%%'')
    ),
    
    -- Calculer les totaux
    totals AS (
      SELECT 
        COUNT(CASE WHEN type = ''BL'' THEN 1 END) as count_bl,
        COUNT(CASE WHEN type = ''FACTURE'' THEN 1 END) as count_factures,
        COUNT(*) as total_count,
        COALESCE(SUM(montant_ht), 0) as total_ht,
        COALESCE(SUM(tva), 0) as total_tva,
        COALESCE(SUM(montant_ttc), 0) as total_ttc,
        COALESCE(SUM(marge), 0) as total_marge,
        CASE 
          WHEN COUNT(*) > 0 THEN COALESCE(AVG(marge_percentage), 0)
          ELSE 0 
        END as marge_percentage_avg
      FROM combined_sales
    )
    
    -- Construire le JSON de résultat
    SELECT 
      json_build_object(
        ''sales'', COALESCE((
          SELECT json_agg(
            json_build_object(
              ''type'', type,
              ''numero'', numero,
              ''date'', date,
              ''client_code'', client_code,
              ''client_name'', client_name,
              ''montant_ht'', montant_ht,
              ''tva'', tva,
              ''montant_ttc'', montant_ttc,
              ''marge'', marge,
              ''marge_percentage'', marge_percentage,
              ''created_at'', created_at
            ) ORDER BY date DESC, type, numero DESC
          )
          FROM combined_sales
        ), ''[]''::json),
        ''totals'', (
          SELECT json_build_object(
            ''count_bl'', count_bl,
            ''count_factures'', count_factures,
            ''total_count'', total_count,
            ''total_ht'', total_ht,
            ''total_tva'', total_tva,
            ''total_ttc'', total_ttc,
            ''total_marge'', total_marge,
            ''marge_percentage_avg'', marge_percentage_avg
          )
          FROM totals
        ),
        ''filters'', json_build_object(
          ''dateFrom'', $2,
          ''dateTo'', $3,
          ''type'', $4,
          ''clientCode'', $5
        )
      )',
    p_tenant, p_tenant
  );

  -- Exécuter la requête dynamique
  EXECUTE sql_query INTO final_result USING p_tenant, p_date_from, p_date_to, p_type_filter, p_client_code;

  -- Retourner le résultat ou une structure vide si pas de données
  RETURN COALESCE(final_result, '{"sales":[],"totals":{"count_bl":0,"count_factures":0,"total_count":0,"total_ht":0,"total_tva":0,"total_ttc":0,"total_marge":0,"marge_percentage_avg":0}}'::json);

EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner une structure vide avec le message d'erreur
    RETURN json_build_object(
      'sales', '[]'::json,
      'totals', json_build_object(
        'count_bl', 0,
        'count_factures', 0,
        'total_count', 0,
        'total_ht', 0,
        'total_tva', 0,
        'total_ttc', 0,
        'total_marge', 0,
        'marge_percentage_avg', 0
      ),
      'error', SQLERRM
    );
END;
$$;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION get_sales_report_with_margin(TEXT, DATE, DATE, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_report_with_margin(TEXT, DATE, DATE, TEXT, TEXT) TO anon;

-- Test rapide
-- SELECT get_sales_report_with_margin('2025_bu01', '2025-12-01', '2025-12-31', 'ALL', NULL);