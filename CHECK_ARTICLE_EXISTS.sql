-- Vérifier si l'article 03A442 existe
SELECT * FROM "2009_bu02".article WHERE "Narticle" = '03A442';

-- Chercher des articles similaires
SELECT "Narticle", designation FROM "2009_bu02".article 
WHERE "Narticle" LIKE '%03A442%' OR "Narticle" LIKE '03A442%';

-- Voir quelques articles pour comprendre le format des codes
SELECT "Narticle", designation FROM "2009_bu02".article LIMIT 10;

-- Compter le nombre total d'articles
SELECT COUNT(*) as total FROM "2009_bu02".article;
