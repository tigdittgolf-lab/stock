-- Fonction RPC pour le rapport des ventes - VERSION CORRECTE
-- Utilise les VRAIS noms de tables : bl, fact, client, article (SINGULIER)

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
  -- Construire la requête avec les VRAIS noms de tables
  sql_query := format('
    WITH combined_sales AS (
      -- Bons de livraison
      SELECT 
        ''BL'' as type,
        bl.nfact as numero,
        bl.date_fact as date,
        bl.nclient as client_code,
        COALESCE(c.raison_sociale, bl.nclient) as client_name,
        COALESCE(bl.montant_ht, 0) as montant_ht,
        COALESCE(bl.tva, 0) as tva,
        COALESCE(bl.montant_ht + bl.tva, 0) as montant_ttc,
        -- Calcul de la marge pour BL
        COALESCE(
          (SELECT SUM(dbl.qte * (dbl.prix - COALESCE(a.prix_unitaire, 0)))
           FROM %I.detail_bl dbl
           LEFT JOIN %I.article a ON a.narticle = dbl.narticle
           WHERE dbl.nfact = bl.nfact), 0
        ) as marge,
        -- Pourcentage de marge
        CASE 
          WHEN COALESCE(bl.montant_ht, 0) > 0 THEN
            (COALESCE(
              (SELECT SUM(dbl.qte * (dbl.prix - COALESCE(a.prix_unitaire, 0)))
               FROM %I.detail_bl dbl
               LEFT JOIN %I.article a ON a.narticle = dbl.narticle
               WHERE dbl.nfact = bl.nfact), 0
            ) / bl.montant_ht) * 100
          ELSE 0
        END as marge_percentage,
        bl.created_at
      FROM %I.bl bl
      LEFT JOIN %I.client c ON c.nclient = bl.nclient
      WHERE bl.date_fact BETWEEN $2 AND $3
        AND ($4 = ''ALL'' OR $4 = ''BL'')
        AND ($5 IS NULL OR bl.nclient ILIKE ''%%'' || $5 || ''%%'')
      
      UNION ALL
      
      -- Factures (table "fact" pas "factures")
      SELECT 
        ''FACTURE'' as type,
        f.nfact as numero,
        f.date_fact as date,
        f.nclient as client_code,
        COALESCE(c.raison_sociale, f.nclient) as client_name,
        COALESCE(f.montant_ht, 0) as montant_ht,
        COALESCE(f.tva, 0) as tva,
        COALESCE(f.montant_ht + f.tva, 0) as montant_ttc,
        -- Calcul de la marge pour factures
        COALESCE(
          (SELECT SUM(df.qte * (df.prix - COALESCE(a.prix_unitaire, 0)))
           FROM %I.detail_fact df
           LEFT JOIN %I.article a ON a.narticle = df.narticle
           WHERE df.nfact = f.nfact), 0
        ) as marge,
        -- Pourcentage de marge
        CASE 
          WHEN COALESCE(f.montant_ht, 0) > 0 THEN
            (COALESCE(
              (SELECT SUM(df.qte * (df.prix - COALESCE(a.prix_unitaire, 0)))
               FROM %I.detail_fact df
               LEFT JOIN %I.article a ON a.narticle = df.narticle
               WHERE df.nfact = f.nfact), 0
            ) / f.montant_ht) * 100
          ELSE 0
        END as marge_percentage,
        f.created_at
      FROM %I.fact f
      LEFT JOIN %I.client c ON c.nclient = f.nclient
      WHERE f.date_fact BETWEEN $2 AND $3
        AND ($4 = ''ALL'' OR $4 = ''FACTURE'')
        AND ($5 IS NULL OR f.nclient ILIKE ''%%'' || $5 || ''%%'')
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
    p_tenant, p_tenant, p_tenant, p_tenant, p_tenant, p_tenant,
    p_tenant, p_tenant, p_tenant, p_tenant, p_tenant, p_tenant
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

-- Test avec vos vraies données
-- SELECT get_sales_report_with_margin('2025_bu01', '2025-12-01', '2025-12-31', 'ALL', NULL);