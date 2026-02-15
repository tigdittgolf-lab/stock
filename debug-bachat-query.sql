-- Voir quelques exemples de données
SELECT * FROM bachat LIMIT 3;

-- Vérifier les types de données
DESCRIBE bachat;

-- Vérifier s'il y a des valeurs NULL dans nfact
SELECT COUNT(*) as total, 
       COUNT(nfact) as with_nfact,
       COUNT(date_fact) as with_date
FROM bachat;
