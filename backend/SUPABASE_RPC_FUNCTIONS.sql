-- =====================================================
-- SUPABASE RPC FUNCTIONS FOR MULTI-TENANT SALES SYSTEM
-- =====================================================
-- Execute these functions in your Supabase SQL Editor
-- These functions allow access to custom tenant schemas (e.g., 2025_bu01)
-- =====================================================

-- ===== DELIVERY NOTES (BL) RPC FUNCTIONS =====

-- Function to insert BL header
CREATE OR REPLACE FUNCTION insert_bl(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_nclient VARCHAR(10),
  p_date_fact DATE,
  p_montant_ht NUMERIC(15,2),
  p_tva NUMERIC(15,2),
  p_timbre NUMERIC(15,2),
  p_autre_taxe NUMERIC(15,2)
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('INSERT INTO %I.bl (NFact, Nclient, date_fact, montant_ht, TVA, timbre, autre_taxe, facturer) VALUES ($1, $2, $3, $4, $5, $6, $7, false) RETURNING *', p_tenant)
  USING p_nfact, p_nclient, p_date_fact, p_montant_ht, p_tva, p_timbre, p_autre_taxe
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to insert BL detail
CREATE OR REPLACE FUNCTION insert_detail_bl(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_narticle VARCHAR(10),
  p_qte INTEGER,
  p_prix NUMERIC(15,2),
  p_tva NUMERIC(5,2),
  p_total_ligne NUMERIC(15,2)
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('INSERT INTO %I.detail_bl (NFact, Narticle, Qte, prix, tva, total_ligne, facturer) VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING *', p_tenant)
  USING p_nfact, p_narticle, p_qte, p_prix, p_tva, p_total_ligne
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get BL list
CREATE OR REPLACE FUNCTION get_bl_list(p_tenant TEXT) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (SELECT bl.NFact, bl.Nclient, bl.date_fact, bl.montant_ht, bl.TVA, client.raison_sociale FROM %I.bl LEFT JOIN %I.client ON bl.Nclient = client.nclient ORDER BY bl.NFact DESC) t', p_tenant, p_tenant)
  INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get BL by ID
CREATE OR REPLACE FUNCTION get_bl_by_id(p_tenant TEXT, p_nfact INTEGER) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT row_to_json(t) FROM (SELECT bl.*, client.raison_sociale, (SELECT json_agg(row_to_json(d)) FROM (SELECT detail_bl.*, article.designation FROM %I.detail_bl LEFT JOIN %I.article ON detail_bl.Narticle = article.Narticle WHERE detail_bl.NFact = bl.NFact) d) as details FROM %I.bl LEFT JOIN %I.client ON bl.Nclient = client.nclient WHERE bl.NFact = $1) t', p_tenant, p_tenant, p_tenant, p_tenant)
  USING p_nfact
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== INVOICES (FACTURES) RPC FUNCTIONS =====

-- Function to insert invoice header
CREATE OR REPLACE FUNCTION insert_fact(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_nclient VARCHAR(10),
  p_date_fact DATE,
  p_montant_ht NUMERIC(15,2),
  p_tva NUMERIC(15,2),
  p_timbre NUMERIC(15,2),
  p_autre_taxe NUMERIC(15,2),
  p_marge NUMERIC(15,2)
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('INSERT INTO %I.fact (NFact, Nclient, date_fact, montant_ht, TVA, timbre, autre_taxe, marge, banq, ncheque, nbc, date_bc, nom_preneur) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '''', '''', '''', NULL, '''') RETURNING *', p_tenant)
  USING p_nfact, p_nclient, p_date_fact, p_montant_ht, p_tva, p_timbre, p_autre_taxe, p_marge
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to insert invoice detail
CREATE OR REPLACE FUNCTION insert_detail_fact(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_narticle VARCHAR(10),
  p_qte INTEGER,
  p_prix NUMERIC(15,2),
  p_tva NUMERIC(5,2),
  p_pr_achat NUMERIC(15,2),
  p_total_ligne NUMERIC(15,2)
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('INSERT INTO %I.detail_fact (NFact, Narticle, Qte, prix, tva, pr_achat, total_ligne) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', p_tenant)
  USING p_nfact, p_narticle, p_qte, p_prix, p_tva, p_pr_achat, p_total_ligne
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get invoice list
CREATE OR REPLACE FUNCTION get_fact_list(p_tenant TEXT) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (SELECT fact.NFact, fact.Nclient, fact.date_fact, fact.montant_ht, fact.TVA, client.raison_sociale FROM %I.fact LEFT JOIN %I.client ON fact.Nclient = client.nclient ORDER BY fact.NFact DESC) t', p_tenant, p_tenant)
  INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get invoice by ID
CREATE OR REPLACE FUNCTION get_fact_by_id(p_tenant TEXT, p_nfact INTEGER) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT row_to_json(t) FROM (SELECT fact.*, client.raison_sociale, (SELECT json_agg(row_to_json(d)) FROM (SELECT detail_fact.*, article.designation FROM %I.detail_fact LEFT JOIN %I.article ON detail_fact.Narticle = article.Narticle WHERE detail_fact.NFact = fact.NFact) d) as details FROM %I.fact LEFT JOIN %I.client ON fact.Nclient = client.nclient WHERE fact.NFact = $1) t', p_tenant, p_tenant, p_tenant, p_tenant)
  USING p_nfact
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== PROFORMA INVOICES RPC FUNCTIONS =====

-- Function to insert proforma header
CREATE OR REPLACE FUNCTION insert_fprof(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_nclient VARCHAR(10),
  p_date_fact DATE,
  p_montant_ht NUMERIC(15,2),
  p_tva NUMERIC(15,2),
  p_timbre NUMERIC(15,2),
  p_autre_taxe NUMERIC(15,2),
  p_marge NUMERIC(15,2)
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('INSERT INTO %I.fprof (NFact, Nclient, date_fact, montant_ht, TVA, timbre, autre_taxe, marge, banq, ncheque, nbc, date_bc, nom_preneur) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '''', '''', '''', NULL, '''') RETURNING *', p_tenant)
  USING p_nfact, p_nclient, p_date_fact, p_montant_ht, p_tva, p_timbre, p_autre_taxe, p_marge
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to insert proforma detail
CREATE OR REPLACE FUNCTION insert_detail_fprof(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_narticle VARCHAR(10),
  p_qte INTEGER,
  p_prix NUMERIC(15,2),
  p_tva NUMERIC(5,2),
  p_pr_achat NUMERIC(15,2),
  p_total_ligne NUMERIC(15,2)
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('INSERT INTO %I.detail_fprof (NFact, Narticle, Qte, prix, tva, pr_achat, total_ligne) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', p_tenant)
  USING p_nfact, p_narticle, p_qte, p_prix, p_tva, p_pr_achat, p_total_ligne
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get proforma list
CREATE OR REPLACE FUNCTION get_fprof_list(p_tenant TEXT) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (SELECT fprof.NFact, fprof.Nclient, fprof.date_fact, fprof.montant_ht, fprof.TVA, client.raison_sociale FROM %I.fprof LEFT JOIN %I.client ON fprof.Nclient = client.nclient ORDER BY fprof.NFact DESC) t', p_tenant, p_tenant)
  INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get proforma by ID
CREATE OR REPLACE FUNCTION get_fprof_by_id(p_tenant TEXT, p_nfact INTEGER) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT row_to_json(t) FROM (SELECT fprof.*, client.raison_sociale, (SELECT json_agg(row_to_json(d)) FROM (SELECT detail_fprof.*, article.designation FROM %I.detail_fprof LEFT JOIN %I.article ON detail_fprof.Narticle = article.Narticle WHERE detail_fprof.NFact = fprof.NFact) d) as details FROM %I.fprof LEFT JOIN %I.client ON fprof.Nclient = client.nclient WHERE fprof.NFact = $1) t', p_tenant, p_tenant, p_tenant, p_tenant)
  USING p_nfact
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== STOCK MANAGEMENT RPC FUNCTIONS =====

-- Function to get article stock
CREATE OR REPLACE FUNCTION get_article_stock(
  p_tenant TEXT,
  p_narticle VARCHAR(10)
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT row_to_json(t) FROM (SELECT stock_f, stock_bl FROM %I.article WHERE Narticle = $1) t', p_tenant)
  USING p_narticle
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update article stock
CREATE OR REPLACE FUNCTION update_article_stock(
  p_tenant TEXT,
  p_narticle VARCHAR(10),
  p_stock_f INTEGER,
  p_stock_bl INTEGER
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('UPDATE %I.article SET stock_f = $2, stock_bl = $3 WHERE Narticle = $1 RETURNING *', p_tenant)
  USING p_narticle, p_stock_f, p_stock_bl
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update stock_bl only (for delivery notes)
CREATE OR REPLACE FUNCTION update_stock_bl(
  p_tenant TEXT,
  p_narticle VARCHAR(10),
  p_quantity INTEGER
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('UPDATE %I.article SET stock_bl = stock_bl - $2 WHERE Narticle = $1 RETURNING stock_bl', p_tenant)
  USING p_narticle, p_quantity
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update stock_f only (for invoices)
CREATE OR REPLACE FUNCTION update_stock_f(
  p_tenant TEXT,
  p_narticle VARCHAR(10),
  p_quantity INTEGER
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('UPDATE %I.article SET stock_f = stock_f - $2 WHERE Narticle = $1 RETURNING stock_f', p_tenant)
  USING p_narticle, p_quantity
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INSTRUCTIONS:
-- =====================================================
-- 1. Copy and paste ALL the functions above into your Supabase SQL Editor
-- 2. Execute them one by one or all at once
-- 3. SECURITY DEFINER allows functions to access tenant schemas with proper permissions
-- 4. Test by creating a delivery note, invoice, or proforma
-- 5. Check that data is actually stored in your database tables
-- 6. No more "permission denied for schema" errors!
-- 7. Stock updates now work with tenant schemas!
-- =====================================================