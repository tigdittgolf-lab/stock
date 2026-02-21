-- Vérification finale de l'article 6786
SELECT COUNT(*) as nombre_lignes FROM "2009_bu02".article WHERE "Narticle" = '6786';

-- Si le résultat est 1, le problème vient du cache backend
-- Si le résultat est 2+, il faut relancer le DELETE
