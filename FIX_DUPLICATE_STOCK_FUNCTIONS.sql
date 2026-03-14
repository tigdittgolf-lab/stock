-- =====================================================
-- FIX: Suppression des fonctions dupliquées + recréation propre
-- Exécuter ce script dans Supabase SQL Editor
-- =====================================================

-- 1. Supprimer TOUTES les versions (avec toutes les signatures possibles)
DROP FUNCTION IF EXISTS update_stock_purchase_invoice(TEXT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS update_stock_purchase_invoice(TEXT, VARCHAR, NUMERIC);
DROP FUNCTION IF EXISTS update_stock_purchase_invoice(TEXT, TEXT, NUMERIC(15,2));
DROP FUNCTION IF EXISTS update_stock_purchase_bl(TEXT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS update_stock_purchase_bl(TEXT, VARCHAR, NUMERIC);
DROP FUNCTION IF EXISTS update_stock_purchase_bl(TEXT, TEXT, NUMERIC(15,2));

-- 2. Recréer une seule version propre avec "Narticle" (majuscule comme dans la DB)

-- Facture d'achat → augmente stock_f
CREATE OR REPLACE FUNCTION update_stock_purchase_invoice(p_tenant TEXT, p_narticle TEXT, p_quantity NUMERIC)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $function$
BEGIN
  EXECUTE format('
    UPDATE %I.article SET stock_f = COALESCE(stock_f, 0) + $1 WHERE "Narticle" = $2
  ', p_tenant) USING p_quantity, p_narticle;
  RETURN format('stock_f +%s pour %s', p_quantity, p_narticle);
EXCEPTION WHEN OTHERS THEN RETURN format('Erreur stock: %s', SQLERRM);
END;
$function$;

-- BL d'achat → augmente stock_bl
CREATE OR REPLACE FUNCTION update_stock_purchase_bl(p_tenant TEXT, p_narticle TEXT, p_quantity NUMERIC)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $function$
BEGIN
  EXECUTE format('
    UPDATE %I.article SET stock_bl = COALESCE(stock_bl, 0) + $1 WHERE "Narticle" = $2
  ', p_tenant) USING p_quantity, p_narticle;
  RETURN format('stock_bl +%s pour %s', p_quantity, p_narticle);
EXCEPTION WHEN OTHERS THEN RETURN format('Erreur stock: %s', SQLERRM);
END;
$function$;

GRANT EXECUTE ON FUNCTION update_stock_purchase_invoice TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_stock_purchase_bl TO anon, authenticated, service_role;

-- Vérification: doit retourner exactement 2 lignes (une par fonction)
SELECT proname, pronargs, proargtypes::text 
FROM pg_proc 
WHERE proname IN ('update_stock_purchase_invoice', 'update_stock_purchase_bl')
ORDER BY proname;
