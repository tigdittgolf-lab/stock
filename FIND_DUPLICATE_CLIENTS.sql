-- Trouver tous les clients en double
SELECT 
    "Nclient",
    COUNT(*) as count,
    STRING_AGG("Raison_sociale", ', ') as raisons_sociales
FROM "2009_bu02".client
GROUP BY "Nclient"
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, "Nclient";

-- Compter le nombre total de doublons
SELECT 
    COUNT(DISTINCT "Nclient") as unique_clients,
    COUNT(*) as total_rows,
    COUNT(*) - COUNT(DISTINCT "Nclient") as duplicates
FROM "2009_bu02".client;
