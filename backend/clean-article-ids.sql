-- Script pour nettoyer les IDs d'articles (supprimer les espaces)
-- À EXÉCUTER DANS SUPABASE SQL EDITOR

-- Nettoyer les IDs dans le schéma 2025_bu01
UPDATE "2025_bu01".article 
SET narticle = TRIM(narticle) 
WHERE narticle != TRIM(narticle);

-- Vérifier le résultat
SELECT narticle, LENGTH(narticle) as id_length, designation 
FROM "2025_bu01".article;