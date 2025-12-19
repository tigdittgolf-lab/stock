-- Corriger la fonction get_families pour utiliser famille_art
CREATE OR REPLACE FUNCTION get_families(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  query_text := format('
    SELECT json_agg(famille) 
    FROM %I.famille_art 
    WHERE famille IS NOT NULL AND famille != ''''
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  
  RETURN COALESCE(result, '["Electricite", "Droguerie", "Peinture", "Outillage", "Plomberie", "Carrelage", "Menage", "Habillement"]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '["Electricite", "Droguerie", "Peinture", "Outillage", "Plomberie", "Carrelage", "Menage", "Habillement"]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test
SELECT get_families('2025_bu01');