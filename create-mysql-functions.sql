-- =====================================================
-- FONCTIONS MYSQL ÉQUIVALENTES (STORED PROCEDURES)
-- Compatible avec MySQL 5.7+
-- =====================================================

DELIMITER $$

-- =====================================================
-- 1. PROCÉDURES DE LECTURE (GET)
-- =====================================================

-- Procédure pour récupérer les articles par tenant
DROP PROCEDURE IF EXISTS get_articles_by_tenant$$
CREATE PROCEDURE get_articles_by_tenant(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.article ORDER BY narticle');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- Procédure pour récupérer les clients par tenant
DROP PROCEDURE IF EXISTS get_clients_by_tenant$$
CREATE PROCEDURE get_clients_by_tenant(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.client ORDER BY nclient');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- Procédure pour récupérer les fournisseurs par tenant
DROP PROCEDURE IF EXISTS get_fournisseurs_by_tenant$$
CREATE PROCEDURE get_fournisseurs_by_tenant(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.fournisseur ORDER BY nfournisseur');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- Procédure pour récupérer les familles d'articles par tenant
DROP PROCEDURE IF EXISTS get_families_by_tenant$$
CREATE PROCEDURE get_families_by_tenant(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('SELECT famille FROM `', p_tenant, '`.famille_art ORDER BY famille');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- Procédure pour récupérer l'activité par tenant
DROP PROCEDURE IF EXISTS get_activites_by_tenant$$
CREATE PROCEDURE get_activites_by_tenant(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.activite ORDER BY id');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- Procédure pour récupérer les bons de livraison par tenant
DROP PROCEDURE IF EXISTS get_bls_by_tenant$$
CREATE PROCEDURE get_bls_by_tenant(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.bl ORDER BY nfact');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- Procédure pour récupérer les factures par tenant
DROP PROCEDURE IF EXISTS get_factures_by_tenant$$
CREATE PROCEDURE get_factures_by_tenant(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.facture ORDER BY nfact');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- Procédure pour récupérer les proformas par tenant
DROP PROCEDURE IF EXISTS get_proformas_by_tenant$$
CREATE PROCEDURE get_proformas_by_tenant(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.proforma ORDER BY nfact');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- Procédure pour récupérer les détails BL par tenant
DROP PROCEDURE IF EXISTS get_detail_bl_by_tenant$$
CREATE PROCEDURE get_detail_bl_by_tenant(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.detail_bl ORDER BY id');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- Procédure pour récupérer les détails factures par tenant
DROP PROCEDURE IF EXISTS get_detail_fact_by_tenant$$
CREATE PROCEDURE get_detail_fact_by_tenant(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.detail_fact ORDER BY id');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- Procédure pour récupérer les détails proforma par tenant
DROP PROCEDURE IF EXISTS get_detail_proforma_by_tenant$$
CREATE PROCEDURE get_detail_proforma_by_tenant(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('SELECT * FROM `', p_tenant, '`.detail_proforma ORDER BY id');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- =====================================================
-- 2. FONCTIONS MÉTIER
-- =====================================================

-- Fonction pour calculer la marge
DROP FUNCTION IF EXISTS calculate_margin$$
CREATE FUNCTION calculate_margin(p_prix_achat DECIMAL(10,2), p_prix_vente DECIMAL(10,2))
RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
SQL SECURITY DEFINER
BEGIN
  IF p_prix_achat = 0 OR p_prix_achat IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(((p_prix_vente - p_prix_achat) / p_prix_achat) * 100, 2);
END$$

-- Fonction pour obtenir le prochain numéro de document
DROP FUNCTION IF EXISTS get_next_number$$
CREATE FUNCTION get_next_number(p_tenant VARCHAR(50), p_document_type VARCHAR(20))
RETURNS INT
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE next_num INT DEFAULT 1;
  
  CASE p_document_type
    WHEN 'bl' THEN
      SET @sql = CONCAT('SELECT COALESCE(MAX(nfact), 0) + 1 FROM `', p_tenant, '`.bl');
    WHEN 'facture' THEN
      SET @sql = CONCAT('SELECT COALESCE(MAX(nfact), 0) + 1 FROM `', p_tenant, '`.facture');
    WHEN 'proforma' THEN
      SET @sql = CONCAT('SELECT COALESCE(MAX(nfact), 0) + 1 FROM `', p_tenant, '`.proforma');
    ELSE
      SET next_num = 1;
  END CASE;
  
  IF @sql IS NOT NULL THEN
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
  
  RETURN next_num;
END$$

-- Procédure pour mettre à jour le stock
DROP PROCEDURE IF EXISTS update_stock$$
CREATE PROCEDURE update_stock(
  IN p_tenant VARCHAR(50),
  IN p_narticle VARCHAR(50),
  IN p_qte INT,
  IN p_operation VARCHAR(10)
)
MODIFIES SQL DATA
SQL SECURITY DEFINER
BEGIN
  IF p_operation = 'add' THEN
    SET @sql = CONCAT('UPDATE `', p_tenant, '`.article SET stock_f = stock_f + ', p_qte, ' WHERE narticle = ''', p_narticle, '''');
  ELSEIF p_operation = 'subtract' THEN
    SET @sql = CONCAT('UPDATE `', p_tenant, '`.article SET stock_f = stock_f - ', p_qte, ' WHERE narticle = ''', p_narticle, '''');
  END IF;
  
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- =====================================================
-- 3. PROCÉDURES DE RAPPORT
-- =====================================================

-- Procédure pour rapport des ventes
DROP PROCEDURE IF EXISTS get_sales_report$$
CREATE PROCEDURE get_sales_report(
  IN p_tenant VARCHAR(50),
  IN p_date_debut DATE,
  IN p_date_fin DATE
)
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('
    SELECT ''BL'' as document_type, bl.nfact, bl.nclient, c.raison_sociale, 
           bl.date_fact, bl.montant_ht, bl.tva, bl.montant_ttc, bl.marge
    FROM `', p_tenant, '`.bl bl
    LEFT JOIN `', p_tenant, '`.client c ON bl.nclient = c.nclient
    WHERE (''', IFNULL(p_date_debut, '1900-01-01'), ''' = ''1900-01-01'' OR bl.date_fact >= ''', IFNULL(p_date_debut, '1900-01-01'), ''') 
      AND (''', IFNULL(p_date_fin, '2100-12-31'), ''' = ''2100-12-31'' OR bl.date_fact <= ''', IFNULL(p_date_fin, '2100-12-31'), ''')
    
    UNION ALL
    
    SELECT ''FACTURE'' as document_type, f.nfact, f.nclient, c.raison_sociale,
           f.date_fact, f.montant_ht, f.tva, f.montant_ttc, 0.00 as marge
    FROM `', p_tenant, '`.facture f
    LEFT JOIN `', p_tenant, '`.client c ON f.nclient = c.nclient
    WHERE (''', IFNULL(p_date_debut, '1900-01-01'), ''' = ''1900-01-01'' OR f.date_fact >= ''', IFNULL(p_date_debut, '1900-01-01'), ''') 
      AND (''', IFNULL(p_date_fin, '2100-12-31'), ''' = ''2100-12-31'' OR f.date_fact <= ''', IFNULL(p_date_fin, '2100-12-31'), ''')
    
    ORDER BY date_fact DESC, nfact DESC
  ');
  
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- Procédure pour rapport de stock
DROP PROCEDURE IF EXISTS get_stock_report$$
CREATE PROCEDURE get_stock_report(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('
    SELECT a.narticle, a.designation, a.famille, a.stock_f, a.stock_bl, a.seuil,
           a.prix_vente, (a.stock_f * a.prix_vente) as valeur_stock,
           CASE 
             WHEN a.stock_f <= 0 THEN ''RUPTURE''
             WHEN a.stock_f <= a.seuil THEN ''CRITIQUE''
             ELSE ''NORMAL''
           END as status
    FROM `', p_tenant, '`.article a
    ORDER BY a.stock_f ASC, a.narticle
  ');
  
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- =====================================================
-- 4. FONCTIONS D'ADMINISTRATION
-- =====================================================

-- Fonction pour valider un document
DROP FUNCTION IF EXISTS validate_document$$
CREATE FUNCTION validate_document(
  p_tenant VARCHAR(50),
  p_document_type VARCHAR(20),
  p_nfact INT
)
RETURNS BOOLEAN
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE doc_count INT DEFAULT 0;
  
  CASE p_document_type
    WHEN 'bl' THEN
      SET @sql = CONCAT('SELECT COUNT(*) FROM `', p_tenant, '`.bl WHERE nfact = ', p_nfact);
    WHEN 'facture' THEN
      SET @sql = CONCAT('SELECT COUNT(*) FROM `', p_tenant, '`.facture WHERE nfact = ', p_nfact);
    WHEN 'proforma' THEN
      SET @sql = CONCAT('SELECT COUNT(*) FROM `', p_tenant, '`.proforma WHERE nfact = ', p_nfact);
    ELSE
      RETURN FALSE;
  END CASE;
  
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
  
  RETURN doc_count > 0;
END$$

DELIMITER ;

-- =====================================================
-- 5. COMMENTAIRES
-- =====================================================

-- MySQL ne supporte pas COMMENT ON FUNCTION, mais on peut documenter ici
-- get_articles_by_tenant: Récupère tous les articles pour un tenant donné
-- get_clients_by_tenant: Récupère tous les clients pour un tenant donné
-- get_fournisseurs_by_tenant: Récupère tous les fournisseurs pour un tenant donné
-- calculate_margin: Calcule la marge en pourcentage
-- get_next_number: Obtient le prochain numéro de document
-- update_stock: Met à jour le stock d'un article
-- get_sales_report: Génère un rapport des ventes
-- get_stock_report: Génère un rapport de stock
-- validate_document: Valide l'existence d'un document