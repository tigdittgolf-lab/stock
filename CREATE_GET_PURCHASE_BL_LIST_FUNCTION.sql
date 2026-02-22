-- Fonction pour récupérer la liste des BL d'achat avec les infos fournisseurs
CREATE OR REPLACE FUNCTION get_purchase_bl_list(p_tenant text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Construire la requête dynamique avec le schéma tenant
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''nbl_achat'', b.nfact,
        ''nfournisseur'', b.nfournisseur,
        ''numero_bl_fournisseur'', b.nfact,
        ''supplier_name'', COALESCE(f."Nom_fournisseur", b.nfournisseur),
        ''date_bl'', b.date_fact,
        ''montant_ht'', COALESCE(b.montant_ht, 0),
        ''tva'', COALESCE(b.tva, 0),
        ''timbre'', COALESCE(b.timbre, 0),
        ''autre_taxe'', COALESCE(b.autre_taxe, 0),
        ''total_ttc'', COALESCE(b.montant_ht, 0) + COALESCE(b.tva, 0) + COALESCE(b.timbre, 0) + COALESCE(b.autre_taxe, 0),
        ''created_at'', b.date_fact,
        ''type'', ''purchase_delivery_note''
      ) ORDER BY b.date_fact DESC
    )
    FROM %I.bachat b
    LEFT JOIN %I.fournisseur f ON f."Nfournisseur" = b.nfournisseur
  ', p_tenant, p_tenant)
  INTO v_result;

  -- Si aucun résultat, retourner un tableau vide
  IF v_result IS NULL THEN
    v_result := '[]'::json;
  END IF;

  RETURN v_result;
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION get_purchase_bl_list(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_bl_list(text) TO anon;
