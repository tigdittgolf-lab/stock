-- FONCTIONS RPC CORRIGÉES AVEC LA BONNE CASSE
-- Exécutez ces fonctions pour remplacer les anciennes

-- Function to get article stock (CORRIGÉE)
CREATE OR REPLACE FUNCTION get_article_stock(
  p_tenant TEXT,
  p_narticle VARCHAR(10)
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT row_to_json(t) FROM (SELECT stock_f, stock_bl FROM %I.article WHERE "Narticle" = $1) t', p_tenant)
  USING p_narticle
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update stock_bl only (CORRIGÉE)
CREATE OR REPLACE FUNCTION update_stock_bl(
  p_tenant TEXT,
  p_narticle VARCHAR(10),
  p_quantity INTEGER
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('UPDATE %I.article SET stock_bl = stock_bl - $2 WHERE "Narticle" = $1 RETURNING stock_bl', p_tenant)
  USING p_narticle, p_quantity
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update stock_f only (CORRIGÉE)
CREATE OR REPLACE FUNCTION update_stock_f(
  p_tenant TEXT,
  p_narticle VARCHAR(10),
  p_quantity INTEGER
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('UPDATE %I.article SET stock_f = stock_f - $2 WHERE "Narticle" = $1 RETURNING stock_f', p_tenant)
  USING p_narticle, p_quantity
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update article stock (CORRIGÉE)
CREATE OR REPLACE FUNCTION update_article_stock(
  p_tenant TEXT,
  p_narticle VARCHAR(10),
  p_stock_f INTEGER,
  p_stock_bl INTEGER
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('UPDATE %I.article SET stock_f = $2, stock_bl = $3 WHERE "Narticle" = $1 RETURNING *', p_tenant)
  USING p_narticle, p_stock_f, p_stock_bl
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;