-- Créer toutes les fonctions RPC manquantes pour la migration complète

-- Fonction pour récupérer les fournisseurs
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
  commentaire TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.fournisseur ORDER BY nfournisseur', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer l'activité/entreprise
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
  logo_url TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.activite ORDER BY id', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les bons de livraison
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

-- Fonction pour récupérer les factures
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

-- Fonction pour récupérer les détails BL
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

-- Fonction pour récupérer les détails factures
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

-- Fonction pour récupérer les détails proforma
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

-- Fonction pour récupérer les familles d'articles (table famille_art)
CREATE OR REPLACE FUNCTION get_famille_art_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  id INTEGER,
  famille VARCHAR(100),
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.famille_art ORDER BY id', p_tenant);
END;
$$ LANGUAGE plpgsql;