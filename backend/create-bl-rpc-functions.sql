-- Fonctions RPC pour les bons de livraison (BL)
-- À exécuter dans Supabase SQL Editor

-- 1. Fonction pour insérer un bon de livraison
CREATE OR REPLACE FUNCTION insert_bl(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_nclient TEXT,
  p_date_fact DATE,
  p_montant_ht DECIMAL(10,2),
  p_tva DECIMAL(10,2),
  p_timbre DECIMAL(10,2) DEFAULT 0,
  p_autre_taxe DECIMAL(10,2) DEFAULT 0
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
BEGIN
  -- Construire la requête d'insertion
  sql_query := format('
    INSERT INTO "%s".bl (
      nfact, nclient, date_fact, montant_ht, tva, timbre, autre_taxe, 
      facturer, banq, ncheque, nbc, date_bc, nom_preneur, 
      created_at, updated_at
    ) VALUES (
      %s, %L, %L, %s, %s, %s, %s,
      false, '''', '''', '''', NULL, '''',
      NOW(), NOW()
    )',
    p_tenant, p_nfact, p_nclient, p_date_fact, p_montant_ht, p_tva, p_timbre, p_autre_taxe
  );
  
  -- Exécuter la requête
  EXECUTE sql_query;
  
  RETURN format('BL %s créé avec succès dans %s', p_nfact, p_tenant);
END;
$$;

-- 2. Fonction pour insérer un détail de bon de livraison
CREATE OR REPLACE FUNCTION insert_detail_bl(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_narticle TEXT,
  p_qte DECIMAL(10,2),
  p_prix DECIMAL(10,2),
  p_tva DECIMAL(5,2),
  p_total_ligne DECIMAL(10,2)
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
BEGIN
  -- Construire la requête d'insertion
  sql_query := format('
    INSERT INTO "%s".detail_bl (
      nfact, narticle, qte, prix, tva, total_ligne, facturer
    ) VALUES (
      %s, %L, %s, %s, %s, %s, false
    )',
    p_tenant, p_nfact, p_narticle, p_qte, p_prix, p_tva, p_total_ligne
  );
  
  -- Exécuter la requête
  EXECUTE sql_query;
  
  RETURN format('Détail BL ajouté: Article %s, Qté %s', p_narticle, p_qte);
END;
$$;

-- 3. Fonction pour obtenir le prochain numéro de BL
CREATE OR REPLACE FUNCTION get_next_bl_number(p_tenant TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
  max_number INTEGER;
BEGIN
  -- Construire la requête pour obtenir le max
  sql_query := format('SELECT COALESCE(MAX(nfact), 0) + 1 FROM "%s".bl', p_tenant);
  
  -- Exécuter la requête
  EXECUTE sql_query INTO max_number;
  
  RETURN max_number;
END;
$$;

-- 4. Fonction pour obtenir la liste des BL
CREATE OR REPLACE FUNCTION get_bl_list(p_tenant TEXT)
RETURNS TABLE(
  nfact INTEGER,
  nclient TEXT,
  date_fact DATE,
  montant_ht DECIMAL(10,2),
  tva DECIMAL(10,2),
  timbre DECIMAL(10,2),
  autre_taxe DECIMAL(10,2),
  facturer BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
BEGIN
  -- Construire la requête de sélection
  sql_query := format('
    SELECT nfact, nclient, date_fact, montant_ht, tva, timbre, autre_taxe, 
           facturer, created_at, updated_at
    FROM "%s".bl 
    ORDER BY nfact DESC',
    p_tenant
  );
  
  -- Retourner les résultats
  RETURN QUERY EXECUTE sql_query;
END;
$$;

-- 5. Fonction pour obtenir un BL par ID
CREATE OR REPLACE FUNCTION get_bl_by_id(p_tenant TEXT, p_nfact INTEGER)
RETURNS TABLE(
  nfact INTEGER,
  nclient TEXT,
  date_fact DATE,
  montant_ht DECIMAL(10,2),
  tva DECIMAL(10,2),
  timbre DECIMAL(10,2),
  autre_taxe DECIMAL(10,2),
  facturer BOOLEAN,
  banq TEXT,
  ncheque TEXT,
  nbc TEXT,
  date_bc DATE,
  nom_preneur TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
BEGIN
  -- Construire la requête de sélection
  sql_query := format('
    SELECT nfact, nclient, date_fact, montant_ht, tva, timbre, autre_taxe, 
           facturer, banq, ncheque, nbc, date_bc, nom_preneur, created_at, updated_at
    FROM "%s".bl 
    WHERE nfact = %s',
    p_tenant, p_nfact
  );
  
  -- Retourner les résultats
  RETURN QUERY EXECUTE sql_query;
END;
$$;

-- 6. Fonction pour obtenir les détails d'un BL
CREATE OR REPLACE FUNCTION get_bl_details(p_tenant TEXT, p_nfact INTEGER)
RETURNS TABLE(
  id INTEGER,
  nfact INTEGER,
  narticle TEXT,
  qte DECIMAL(10,2),
  prix DECIMAL(10,2),
  tva DECIMAL(5,2),
  total_ligne DECIMAL(10,2),
  facturer BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
BEGIN
  -- Construire la requête de sélection
  sql_query := format('
    SELECT id, nfact, narticle, qte, prix, tva, total_ligne, facturer
    FROM "%s".detail_bl 
    WHERE nfact = %s
    ORDER BY id',
    p_tenant, p_nfact
  );
  
  -- Retourner les résultats
  RETURN QUERY EXECUTE sql_query;
END;
$$;

-- 7. Fonction pour mettre à jour le stock BL
CREATE OR REPLACE FUNCTION update_stock_bl(
  p_tenant TEXT,
  p_narticle TEXT,
  p_quantity DECIMAL(10,2)
)
RETURNS TABLE(
  narticle TEXT,
  stock_bl DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
  new_stock DECIMAL(10,2);
BEGIN
  -- Mettre à jour le stock BL (déduction)
  sql_query := format('
    UPDATE "%s".articles 
    SET stock_bl = stock_bl - %s,
        updated_at = NOW()
    WHERE narticle = %L
    RETURNING stock_bl',
    p_tenant, p_quantity, p_narticle
  );
  
  -- Exécuter la requête et récupérer le nouveau stock
  EXECUTE sql_query INTO new_stock;
  
  -- Retourner le résultat
  RETURN QUERY SELECT p_narticle, new_stock;
END;
$$;

-- 8. Fonction pour obtenir le stock d'un article
CREATE OR REPLACE FUNCTION get_article_stock(
  p_tenant TEXT,
  p_narticle TEXT
)
RETURNS TABLE(
  narticle TEXT,
  stock_f DECIMAL(10,2),
  stock_bl DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
BEGIN
  -- Construire la requête de sélection
  sql_query := format('
    SELECT narticle, stock_f, stock_bl
    FROM "%s".articles 
    WHERE narticle = %L',
    p_tenant, p_narticle
  );
  
  -- Retourner les résultats
  RETURN QUERY EXECUTE sql_query;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION insert_bl TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_detail_bl TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_next_bl_number TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_bl_list TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_bl_by_id TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_bl_details TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_stock_bl TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_article_stock TO anon, authenticated;

-- Commentaires
COMMENT ON FUNCTION insert_bl IS 'Insère un nouveau bon de livraison dans le schéma tenant';
COMMENT ON FUNCTION insert_detail_bl IS 'Insère un détail de bon de livraison';
COMMENT ON FUNCTION get_next_bl_number IS 'Obtient le prochain numéro de BL séquentiel';
COMMENT ON FUNCTION get_bl_list IS 'Obtient la liste de tous les bons de livraison';
COMMENT ON FUNCTION get_bl_by_id IS 'Obtient un bon de livraison par son ID';
COMMENT ON FUNCTION get_bl_details IS 'Obtient les détails d'un bon de livraison';
COMMENT ON FUNCTION update_stock_bl IS 'Met à jour le stock BL après création d''un bon de livraison';
COMMENT ON FUNCTION get_article_stock IS 'Obtient le stock actuel d''un article';