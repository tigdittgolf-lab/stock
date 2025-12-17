-- =====================================================
-- FONCTIONS RPC POUR STATISTIQUES ACHATS
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Supprimer les anciennes fonctions si elles existent
DROP FUNCTION IF EXISTS get_purchase_stats_overview(text,date,date);
DROP FUNCTION IF EXISTS get_purchase_stats_by_supplier(text,date,date);
DROP FUNCTION IF EXISTS get_purchase_stats_by_article(text,date,date);
DROP FUNCTION IF EXISTS get_purchase_monthly_trends(text,integer);
DROP FUNCTION IF EXISTS get_purchase_recent_activity(text,integer);

-- 1. Vue d'ensemble des statistiques d'achats
CREATE OR REPLACE FUNCTION get_purchase_stats_overview(
  p_tenant TEXT,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
  schema_exists BOOLEAN;
  start_date DATE;
  end_date DATE;
  total_invoices_ht NUMERIC := 0;
  total_invoices_tva NUMERIC := 0;
  total_bl_ht NUMERIC := 0;
  total_bl_tva NUMERIC := 0;
  count_invoices INTEGER := 0;
  count_bl INTEGER := 0;
  count_suppliers INTEGER := 0;
  count_articles INTEGER := 0;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Schema not found'
      );
  END IF;
  
  -- Définir les dates par défaut (année courante)
  start_date := COALESCE(p_start_date, DATE_TRUNC('year', CURRENT_DATE));
  end_date := COALESCE(p_end_date, CURRENT_DATE);
  
  -- Statistiques des factures d'achat
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = p_tenant AND table_name = 'facture_achat') THEN
    EXECUTE format('
      SELECT 
        COALESCE(SUM(montant_ht), 0),
        COALESCE(SUM(tva), 0),
        COUNT(*)
      FROM %I.facture_achat 
      WHERE date_fact BETWEEN $1 AND $2
    ', p_tenant) 
    USING start_date, end_date 
    INTO total_invoices_ht, total_invoices_tva, count_invoices;
  END IF;
  
  -- Statistiques des BL d'achat
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = p_tenant AND table_name = 'bl_achat') THEN
    EXECUTE format('
      SELECT 
        COALESCE(SUM(montant_ht), 0),
        COALESCE(SUM(tva), 0),
        COUNT(*)
      FROM %I.bl_achat 
      WHERE date_bl BETWEEN $1 AND $2
    ', p_tenant) 
    USING start_date, end_date 
    INTO total_bl_ht, total_bl_tva, count_bl;
  END IF;
  
  -- Nombre de fournisseurs actifs
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = p_tenant AND table_name = 'fournisseur') THEN
    EXECUTE format('
      SELECT COUNT(DISTINCT nfournisseur)
      FROM %I.fournisseur
    ', p_tenant) 
    INTO count_suppliers;
  END IF;
  
  -- Nombre d'articles différents achetés
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = p_tenant AND table_name = 'detail_facture_achat') THEN
    EXECUTE format('
      SELECT COUNT(DISTINCT d.narticle)
      FROM %I.detail_facture_achat d
      JOIN %I.facture_achat f ON d.nfact_achat = f.nfact_achat
      WHERE f.date_fact BETWEEN $1 AND $2
    ', p_tenant, p_tenant) 
    USING start_date, end_date 
    INTO count_articles;
  END IF;
  
  -- Construire le résultat
  SELECT json_build_object(
    'success', true,
    'period', json_build_object(
      'start_date', start_date,
      'end_date', end_date
    ),
    'totals', json_build_object(
      'invoices', json_build_object(
        'count', count_invoices,
        'montant_ht', total_invoices_ht,
        'tva', total_invoices_tva,
        'ttc', total_invoices_ht + total_invoices_tva
      ),
      'delivery_notes', json_build_object(
        'count', count_bl,
        'montant_ht', total_bl_ht,
        'tva', total_bl_tva,
        'ttc', total_bl_ht + total_bl_tva
      ),
      'combined', json_build_object(
        'count', count_invoices + count_bl,
        'montant_ht', total_invoices_ht + total_bl_ht,
        'tva', total_invoices_tva + total_bl_tva,
        'ttc', (total_invoices_ht + total_bl_ht) + (total_invoices_tva + total_bl_tva)
      )
    ),
    'counts', json_build_object(
      'suppliers', count_suppliers,
      'articles_purchased', count_articles,
      'total_documents', count_invoices + count_bl
    )
  ) INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM
      );
