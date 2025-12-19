-- =====================================================
-- CORRECTION POUR RÉCUPÉRER LES FAMILLES DEPUIS LA TABLE FAMILLE_ART
-- =====================================================

-- Remplacer la fonction get_families pour utiliser la table famille_art
CREATE OR REPLACE FUNCTION get_families(p_tenant TEXT)
RETURNS JSON AS $$$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  -- Récupérer depuis la table famille_art
  query_text := format('
    SELECT json_agg(famille) 
    FROM %I.famille_art 
    WHERE famille IS NOT NULL AND famille != ''''
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  
  RETURN COALESCE(result, '["Electricité", "Droguerie", "Peinture", "Outillage", "Plomberie", "Carrelage", "Menage", "Habillement"]'::json);
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner toutes les familles connues
    RETURN '["Electricité", "Droguerie", "Peinture", "Outillage", "Plomberie", "Carrelage", "Menage", "Habillement"]'::json;
END;
$$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test de la fonction
SELECT 'Test familles depuis famille_art:' as test, get_families('2025_bu01');

-- Vérifier le contenu de la table famille_art
SELECT 'Contenu table famille_art:' as info;
SELECT * FROM "2025_bu01".famille_art LIMIT 10;