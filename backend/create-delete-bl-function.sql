-- Fonction pour supprimer un bon de livraison avec récupération de stock et mise à jour CA
CREATE OR REPLACE FUNCTION delete_bl_with_stock_recovery(
  p_tenant TEXT,
  p_nfact INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bl_record RECORD;
  detail_record RECORD;
  client_record RECORD;
  result JSON;
BEGIN
  -- Vérifier que le tenant est fourni
  IF p_tenant IS NULL OR p_tenant = '' THEN
    RAISE EXCEPTION 'Tenant parameter is required';
  END IF;

  -- Vérifier que le BL existe
  EXECUTE format('SELECT * FROM %I.bl WHERE nfact = $1', p_tenant) 
  INTO bl_record USING p_nfact;
  
  IF bl_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Bon de livraison non trouvé'
    );
  END IF;

  -- Récupérer les informations client pour mise à jour CA
  EXECUTE format('SELECT * FROM %I.clients WHERE nclient = $1', p_tenant)
  INTO client_record USING bl_record.nclient;

  -- 1. Récupérer le stock pour chaque article du BL
  FOR detail_record IN 
    EXECUTE format('SELECT * FROM %I.detail_bl WHERE nfact = $1', p_tenant) 
    USING p_nfact
  LOOP
    -- Remettre le stock BL (ajouter la quantité qui avait été déduite)
    EXECUTE format('
      UPDATE %I.articles 
      SET stock_bl = stock_bl + $1 
      WHERE narticle = $2
    ', p_tenant) 
    USING detail_record.qte, detail_record.narticle;
    
    RAISE NOTICE 'Stock récupéré: Article % +%', detail_record.narticle, detail_record.qte;
  END LOOP;

  -- 2. Mettre à jour le chiffre d'affaires du client (diminuer)
  IF client_record IS NOT NULL THEN
    EXECUTE format('
      UPDATE %I.clients 
      SET c_affaire_bl = c_affaire_bl - $1 
      WHERE nclient = $2
    ', p_tenant) 
    USING (bl_record.montant_ht + bl_record.tva), bl_record.nclient;
    
    RAISE NOTICE 'CA client diminué: % -%', bl_record.nclient, (bl_record.montant_ht + bl_record.tva);
  END IF;

  -- 3. Supprimer les détails du BL
  EXECUTE format('DELETE FROM %I.detail_bl WHERE nfact = $1', p_tenant) 
  USING p_nfact;

  -- 4. Supprimer le BL
  EXECUTE format('DELETE FROM %I.bl WHERE nfact = $1', p_tenant) 
  USING p_nfact;

  -- Retourner le résultat de succès
  result := json_build_object(
    'success', true,
    'message', 'Bon de livraison supprimé avec succès',
    'nfact', p_nfact,
    'stock_recovered', true,
    'ca_updated', true
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors de la suppression du BL %: %', p_nfact, SQLERRM;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION delete_bl_with_stock_recovery TO anon, authenticated;

-- Commentaire
COMMENT ON FUNCTION delete_bl_with_stock_recovery IS 'Supprime un BL avec récupération automatique du stock et mise à jour du CA client';