END;
$function$;

-- 2. Statistiques par fournisseur
CREATE OR REPLACE FUNCTION get_purchase_stats_by_supplier(
  p_tenant TEXT,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
  schema_exists BOOLEAN;
  start_date DATE;
  end_date DATE;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN json_build_object('success', false, 'error', 'Schema not found');
  END IF;
  
  start_date := COALESCE(p_start_date, DATE_TRUNC('year', CURRENT_DATE));
  end_date := COALESCE(p_end_date, CURRENT_DATE);
  
  -- Combiner les données des factures et BL par fournisseur
  EXECUTE format('
    WITH supplier_stats AS (
      -- Factures d''achat
      SELECT 
        f.nfournisseur,
        COALESCE(s.nom_fournisseur, f.nfournisseur) as supplier_name,
        SUM(f.montant_ht) as total_ht,
        SUM(f.tva) as total_tva,
        COUNT(*) as count_docs,
        ''invoice'' as doc_type
      FROM %I.facture_achat f
      LEFT JOIN %I.fournisseur s ON f.nfournisseur = s.nfournisseur
      WHERE f.date_fact BETWEEN $1 AND $2
      GROUP BY f.nfournisseur, s.nom_fournisseur
      
      UNION ALL
      
      -- BL d''achat
      SELECT 
        b.nfournisseur,
        COALESCE(s.nom_fournisseur, b.nfournisseur) as supplier_name,
        SUM(b.montant_ht) as total_ht,
        SUM(b.tva) as total_tva,
        COUNT(*) as count_docs,
        ''bl'' as doc_type
      FROM %I.bl_achat b
      LEFT JOIN %I.fournisseur s ON b.nfournisseur = s.nfournisseur
      WHERE b.date_bl BETWEEN $1 AND $2
      GROUP BY b.nfournisseur, s.nom_fournisseur
    ),
    aggregated_stats AS (
      SELECT 
        nfournisseur,
        supplier_name,
        SUM(total_ht) as total_ht,
        SUM(total_tva) as total_tva,
        SUM(total_ht + total_tva) as total_ttc,
        SUM(count_docs) as total_documents,
        SUM(CASE WHEN doc_type = ''invoice'' THEN count_docs ELSE 0 END) as invoices_count,
        SUM(CASE WHEN doc_type = ''bl'' THEN count_docs ELSE 0 END) as bl_count
      FROM supplier_stats
      GROUP BY nfournisseur, supplier_name
    )
    SELECT json_agg(
      json_build_object(
        ''nfournisseur'', nfournisseur,
        ''supplier_name'', supplier_name,
        ''total_ht'', total_ht,
        ''total_tva'', total_tva,
        ''total_ttc'', total_ttc,
        ''total_documents'', total_documents,
        ''invoices_count'', invoices_count,
        ''bl_count'', bl_count,
        ''average_per_doc'', CASE WHEN total_documents > 0 THEN total_ttc / total_documents ELSE 0 END
      ) ORDER BY total_ttc DESC
    )
    FROM aggregated_stats
  ', p_tenant, p_tenant, p_tenant, p_tenant) 
  USING start_date, end_date 
  INTO result;
  
  RETURN json_build_object(
    'success', true,
    'data', COALESCE(result, '[]'::json)
  );
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 3. Statistiques par article
CREATE OR REPLACE FUNCTION get_purchase_stats_by_article(
  p_tenant TEXT,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
  schema_exists BOOLEAN;
  start_date DATE;
  end_date DATE;
BEGIN
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN json_build_object('success', false, 'error', 'Schema not found');
  END IF;
  
  start_date := COALESCE(p_start_date, DATE_TRUNC('year', CURRENT_DATE));
  end_date := COALESCE(p_end_date, CURRENT_DATE);
  
  EXECUTE format('
    WITH article_stats AS (
      -- Détails factures d''achat
      SELECT 
        d.narticle,
        COALESCE(a.designation, ''Article '' || d.narticle) as designation,
        SUM(d.qte) as total_quantity,
        SUM(d.total_ligne) as total_amount,
        COUNT(DISTINCT f.nfact_achat) as purchase_count,
        AVG(d.prix) as avg_price
      FROM %I.detail_facture_achat d
      JOIN %I.facture_achat f ON d.nfact_achat = f.nfact_achat
      LEFT JOIN %I.article a ON d.narticle = a.narticle
      WHERE f.date_fact BETWEEN $1 AND $2
      GROUP BY d.narticle, a.designation
      
      UNION ALL
      
      -- Détails BL d''achat
      SELECT 
        d.narticle,
        COALESCE(a.designation, ''Article '' || d.narticle) as designation,
        SUM(d.qte) as total_quantity,
        SUM(d.total_ligne) as total_amount,
        COUNT(DISTINCT b.nbl_achat) as purchase_count,
        AVG(d.prix) as avg_price
      FROM %I.detail_bl_achat d
      JOIN %I.bl_achat b ON d.nbl_achat = b.nbl_achat
      LEFT JOIN %I.article a ON d.narticle = a.narticle
      WHERE b.date_bl BETWEEN $1 AND $2
      GROUP BY d.narticle, a.designation
    ),
    aggregated_articles AS (
      SELECT 
        narticle,
        designation,
        SUM(total_quantity) as total_quantity,
        SUM(total_amount) as total_amount,
        SUM(purchase_count) as total_purchases,
        AVG(avg_price) as average_price
      FROM article_stats
      GROUP BY narticle, designation
    )
    SELECT json_agg(
      json_build_object(
        ''narticle'', narticle,
        ''designation'', designation,
        ''total_quantity'', total_quantity,
        ''total_amount'', total_amount,
        ''total_purchases'', total_purchases,
        ''average_price'', ROUND(average_price, 2)
      ) ORDER BY total_amount DESC
    )
    FROM aggregated_articles
  ', p_tenant, p_tenant, p_tenant, p_tenant, p_tenant, p_tenant) 
  USING start_date, end_date 
  INTO result;
  
  RETURN json_build_object(
    'success', true,
    'data', COALESCE(result, '[]'::json)
  );
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 4. Tendances mensuelles des achats
CREATE OR REPLACE FUNCTION get_purchase_monthly_trends(
  p_tenant TEXT,
  p_year INTEGER DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
  schema_exists BOOLEAN;
  target_year INTEGER;
BEGIN
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN json_build_object('success', false, 'error', 'Schema not found');
  END IF;
  
  target_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  
  EXECUTE format('
    WITH monthly_data AS (
      -- Générer tous les mois de l''année
      SELECT 
        generate_series(1, 12) as month_num,
        TO_CHAR(make_date(%s, generate_series(1, 12), 1), ''Month'') as month_name
    ),
    invoice_stats AS (
      SELECT 
        EXTRACT(MONTH FROM date_fact)::INTEGER as month_num,
        SUM(montant_ht + tva) as total_ttc,
        COUNT(*) as doc_count
      FROM %I.facture_achat
      WHERE EXTRACT(YEAR FROM date_fact) = %s
      GROUP BY EXTRACT(MONTH FROM date_fact)
    ),
    bl_stats AS (
      SELECT 
        EXTRACT(MONTH FROM date_bl)::INTEGER as month_num,
        SUM(montant_ht + tva) as total_ttc,
        COUNT(*) as doc_count
      FROM %I.bl_achat
      WHERE EXTRACT(YEAR FROM date_bl) = %s
      GROUP BY EXTRACT(MONTH FROM date_bl)
    )
    SELECT json_agg(
      json_build_object(
        ''month'', m.month_num,
        ''month_name'', TRIM(m.month_name),
        ''invoices_amount'', COALESCE(i.total_ttc, 0),
        ''invoices_count'', COALESCE(i.doc_count, 0),
        ''bl_amount'', COALESCE(b.total_ttc, 0),
        ''bl_count'', COALESCE(b.doc_count, 0),
        ''total_amount'', COALESCE(i.total_ttc, 0) + COALESCE(b.total_ttc, 0),
        ''total_count'', COALESCE(i.doc_count, 0) + COALESCE(b.doc_count, 0)
      ) ORDER BY m.month_num
    )
    FROM monthly_data m
    LEFT JOIN invoice_stats i ON m.month_num = i.month_num
    LEFT JOIN bl_stats b ON m.month_num = b.month_num
  ', target_year, p_tenant, target_year, p_tenant, target_year) 
  INTO result;
  
  RETURN json_build_object(
    'success', true,
    'year', target_year,
    'data', COALESCE(result, '[]'::json)
  );
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 5. Activité récente des achats
CREATE OR REPLACE FUNCTION get_purchase_recent_activity(
  p_tenant TEXT,
  p_limit INTEGER DEFAULT 10
) RETURNS JSON
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
  schema_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN json_build_object('success', false, 'error', 'Schema not found');
  END IF;
  
  EXECUTE format('
    (
      SELECT 
        ''invoice'' as doc_type,
        nfact_achat as doc_number,
        numero_facture_fournisseur as supplier_doc_number,
        nfournisseur,
        date_fact as doc_date,
        montant_ht + tva as total_ttc,
        created_at
      FROM %I.facture_achat
      ORDER BY created_at DESC
      LIMIT %s
    )
    UNION ALL
    (
      SELECT 
        ''bl'' as doc_type,
        nbl_achat as doc_number,
        numero_bl_fournisseur as supplier_doc_number,
        nfournisseur,
        date_bl as doc_date,
        montant_ht + tva as total_ttc,
        created_at
      FROM %I.bl_achat
      ORDER BY created_at DESC
      LIMIT %s
    )
    ORDER BY created_at DESC
    LIMIT %s
  ', p_tenant, p_limit, p_tenant, p_limit, p_limit) 
  INTO result;
  
  -- Convertir en JSON array
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''doc_type'', doc_type,
        ''doc_number'', doc_number,
        ''supplier_doc_number'', supplier_doc_number,
        ''nfournisseur'', nfournisseur,
        ''doc_date'', doc_date,
        ''total_ttc'', total_ttc,
        ''created_at'', created_at
      )
    )
    FROM (
      (
        SELECT 
          ''invoice'' as doc_type,
          nfact_achat as doc_number,
          numero_facture_fournisseur as supplier_doc_number,
          nfournisseur,
          date_fact as doc_date,
          montant_ht + tva as total_ttc,
          created_at
        FROM %I.facture_achat
        ORDER BY created_at DESC
        LIMIT %s
      )
      UNION ALL
      (
        SELECT 
          ''bl'' as doc_type,
          nbl_achat as doc_number,
          numero_bl_fournisseur as supplier_doc_number,
          nfournisseur,
          date_bl as doc_date,
          montant_ht + tva as total_ttc,
          created_at
        FROM %I.bl_achat
        ORDER BY created_at DESC
        LIMIT %s
      )
      ORDER BY created_at DESC
      LIMIT %s
    ) recent_docs
  ', p_tenant, p_limit, p_tenant, p_limit, p_limit) 
  INTO result;
  
  RETURN json_build_object(
    'success', true,
    'data', COALESCE(result, '[]'::json)
  );
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_purchase_stats_overview TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_stats_by_supplier TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_stats_by_article TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_monthly_trends TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_recent_activity TO anon, authenticated;

-- Commentaires
COMMENT ON FUNCTION get_purchase_stats_overview IS 'Vue d''ensemble des statistiques d''achats (totaux, KPI)';
COMMENT ON FUNCTION get_purchase_stats_by_supplier IS 'Statistiques détaillées par fournisseur';
COMMENT ON FUNCTION get_purchase_stats_by_article IS 'Statistiques détaillées par article acheté';
COMMENT ON FUNCTION get_purchase_monthly_trends IS 'Évolution mensuelle des achats sur une année';
COMMENT ON FUNCTION get_purchase_recent_activity IS 'Activité récente des achats (derniers documents)';

-- Tests des fonctions (optionnel)
-- SELECT get_purchase_stats_overview('2025_bu01');
-- SELECT get_purchase_stats_by_supplier('2025_bu01');
-- SELECT get_purchase_monthly_trends('2025_bu01', 2025);