-- Fonction pour récupérer un BL d'achat spécifique avec ses détails
CREATE OR REPLACE FUNCTION get_purchase_bl_by_id(p_tenant text, p_nfact text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Construire la requête dynamique avec le schéma tenant
  EXECUTE format('
    SELECT json_build_object(
      ''nbl_achat'', b.nfact,
      ''nfournisseur'', b.nfournisseur,
      ''numero_bl_fournisseur'', b.nfact,
      ''supplier_name'', COALESCE(f."Nom_fournisseur", b.nfournisseur),
      ''supplier_address'', COALESCE(f."Adresse_fourni", ''''),
      ''date_bl'', b.date_fact,
      ''montant_ht'', COALESCE(b.montant_ht, 0),
      ''tva'', COALESCE(b.tva, 0),
      ''timbre'', COALESCE(b.timbre, 0),
      ''autre_taxe'', COALESCE(b.autre_taxe, 0),
      ''total_ttc'', COALESCE(b.montant_ht, 0) + COALESCE(b.tva, 0) + COALESCE(b.timbre, 0) + COALESCE(b.autre_taxe, 0),
      ''ncheque'', b.ncheque,
      ''banque'', b.banque,
      ''created_at'', b.date_fact,
      ''details'', COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              ''narticle'', d."Narticle",
              ''designation'', COALESCE(a.designation, d."Narticle"),
              ''qte'', COALESCE(d."Qte", 0),
              ''prix'', COALESCE(d.prix, 0),
              ''tva'', COALESCE(d.tva, 0),
              ''total_ligne'', COALESCE(d.total_ligne, 0)
            )
          )
          FROM %I.bachat_detail d
          LEFT JOIN %I.article a ON a."Narticle" = d."Narticle"
          WHERE d."NFact" = b.nfact
            AND d.nfournisseur = b.nfournisseur
        ),
        ''[]''::json
      )
    )
    FROM %I.bachat b
    LEFT JOIN %I.fournisseur f ON f."Nfournisseur" = b.nfournisseur
    WHERE b.nfact = $1
  ', p_tenant, p_tenant, p_tenant, p_tenant)
  INTO v_result
  USING p_nfact;

  RETURN v_result;
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION get_purchase_bl_by_id(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_bl_by_id(text, text) TO anon;
