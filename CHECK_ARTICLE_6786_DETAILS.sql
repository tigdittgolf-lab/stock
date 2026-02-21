-- Vérifier combien de fois l'article 6786 existe dans la base
SELECT 
    COUNT(*) as nombre_lignes_article_6786
FROM "2009_bu02".article
WHERE "Narticle" = '6786';

-- Voir TOUS les détails de l'article 6786
SELECT 
    "Narticle" as code_article,
    designation,
    famille,
    "Nfournisseur" as code_fournisseur,
    prix_unitaire,
    marge,
    tva,
    prix_vente,
    seuil,
    stock_f,
    stock_bl,
    (stock_f + stock_bl) as stock_total,
    ctid as identifiant_physique
FROM "2009_bu02".article
WHERE "Narticle" = '6786'
ORDER BY ctid;

-- Récupérer les noms des fournisseurs pour l'article 6786
SELECT 
    a."Narticle" as code_article,
    a.designation,
    a."Nfournisseur" as code_fournisseur,
    f.nom_fournisseur,
    a.prix_vente,
    (a.stock_f + a.stock_bl) as stock_total
FROM "2009_bu02".article a
LEFT JOIN "2009_bu02".fournisseur f ON a."Nfournisseur" = f."Nfournisseur"
WHERE a."Narticle" = '6786'
ORDER BY a.ctid;
