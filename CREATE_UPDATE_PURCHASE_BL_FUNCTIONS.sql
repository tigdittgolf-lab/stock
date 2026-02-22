-- Fonction pour mettre à jour un BL d'achat
CREATE OR REPLACE FUNCTION update_purchase_bl(
  p_tenant text,
  p_nfact text,
  p_nfournisseur text,
  p_date_bl date,
  p_details json
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_montant_ht numeric := 0;
  v_tva_total numeric := 0;
  v_detail json;
  v_qte numeric;
  v_prix numeric;
  v_tva numeric;
  v_total_ligne numeric;
  v_tva_ligne numeric;
BEGIN
  -- 1. Supprimer les anciens détails
  EXECUTE format('DELETE FROM %I.bachat_detail WHERE "NFact" = $1 AND nfournisseur = $2', p_tenant)
  USING p_nfact, p_nfournisseur;

  -- 2. Calculer les totaux et insérer les nouveaux détails
  FOR v_detail IN SELECT * FROM json_array_elements(p_details)
  LOOP
    v_qte := COALESCE((v_detail->>'Qte')::numeric, 0);
    v_prix := COALESCE((v_detail->>'prix')::numeric, 0);
    v_tva := COALESCE((v_detail->>'tva')::numeric, 0);
    v_total_ligne := v_qte * v_prix;
    v_tva_ligne := v_total_ligne * (v_tva / 100);
    
    v_montant_ht := v_montant_ht + v_total_ligne;
    v_tva_total := v_tva_total + v_tva_ligne;
    
    -- Insérer le détail
    EXECUTE format('
      INSERT INTO %I.bachat_detail ("NFact", nfournisseur, "Narticle", "Qte", prix, tva, total_ligne)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    ', p_tenant)
    USING p_nfact, p_nfournisseur, v_detail->>'Narticle', v_qte, v_prix, v_tva, v_total_ligne;
  END LOOP;

  -- 3. Mettre à jour l'en-tête du BL
  EXECUTE format('
    UPDATE %I.bachat
    SET date_fact = $1, montant_ht = $2, tva = $3
    WHERE nfact = $4 AND nfournisseur = $5
  ', p_tenant)
  USING p_date_bl, v_montant_ht, v_tva_total, p_nfact, p_nfournisseur;

  -- 4. Retourner le résultat
  RETURN json_build_object(
    'success', true,
    'nfact', p_nfact,
    'nfournisseur', p_nfournisseur,
    'date_bl', p_date_bl,
    'montant_ht', v_montant_ht,
    'tva', v_tva_total,
    'total_ttc', v_montant_ht + v_tva_total
  );
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION update_purchase_bl(text, text, text, date, json) TO authenticated;
GRANT EXECUTE ON FUNCTION update_purchase_bl(text, text, text, date, json) TO anon;
