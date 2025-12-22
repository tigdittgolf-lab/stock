-- =====================================================
-- FONCTIONS RPC COMPLÈTES POUR MIGRATION
-- Compatible PostgreSQL et MySQL (avec adaptations)
-- =====================================================

-- =====================================================
-- 1. FONCTIONS DE LECTURE (GET)
-- =====================================================

-- Fonction pour récupérer les articles par tenant
CREATE OR REPLACE FUNCTION get_articles_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  narticle VARCHAR(50),
  designation VARCHAR(255),
  famille VARCHAR(100),
  nfournisseur VARCHAR(50),
  prix_unitaire DECIMAL(10,2),
  prix_vente DECIMAL(10,2),
  marge DECIMAL(10,2),
  tva DECIMAL(10,2),
  seuil INTEGER,
  stock_f INTEGER,
  stock_bl INTEGER,
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.article ORDER BY narticle', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les clients par tenant
CREATE OR REPLACE FUNCTION get_clients_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  nclient VARCHAR(50),
  raison_sociale VARCHAR(255),
  adresse TEXT,
  contact_person VARCHAR(255),
  tel VARCHAR(50),
  email VARCHAR(100),
  nrc VARCHAR(100),
  i_fiscal VARCHAR(100),
  c_affaire_fact DECIMAL(10,2),
  c_affaire_bl DECIMAL(10,2),
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.client ORDER BY nclient', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les fournisseurs par tenant
CREATE OR REPLACE FUNCTION get_fournisseurs_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  nfournisseur VARCHAR(50),
  nom_fournisseur VARCHAR(255),
  resp_fournisseur VARCHAR(255),
  adresse_fourni TEXT,
  tel VARCHAR(50),
  tel1 VARCHAR(50),
  tel2 VARCHAR(50),
  email VARCHAR(100),
  caf DECIMAL(10,2),
  cabl DECIMAL(10,2),
  commentaire TEXT,
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.fournisseur ORDER BY nfournisseur', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les familles d'articles par tenant
CREATE OR REPLACE FUNCTION get_families_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  famille VARCHAR(100)
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT famille FROM %I.famille_art ORDER BY famille', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer l'activité par tenant
CREATE OR REPLACE FUNCTION get_activites_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  id INTEGER,
  nom_entreprise VARCHAR(255),
  adresse TEXT,
  commune VARCHAR(100),
  wilaya VARCHAR(100),
  tel_fixe VARCHAR(50),
  tel_port VARCHAR(50),
  email VARCHAR(100),
  e_mail VARCHAR(100),
  nif VARCHAR(50),
  ident_fiscal VARCHAR(50),
  rc VARCHAR(50),
  nrc VARCHAR(50),
  nart VARCHAR(50),
  banq VARCHAR(255),
  sous_domaine TEXT,
  domaine_activite TEXT,
  slogan TEXT,
  logo_url TEXT,
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.activite ORDER BY id', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les bons de livraison par tenant
CREATE OR REPLACE FUNCTION get_bls_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  nfact INTEGER,
  nclient VARCHAR(50),
  date_fact DATE,
  montant_ht DECIMAL(10,2),
  tva DECIMAL(10,2),
  montant_ttc DECIMAL(10,2),
  marge DECIMAL(10,2),
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.bl ORDER BY nfact', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les factures par tenant
CREATE OR REPLACE FUNCTION get_factures_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  nfact INTEGER,
  nclient VARCHAR(50),
  date_fact DATE,
  montant_ht DECIMAL(10,2),
  tva DECIMAL(10,2),
  montant_ttc DECIMAL(10,2),
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.facture ORDER BY nfact', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les proformas par tenant
CREATE OR REPLACE FUNCTION get_proformas_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  nfact INTEGER,
  nclient VARCHAR(50),
  date_fact DATE,
  montant_ht DECIMAL(10,2),
  tva DECIMAL(10,2),
  montant_ttc DECIMAL(10,2),
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.proforma ORDER BY nfact', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les détails BL par tenant
CREATE OR REPLACE FUNCTION get_detail_bl_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  id INTEGER,
  nfact INTEGER,
  narticle VARCHAR(50),
  qte INTEGER,
  prix_unitaire DECIMAL(10,2),
  montant DECIMAL(10,2),
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.detail_bl ORDER BY id', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les détails factures par tenant
CREATE OR REPLACE FUNCTION get_detail_fact_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  id INTEGER,
  nfact INTEGER,
  narticle VARCHAR(50),
  qte INTEGER,
  prix_unitaire DECIMAL(10,2),
  montant DECIMAL(10,2),
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.detail_fact ORDER BY id', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les détails proforma par tenant
CREATE OR REPLACE FUNCTION get_detail_proforma_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  id INTEGER,
  nfact INTEGER,
  narticle VARCHAR(50),
  qte INTEGER,
  prix_unitaire DECIMAL(10,2),
  montant DECIMAL(10,2),
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.detail_proforma ORDER BY id', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. FONCTIONS MÉTIER
-- =====================================================

