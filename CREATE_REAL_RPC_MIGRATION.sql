-- =====================================================
-- MIGRATION COMPLÈTE DES FONCTIONS RPC SUPABASE → PostgreSQL/MySQL
-- =====================================================

-- PARTIE 1: FONCTIONS RPC POUR POSTGRESQL
-- =====================================================

-- 1. Fonction get_articles_by_tenant
CREATE OR REPLACE FUNCTION get_articles_by_tenant(p_tenant TEXT)
RETURNS TABLE(
  narticle VARCHAR,
  famille VARCHAR,
  designation VARCHAR,
  nfournisseur VARCHAR,
  prix_unitaire DECIMAL,
  marge DECIMAL,
  tva DECIMAL,
  prix_vente DECIMAL,
  seuil INTEGER,
  stock_f INTEGER,
  stock_bl INTEGER
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM "%s".article ORDER BY narticle', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 2. Fonction get_suppliers_by_tenant (get_fournisseurs_by_tenant)
CREATE OR REPLACE FUNCTION get_suppliers_by_tenant(p_tenant TEXT)
RETURNS TABLE(
  nfournisseur VARCHAR,
  nom_fournisseur VARCHAR,
  resp_fournisseur VARCHAR,
  adresse_fourni VARCHAR,
  tel VARCHAR,
  tel1 VARCHAR,
  tel2 VARCHAR,
  caf DECIMAL,
  cabl DECIMAL,
  email VARCHAR,
  commentaire TEXT
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM "%s".fournisseur ORDER BY nfournisseur', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Alias pour compatibilité
CREATE OR REPLACE FUNCTION get_fournisseurs_by_tenant(p_tenant TEXT)
RETURNS TABLE(
  nfournisseur VARCHAR,
  nom_fournisseur VARCHAR,
  resp_fournisseur VARCHAR,
  adresse_fourni VARCHAR,
  tel VARCHAR,
  tel1 VARCHAR,
  tel2 VARCHAR,
  caf DECIMAL,
  cabl DECIMAL,
  email VARCHAR,
  commentaire TEXT
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_suppliers_by_tenant(p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 3. Fonction get_clients_by_tenant
CREATE OR REPLACE FUNCTION get_clients_by_tenant(p_tenant TEXT)
RETURNS TABLE(
  nclient VARCHAR,
  nom_client VARCHAR,
  resp_client VARCHAR,
  adresse_client VARCHAR,
  tel VARCHAR,
  tel1 VARCHAR,
  tel2 VARCHAR,
  caf DECIMAL,
  cabl DECIMAL,
  email VARCHAR,
  commentaire TEXT
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM "%s".client ORDER BY nclient', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 4. Fonction get_bl_list_by_tenant
CREATE OR REPLACE FUNCTION get_bl_list_by_tenant(p_tenant TEXT)
RETURNS TABLE(
  nfact INTEGER,
  nclient VARCHAR,
  date_fact DATE,
  total_ht DECIMAL,
  total_ttc DECIMAL
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM "%s".bl ORDER BY nfact DESC', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Alias pour compatibilité
CREATE OR REPLACE FUNCTION get_bl_list(p_tenant TEXT)
RETURNS TABLE(
  nfact INTEGER,
  nclient VARCHAR,
  date_fact DATE,
  total_ht DECIMAL,
  total_ttc DECIMAL
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_bl_list_by_tenant(p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction get_fact_list_by_tenant
CREATE OR REPLACE FUNCTION get_fact_list_by_tenant(p_tenant TEXT)
RETURNS TABLE(
  nfact INTEGER,
  nclient VARCHAR,
  date_fact DATE,
  total_ht DECIMAL,
  total_ttc DECIMAL
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM "%s".fact ORDER BY nfact DESC', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Alias pour compatibilité
CREATE OR REPLACE FUNCTION get_fact_list(p_tenant TEXT)
RETURNS TABLE(
  nfact INTEGER,
  nclient VARCHAR,
  date_fact DATE,
  total_ht DECIMAL,
  total_ttc DECIMAL
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_fact_list_by_tenant(p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 6. Fonction get_proforma_list_by_tenant
CREATE OR REPLACE FUNCTION get_proforma_list_by_tenant(p_tenant TEXT)
RETURNS TABLE(
  nfact INTEGER,
  nclient VARCHAR,
  date_fact DATE,
  total_ht DECIMAL,
  total_ttc DECIMAL
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM "%s".proforma ORDER BY nfact DESC', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 7. Fonction insert_article_to_tenant
CREATE OR REPLACE FUNCTION insert_article_to_tenant(
  p_tenant TEXT,
  p_narticle VARCHAR,
  p_famille VARCHAR,
  p_designation VARCHAR,
  p_nfournisseur VARCHAR,
  p_prix_unitaire DECIMAL,
  p_marge DECIMAL,
  p_tva DECIMAL,
  p_prix_vente DECIMAL,
  p_seuil INTEGER,
  p_stock_f INTEGER,
  p_stock_bl INTEGER
)
RETURNS JSON
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('
    INSERT INTO "%s".article 
    (narticle, famille, designation, nfournisseur, prix_unitaire, marge, tva, prix_vente, seuil, stock_f, stock_bl)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  ', p_tenant) 
  USING p_narticle, p_famille, p_designation, p_nfournisseur, p_prix_unitaire, p_marge, p_tva, p_prix_vente, p_seuil, p_stock_f, p_stock_bl;
  
  RETURN json_build_object('success', true, 'message', 'Article inserted successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction insert_supplier_to_tenant
CREATE OR REPLACE FUNCTION insert_supplier_to_tenant(
  p_tenant TEXT,
  p_nfournisseur VARCHAR,
  p_nom_fournisseur VARCHAR,
  p_resp_fournisseur VARCHAR,
  p_adresse_fourni VARCHAR,
  p_tel VARCHAR,
  p_tel1 VARCHAR,
  p_tel2 VARCHAR,
  p_caf DECIMAL,
  p_cabl DECIMAL,
  p_email VARCHAR,
  p_commentaire TEXT
)
RETURNS JSON
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('
    INSERT INTO "%s".fournisseur 
    (nfournisseur, nom_fournisseur, resp_fournisseur, adresse_fourni, tel, tel1, tel2, caf, cabl, email, commentaire)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  ', p_tenant) 
  USING p_nfournisseur, p_nom_fournisseur, p_resp_fournisseur, p_adresse_fourni, p_tel, p_tel1, p_tel2, p_caf, p_cabl, p_email, p_commentaire;
  
  RETURN json_build_object('success', true, 'message', 'Supplier inserted successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 9. Fonction insert_client_to_tenant
CREATE OR REPLACE FUNCTION insert_client_to_tenant(
  p_tenant TEXT,
  p_nclient VARCHAR,
  p_nom_client VARCHAR,
  p_resp_client VARCHAR,
  p_adresse_client VARCHAR,
  p_tel VARCHAR,
  p_tel1 VARCHAR,
  p_tel2 VARCHAR,
  p_caf DECIMAL,
  p_cabl DECIMAL,
  p_email VARCHAR,
  p_commentaire TEXT
)
RETURNS JSON
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('
    INSERT INTO "%s".client 
    (nclient, nom_client, resp_client, adresse_client, tel, tel1, tel2, caf, cabl, email, commentaire)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  ', p_tenant) 
  USING p_nclient, p_nom_client, p_resp_client, p_adresse_client, p_tel, p_tel1, p_tel2, p_caf, p_cabl, p_email, p_commentaire;
  
  RETURN json_build_object('success', true, 'message', 'Client inserted successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 10. Fonction get_next_bl_number_by_tenant
CREATE OR REPLACE FUNCTION get_next_bl_number_by_tenant(p_tenant TEXT)
RETURNS TABLE(next_number INTEGER)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM "%s".bl', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Alias pour compatibilité
CREATE OR REPLACE FUNCTION get_next_bl_number(p_tenant TEXT)
RETURNS TABLE(next_number INTEGER)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_next_bl_number_by_tenant(p_tenant);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_next_bl_number_simple(p_tenant TEXT)
RETURNS TABLE(next_number INTEGER)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_next_bl_number_by_tenant(p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 11. Fonction get_next_fact_number_by_tenant
CREATE OR REPLACE FUNCTION get_next_fact_number_by_tenant(p_tenant TEXT)
RETURNS TABLE(next_number INTEGER)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM "%s".fact', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Alias pour compatibilité
CREATE OR REPLACE FUNCTION get_next_fact_number(p_tenant TEXT)
RETURNS TABLE(next_number INTEGER)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_next_fact_number_by_tenant(p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 12. Fonction get_next_proforma_number_by_tenant
CREATE OR REPLACE FUNCTION get_next_proforma_number_by_tenant(p_tenant TEXT)
RETURNS TABLE(next_number INTEGER)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM "%s".proforma', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTIE 2: FONCTIONS RPC POUR MYSQL (PROCÉDURES STOCKÉES)
-- =====================================================

-- Note: MySQL utilise des procédures stockées au lieu de fonctions pour retourner des résultats
-- Ces procédures doivent être créées dans chaque base de données MySQL

/*
-- Exemple pour MySQL (à exécuter dans MySQL):

DELIMITER //

-- 1. Procédure get_articles_by_tenant pour MySQL
CREATE PROCEDURE get_articles_by_tenant(IN p_tenant VARCHAR(255))
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.article ORDER BY narticle');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END //

-- 2. Procédure get_suppliers_by_tenant pour MySQL
CREATE PROCEDURE get_suppliers_by_tenant(IN p_tenant VARCHAR(255))
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.fournisseur ORDER BY nfournisseur');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END //

-- 3. Procédure get_clients_by_tenant pour MySQL
CREATE PROCEDURE get_clients_by_tenant(IN p_tenant VARCHAR(255))
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.client ORDER BY nclient');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END //

-- 4. Procédure get_bl_list_by_tenant pour MySQL
CREATE PROCEDURE get_bl_list_by_tenant(IN p_tenant VARCHAR(255))
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.bl ORDER BY nfact DESC');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END //

-- 5. Procédure get_fact_list_by_tenant pour MySQL
CREATE PROCEDURE get_fact_list_by_tenant(IN p_tenant VARCHAR(255))
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.fact ORDER BY nfact DESC');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END //

DELIMITER ;
*/

-- =====================================================
-- INSTRUCTIONS D'UTILISATION
-- =====================================================

/*
POUR POSTGRESQL:
1. Exécutez ce script dans votre base PostgreSQL locale
2. Les fonctions seront créées et disponibles immédiatement
3. Testez avec: SELECT * FROM get_articles_by_tenant('2025_bu01');

POUR MYSQL:
1. Décommentez et adaptez la section MySQL ci-dessus
2. Exécutez les procédures dans votre base MySQL locale
3. Testez avec: CALL get_articles_by_tenant('2025_bu01');

MIGRATION AUTOMATIQUE:
Ce script sera intégré dans le système de migration pour créer
automatiquement toutes les fonctions/procédures lors de la migration.
*/