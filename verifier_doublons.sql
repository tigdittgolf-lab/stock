-- Vérifier les doublons dans bachat
SELECT 
    nfact, 
    nfournisseur, 
    COUNT(*) as nb_doublons,
    GROUP_CONCAT(date_fact ORDER BY date_fact) as dates,
    GROUP_CONCAT(montant_ht ORDER BY date_fact) as montants
FROM bachat
GROUP BY nfact, nfournisseur
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- Vérifier les doublons dans fachat
SELECT 
    nfact, 
    nfournisseur, 
    COUNT(*) as nb_doublons,
    GROUP_CONCAT(date_fact ORDER BY date_fact) as dates,
    GROUP_CONCAT(montant_ht ORDER BY date_fact) as montants
FROM fachat
GROUP BY nfact, nfournisseur
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;
