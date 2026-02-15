-- =====================================================
-- NETTOYER LES DOUBLONS RESTANTS - VERSION FINALE
-- =====================================================

USE stock_management;

-- Supprimer les doublons en gardant celui avec le montant_ht le plus élevé
-- Pour bachat
DELETE b1 FROM bachat b1
INNER JOIN bachat b2 
ON b1.nfact = b2.nfact 
  AND b1.nfournisseur = b2.nfournisseur
WHERE b1.montant_ht < b2.montant_ht;

-- Vérifier qu'il n'y a plus de doublons dans bachat
SELECT 'Doublons restants dans bachat:' as message;
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

-- Pour fachat
DELETE f1 FROM fachat f1
INNER JOIN fachat f2 
ON f1.nfact = f2.nfact 
  AND f1.nfournisseur = f2.nfournisseur
WHERE f1.montant_ht < f2.montant_ht;

-- Vérifier qu'il n'y a plus de doublons dans fachat
SELECT 'Doublons restants dans fachat:' as message;
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

SELECT 'Nettoyage terminé ! Vous pouvez maintenant ajouter la clé primaire composite.' as message;