-- Fonction pour calculer la marge
CREATE OR REPLACE FUNCTION calculate_margin(p_prix_achat DECIMAL(10,2), p_prix_vente DECIMAL(10,2))
RETURNS DECIMAL(10,2)
SECURITY DEFINER
AS $$
BEGIN
  IF p_prix_achat = 0 OR p_prix_achat IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(((p_prix_vente - p_prix_achat) / p_prix_achat) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le prochain numéro de document
CREATE OR REPLACE FUNCTION get_next_number(p_tenant TEXT, p_document_type TEXT)
RETURNS INTEGER
SECURITY DEFINER
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  CASE p_document_type
    WHEN 'bl' THEN
      EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 FROM %I.bl', p_tenant) INTO next_num;
    WHEN 'facture' THEN
      EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 FROM %I.facture', p_tenant) INTO next_num;
    WHEN 'proforma' THEN
      EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 FROM %I.proforma', p_tenant) INTO next_num;
    ELSE
      next_num := 1;
  END CASE;
  
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le stock
CREATE OR REPLACE FUNCTION update_stock(
  p_tenant TEXT,
  p_narticle VARCHAR(50),
  p_qte INTEGER,
  p_operation VARCHAR(10) -- 'add' ou 'subtract'
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  IF p_operation = 'add' THEN
    EXECUTE format('UPDATE %I.article SET stock_f = stock_f + %s WHERE narticle = %L', 
                   p_tenant, p_qte, p_narticle);
  ELSIF p_operation = 'subtract' THEN
    EXECUTE format('UPDATE %I.article SET stock_f = stock_f - %s WHERE narticle = %L', 
                   p_tenant, p_qte, p_narticle);
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FONCTIONS DE RAPPORT
-- =====================================================

-- Fonction pour rapport des ventes
CREATE OR REPLACE FUNCTION get_sales_report(
  p_tenant TEXT,
  p_date_debut DATE DEFAULT NULL,
  p_date_fin DATE DEFAULT NULL
)
RETURNS TABLE (
  document_type VARCHAR(20),
  nfact INTEGER,
  nclient VARCHAR(50),
  raison_sociale VARCHAR(255),
  date_fact DATE,
  montant_ht DECIMAL(10,2),
  tva DECIMAL(10,2),
  montant_ttc DECIMAL(10,2),
  marge DECIMAL(10,2)
)
SECURITY DEFINER
AS $$
BEGIN
  -- Combiner BL et Factures
  RETURN QUERY EXECUTE format('
    SELECT ''BL''::VARCHAR(20) as document_type, bl.nfact, bl.nclient, c.raison_sociale, 
           bl.date_fact, bl.montant_ht, bl.tva, bl.montant_ttc, bl.marge
    FROM %I.bl bl
    LEFT JOIN %I.client c ON bl.nclient = c.nclient
    WHERE ($1 IS NULL OR bl.date_fact >= $1) AND ($2 IS NULL OR bl.date_fact <= $2)
    
    UNION ALL
    
    SELECT ''FACTURE''::VARCHAR(20) as document_type, f.nfact, f.nclient, c.raison_sociale,
           f.date_fact, f.montant_ht, f.tva, f.montant_ttc, 0::DECIMAL(10,2) as marge
    FROM %I.facture f
    LEFT JOIN %I.client c ON f.nclient = c.nclient
    WHERE ($1 IS NULL OR f.date_fact >= $1) AND ($2 IS NULL OR f.date_fact <= $2)
    
    ORDER BY date_fact DESC, nfact DESC
  ', p_tenant, p_tenant, p_tenant, p_tenant) 
  USING p_date_debut, p_date_fin;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour rapport de stock
CREATE OR REPLACE FUNCTION get_stock_report(p_tenant TEXT)
RETURNS TABLE (
  narticle VARCHAR(50),
  designation VARCHAR(255),
  famille VARCHAR(100),
  stock_f INTEGER,
  stock_bl INTEGER,
  seuil INTEGER,
  prix_vente DECIMAL(10,2),
  valeur_stock DECIMAL(10,2),
  status VARCHAR(20)
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT a.narticle, a.designation, a.famille, a.stock_f, a.stock_bl, a.seuil,
           a.prix_vente, (a.stock_f * a.prix_vente) as valeur_stock,
           CASE 
             WHEN a.stock_f <= 0 THEN ''RUPTURE''
             WHEN a.stock_f <= a.seuil THEN ''CRITIQUE''
             ELSE ''NORMAL''
           END::VARCHAR(20) as status
    FROM %I.article a
    ORDER BY a.stock_f ASC, a.narticle
  ', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FONCTIONS D'ADMINISTRATION
-- =====================================================

-- Fonction pour valider un document
CREATE OR REPLACE FUNCTION validate_document(
  p_tenant TEXT,
  p_document_type VARCHAR(20),
  p_nfact INTEGER
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  doc_exists BOOLEAN := FALSE;
BEGIN
  CASE p_document_type
    WHEN 'bl' THEN
      EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I.bl WHERE nfact = %s)', p_tenant, p_nfact) INTO doc_exists;
    WHEN 'facture' THEN
      EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I.facture WHERE nfact = %s)', p_tenant, p_nfact) INTO doc_exists;
    WHEN 'proforma' THEN
      EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I.proforma WHERE nfact = %s)', p_tenant, p_nfact) INTO doc_exists;
  END CASE;
  
  RETURN doc_exists;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. COMMENTAIRES ET PERMISSIONS
-- =====================================================

-- Ajouter des commentaires aux fonctions
COMMENT ON FUNCTION get_articles_by_tenant(TEXT) IS 'Récupère tous les articles pour un tenant donné';
COMMENT ON FUNCTION get_clients_by_tenant(TEXT) IS 'Récupère tous les clients pour un tenant donné';
COMMENT ON FUNCTION get_fournisseurs_by_tenant(TEXT) IS 'Récupère tous les fournisseurs pour un tenant donné';
COMMENT ON FUNCTION calculate_margin(DECIMAL, DECIMAL) IS 'Calcule la marge en pourcentage';
COMMENT ON FUNCTION get_next_number(TEXT, TEXT) IS 'Obtient le prochain numéro de document';
COMMENT ON FUNCTION update_stock(TEXT, VARCHAR, INTEGER, VARCHAR) IS 'Met à jour le stock d''un article';
COMMENT ON FUNCTION get_sales_report(TEXT, DATE, DATE) IS 'Génère un rapport des ventes';
COMMENT ON FUNCTION get_stock_report(TEXT) IS 'Génère un rapport de stock';
COMMENT ON FUNCTION validate_document(TEXT, VARCHAR, INTEGER) IS 'Valide l''existence d''un document';

-- Accorder les permissions (à adapter selon les besoins)
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO application_role;