-- Fonction RPC pour obtenir le prochain numéro de facture
-- Cette fonction est nécessaire pour l'endpoint /api/sales/invoices/next-number

-- 1. Fonction pour obtenir le prochain numéro de facture
CREATE OR REPLACE FUNCTION get_next_invoice_number_simple(p_tenant TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_number INTEGER;
    schema_name TEXT;
BEGIN
    -- Construire le nom du schéma
    schema_name := p_tenant;
    
    -- Obtenir le prochain numéro de facture
    EXECUTE format('
        SELECT COALESCE(MAX(nfact), 0) + 1 
        FROM %I.fact
    ', schema_name) INTO next_number;
    
    -- Si aucune facture n'existe, commencer à 1
    IF next_number IS NULL THEN
        next_number := 1;
    END IF;
    
    RETURN next_number;
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur (schéma inexistant, etc.), retourner 1
        RETURN 1;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_next_invoice_number_simple TO anon, authenticated;

-- Commentaire
COMMENT ON FUNCTION get_next_invoice_number_simple IS 'Obtient le prochain numéro de facture pour un tenant';