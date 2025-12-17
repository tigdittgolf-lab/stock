-- =====================================================
-- FONCTIONS RPC POUR GESTION DU STOCK
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Supprimer les anciennes fonctions si elles existent
DROP FUNCTION IF EXISTS get_stock_overview(text);
DROP FUNCTION IF EXISTS get_stock_by_article(text,text);
DROP FUNCTION IF EXISTS get_stock_movements(text,text,date,date);
DROP FUNCTION IF EXISTS get_stock_alerts(text);
DROP FUNCTION IF EXISTS get_stock_valuation(text);
DROP FUNCTION IF EXISTS insert_stock_adjustment(text,text,numeric,numeric,text,text);
DROP FUNCTION IF EXISTS get_stock_rotation_analysis(text,date,date);

-- 1. Vue d'ensemble du stock
CREATE OR REPLACE FUNCTION get_stock_overview(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
  schema_exists BOOLEAN;
  total_articles INTEGER := 0;
  articles_in_stock INTEGER := 0;
  articles_low_stock INTEGER := 0;
  articles_zero_stock INTEGER := 0;
  total_stock_bl NUMERIC := 0;
  total_stock_f NUMERIC := 0;
  total_stock_value NUMERIC := 0;
  value_bl_cost NUMERIC := 0;
  value_f_cost NUMERIC := 0;
  value_bl_sale NUMERIC := 0;
  value_f_sale NUMERIC := 0;
  total_cost_value NUMERIC := 0;
  total_sale_value NUMERIC := 0;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN json_build_object('success', false, 'error', 'Schema not found');
  END IF;
  
  -- Vérifier si la table article existe
  IF NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = p_tenant AND table_name = 'article') THEN
      RETURN json_build_object('success', false, 'error', 'Article table not found');
  END IF;
  
  -- Calculer les statistiques globales
  EXECUTE format('
    SELECT 
      COUNT(*) as total_articles,
      COUNT(CASE WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) > 0 THEN 1 END) as articles_in_stock,
      COUNT(CASE WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) <= COALESCE(seuil, 10) 
                  AND (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) > 0 THEN 1 END) as articles_low_stock,
      COUNT(CASE WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) = 0 THEN 1 END) as articles_zero_stock,
      SUM(COALESCE(stock_bl, 0)) as total_stock_bl,
      SUM(COALESCE(stock_f, 0)) as total_stock_f,
      SUM((COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) * COALESCE(prix_unitaire, 0)) as total_stock_value
    FROM %I.article
  ', p_tenant) 
  INTO total_articles, articles_in_stock, articles_low_stock, articles_zero_stock, 
       total_stock_bl, total_stock_f, total_stock_value;
  
  -- Calculer la valorisation détaillée par type de stock et prix
  EXECUTE format('
    SELECT 
      SUM(COALESCE(stock_bl, 0) * COALESCE(prix_unitaire, 0)) as value_bl_cost,
      SUM(COALESCE(stock_f, 0) * COALESCE(prix_unitaire, 0)) as value_f_cost,
      SUM(COALESCE(stock_bl, 0) * COALESCE(prix_vente, 0)) as value_bl_sale,
      SUM(COALESCE(stock_f, 0) * COALESCE(prix_vente, 0)) as value_f_sale,
      SUM((COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) * COALESCE(prix_unitaire, 0)) as total_cost_value,
      SUM((COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) * COALESCE(prix_vente, 0)) as total_sale_value
    FROM %I.article
  ', p_tenant) 
  INTO value_bl_cost, value_f_cost, value_bl_sale, value_f_sale, total_cost_value, total_sale_value;

  -- Construire le résultat avec valorisation détaillée
  SELECT json_build_object(
    'success', true,
    'overview', json_build_object(
      'total_articles', total_articles,
      'articles_in_stock', articles_in_stock,
      'articles_low_stock', articles_low_stock,
      'articles_zero_stock', articles_zero_stock,
      'stock_health_percentage', CASE WHEN total_articles > 0 THEN 
        ROUND((articles_in_stock::NUMERIC / total_articles::NUMERIC) * 100, 2) ELSE 0 END
    ),
    'stock_quantities', json_build_object(
      'total_stock_bl', total_stock_bl,
      'total_stock_f', total_stock_f,
      'total_combined', total_stock_bl + total_stock_f
    ),
    'stock_value', json_build_object(
      'total_cost_value', total_cost_value,
      'total_sale_value', total_sale_value,
      'potential_margin', total_sale_value - total_cost_value,
      'margin_percentage', CASE WHEN total_cost_value > 0 THEN 
        ROUND(((total_sale_value - total_cost_value) / total_cost_value) * 100, 2) ELSE 0 END,
      'average_cost_per_article', CASE WHEN total_articles > 0 THEN 
        ROUND(total_cost_value / total_articles, 2) ELSE 0 END,
      'average_sale_per_article', CASE WHEN total_articles > 0 THEN 
        ROUND(total_sale_value / total_articles, 2) ELSE 0 END
    ),
    'stock_value_by_type', json_build_object(
      'bl_cost_value', value_bl_cost,
      'bl_sale_value', value_bl_sale,
      'bl_margin', value_bl_sale - value_bl_cost,
      'bl_margin_percentage', CASE WHEN value_bl_cost > 0 THEN 
        ROUND(((value_bl_sale - value_bl_cost) / value_bl_cost) * 100, 2) ELSE 0 END,
      'f_cost_value', value_f_cost,
      'f_sale_value', value_f_sale,
      'f_margin', value_f_sale - value_f_cost,
      'f_margin_percentage', CASE WHEN value_f_cost > 0 THEN 
        ROUND(((value_f_sale - value_f_cost) / value_f_cost) * 100, 2) ELSE 0 END
    )
  ) INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 2. Détails stock par article
CREATE OR REPLACE FUNCTION get_stock_by_article(
  p_tenant TEXT,
  p_narticle TEXT DEFAULT NULL
)
RETURNS JSON
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
  
  IF p_narticle IS NOT NULL THEN
    -- Détails pour un article spécifique
    EXECUTE format('
      SELECT json_build_object(
        ''narticle'', narticle,
        ''designation'', designation,
        ''famille'', famille,
        ''nfournisseur'', nfournisseur,
        ''prix_unitaire'', prix_unitaire,
        ''prix_vente'', prix_vente,
        ''seuil'', seuil,
        ''stock_bl'', COALESCE(stock_bl, 0),
        ''stock_f'', COALESCE(stock_f, 0),
        ''stock_total'', COALESCE(stock_bl, 0) + COALESCE(stock_f, 0),
        ''stock_value'', (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) * COALESCE(prix_unitaire, 0),
        ''stock_status'', CASE 
          WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) = 0 THEN ''zero''
          WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) <= COALESCE(seuil, 10) THEN ''low''
          ELSE ''normal''
        END,
        ''rotation_indicator'', CASE 
          WHEN COALESCE(seuil, 10) > 0 THEN 
            ROUND((COALESCE(stock_bl, 0) + COALESCE(stock_f, 0))::NUMERIC / COALESCE(seuil, 10)::NUMERIC, 2)
          ELSE 0 
        END
      )
      FROM %I.article 
      WHERE narticle = $1
    ', p_tenant) 
    USING p_narticle INTO result;
  ELSE
    -- Liste de tous les articles avec leur stock
    EXECUTE format('
      SELECT json_agg(
        json_build_object(
          ''narticle'', narticle,
          ''designation'', designation,
          ''famille'', famille,
          ''nfournisseur'', nfournisseur,
          ''prix_unitaire'', prix_unitaire,
          ''seuil'', seuil,
          ''stock_bl'', COALESCE(stock_bl, 0),
          ''stock_f'', COALESCE(stock_f, 0),
          ''stock_total'', COALESCE(stock_bl, 0) + COALESCE(stock_f, 0),
          ''stock_value'', (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) * COALESCE(prix_unitaire, 0),
          ''stock_status'', CASE 
            WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) = 0 THEN ''zero''
            WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) <= COALESCE(seuil, 10) THEN ''low''
            ELSE ''normal''
          END
        ) ORDER BY 
          CASE 
            WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) = 0 THEN 1
            WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) <= COALESCE(seuil, 10) THEN 2
            ELSE 3
          END,
          designation
      )
      FROM %I.article
    ', p_tenant) INTO result;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'data', COALESCE(result, '[]'::json)
  );
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 3. Alertes stock
CREATE OR REPLACE FUNCTION get_stock_alerts(p_tenant TEXT)
RETURNS JSON
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
    WITH stock_alerts AS (
      SELECT 
        narticle,
        designation,
        famille,
        nfournisseur,
        COALESCE(stock_bl, 0) + COALESCE(stock_f, 0) as stock_total,
        COALESCE(seuil, 10) as seuil,
        CASE 
          WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) = 0 THEN ''rupture''
          WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) <= COALESCE(seuil, 10) THEN ''faible''
          WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) > (COALESCE(seuil, 10) * 5) THEN ''surstock''
          ELSE ''normal''
        END as alert_type,
        CASE 
          WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) = 0 THEN 1
          WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) <= COALESCE(seuil, 10) THEN 2
          WHEN (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) > (COALESCE(seuil, 10) * 5) THEN 3
          ELSE 4
        END as priority
      FROM %I.article
      WHERE (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) = 0
         OR (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) <= COALESCE(seuil, 10)
         OR (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) > (COALESCE(seuil, 10) * 5)
    )
    SELECT json_build_object(
      ''rupture'', (SELECT json_agg(json_build_object(
        ''narticle'', narticle,
        ''designation'', designation,
        ''famille'', famille,
        ''nfournisseur'', nfournisseur,
        ''stock_total'', stock_total,
        ''seuil'', seuil
      )) FROM stock_alerts WHERE alert_type = ''rupture''),
      ''faible'', (SELECT json_agg(json_build_object(
        ''narticle'', narticle,
        ''designation'', designation,
        ''famille'', famille,
        ''nfournisseur'', nfournisseur,
        ''stock_total'', stock_total,
        ''seuil'', seuil
      )) FROM stock_alerts WHERE alert_type = ''faible''),
      ''surstock'', (SELECT json_agg(json_build_object(
        ''narticle'', narticle,
        ''designation'', designation,
        ''famille'', famille,
        ''nfournisseur'', nfournisseur,
        ''stock_total'', stock_total,
        ''seuil'', seuil
      )) FROM stock_alerts WHERE alert_type = ''surstock''),
      ''counts'', json_build_object(
        ''rupture'', (SELECT COUNT(*) FROM stock_alerts WHERE alert_type = ''rupture''),
        ''faible'', (SELECT COUNT(*) FROM stock_alerts WHERE alert_type = ''faible''),
        ''surstock'', (SELECT COUNT(*) FROM stock_alerts WHERE alert_type = ''surstock'')
      )
    )
  ', p_tenant) INTO result;
  
  RETURN json_build_object(
    'success', true,
    'data', COALESCE(result, json_build_object('rupture', '[]', 'faible', '[]', 'surstock', '[]', 'counts', json_build_object('rupture', 0, 'faible', 0, 'surstock', 0)))
  );
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 4. Valorisation du stock
CREATE OR REPLACE FUNCTION get_stock_valuation(p_tenant TEXT)
RETURNS JSON
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
    WITH stock_valuation AS (
      SELECT 
        famille,
        COUNT(*) as nb_articles,
        SUM(COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) as total_quantity,
        SUM((COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) * COALESCE(prix_unitaire, 0)) as total_value_cost,
        SUM((COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) * COALESCE(prix_vente, 0)) as total_value_sale,
        AVG(COALESCE(prix_unitaire, 0)) as avg_cost_price,
        AVG(COALESCE(prix_vente, 0)) as avg_sale_price
      FROM %I.article
      WHERE (COALESCE(stock_bl, 0) + COALESCE(stock_f, 0)) > 0
      GROUP BY famille
    ),
    global_stats AS (
      SELECT 
        SUM(total_quantity) as grand_total_quantity,
        SUM(total_value_cost) as grand_total_value_cost,
        SUM(total_value_sale) as grand_total_value_sale,
        COUNT(*) as nb_families
      FROM stock_valuation
    )
    SELECT json_build_object(
      ''by_family'', (
        SELECT json_agg(
          json_build_object(
            ''famille'', COALESCE(famille, ''Non classé''),
            ''nb_articles'', nb_articles,
            ''total_quantity'', total_quantity,
            ''total_value_cost'', total_value_cost,
            ''total_value_sale'', total_value_sale,
            ''avg_cost_price'', ROUND(avg_cost_price, 2),
            ''avg_sale_price'', ROUND(avg_sale_price, 2),
            ''potential_margin'', total_value_sale - total_value_cost,
            ''margin_percentage'', CASE WHEN total_value_cost > 0 THEN 
              ROUND(((total_value_sale - total_value_cost) / total_value_cost) * 100, 2) ELSE 0 END
          ) ORDER BY total_value_cost DESC
        )
        FROM stock_valuation
      ),
      ''global'', (
        SELECT json_build_object(
          ''total_quantity'', grand_total_quantity,
          ''total_value_cost'', grand_total_value_cost,
          ''total_value_sale'', grand_total_value_sale,
          ''potential_margin'', grand_total_value_sale - grand_total_value_cost,
          ''margin_percentage'', CASE WHEN grand_total_value_cost > 0 THEN 
            ROUND(((grand_total_value_sale - grand_total_value_cost) / grand_total_value_cost) * 100, 2) ELSE 0 END,
          ''nb_families'', nb_families
        )
        FROM global_stats
      )
    )
  ', p_tenant) INTO result;
  
  RETURN json_build_object(
    'success', true,
    'data', COALESCE(result, json_build_object('by_family', '[]', 'global', json_build_object()))
  );
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 5. Ajustement de stock
CREATE OR REPLACE FUNCTION insert_stock_adjustment(
  p_tenant TEXT,
  p_narticle TEXT,
  p_new_stock_bl NUMERIC,
  p_new_stock_f NUMERIC,
  p_reason TEXT,
  p_user_id TEXT DEFAULT 'system'
)
RETURNS JSON
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  old_stock_bl NUMERIC;
  old_stock_f NUMERIC;
  schema_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN json_build_object('success', false, 'error', 'Schema not found');
  END IF;
  
  -- Récupérer les anciens stocks
  EXECUTE format('
    SELECT COALESCE(stock_bl, 0), COALESCE(stock_f, 0)
    FROM %I.article 
    WHERE narticle = $1
  ', p_tenant) 
  USING p_narticle INTO old_stock_bl, old_stock_f;
  
  IF old_stock_bl IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Article not found');
  END IF;
  
  -- Mettre à jour les stocks
  EXECUTE format('
    UPDATE %I.article 
    SET stock_bl = $1, stock_f = $2
    WHERE narticle = $3
  ', p_tenant) 
  USING p_new_stock_bl, p_new_stock_f, p_narticle;
  
  -- Créer la table d'historique des ajustements si elle n'existe pas
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.stock_adjustments (
      id SERIAL PRIMARY KEY,
      narticle VARCHAR(20),
      old_stock_bl NUMERIC,
      old_stock_f NUMERIC,
      new_stock_bl NUMERIC,
      new_stock_f NUMERIC,
      reason TEXT,
      user_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  ', p_tenant);
  
  -- Enregistrer l'ajustement
  EXECUTE format('
    INSERT INTO %I.stock_adjustments 
    (narticle, old_stock_bl, old_stock_f, new_stock_bl, new_stock_f, reason, user_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  ', p_tenant) 
  USING p_narticle, old_stock_bl, old_stock_f, p_new_stock_bl, p_new_stock_f, p_reason, p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Stock ajusté avec succès',
    'adjustment', json_build_object(
      'narticle', p_narticle,
      'old_stock_bl', old_stock_bl,
      'old_stock_f', old_stock_f,
      'new_stock_bl', p_new_stock_bl,
      'new_stock_f', p_new_stock_f,
      'difference_bl', p_new_stock_bl - old_stock_bl,
      'difference_f', p_new_stock_f - old_stock_f
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_stock_overview TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_stock_by_article TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_stock_alerts TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_stock_valuation TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_stock_adjustment TO anon, authenticated;

-- Commentaires
COMMENT ON FUNCTION get_stock_overview IS 'Vue d''ensemble complète du stock (quantités, valeurs, alertes)';
COMMENT ON FUNCTION get_stock_by_article IS 'Détails du stock par article ou liste complète';
COMMENT ON FUNCTION get_stock_alerts IS 'Alertes de stock (rupture, faible, surstock)';
COMMENT ON FUNCTION get_stock_valuation IS 'Valorisation du stock par famille et globale';
COMMENT ON FUNCTION insert_stock_adjustment IS 'Ajustement manuel des stocks avec historique';

-- Tests des fonctions (optionnel)
-- SELECT get_stock_overview('2025_bu01');
-- SELECT get_stock_alerts('2025_bu01');
-- SELECT get_stock_valuation('2025_bu01');