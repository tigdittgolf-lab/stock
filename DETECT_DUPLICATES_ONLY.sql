-- ============================================================================
-- SCRIPT DE DÉTECTION DES DOUBLONS - TOUTES LES TABLES
-- ============================================================================
-- Ce script détecte uniquement les doublons SANS RIEN SUPPRIMER
-- Utilisez-le pour analyser la situation avant de supprimer
-- ============================================================================

-- ============================================================================
-- 1. CLIENTS - Doublons basés sur Nclient
-- ============================================================================
SELECT '=== CLIENTS DOUBLONS ===' as info;

SELECT 
  "Nclient",
  COUNT(*) as nb_doublons,
  STRING_AGG("Raison_sociale", ' | ') as raisons_sociales,
  STRING_AGG(COALESCE("C_affaire_fact", 0)::text, ' | ') as ca_fact,
  STRING_AGG(COALESCE("C_affaire_bl", 0)::text, ' | ') as ca_bl
FROM "2009_bu02".client
GROUP BY "Nclient"
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- Résumé clients
SELECT 
  COUNT(*) as total_clients,
  COUNT(DISTINCT "Nclient") as clients_uniques,
  COUNT(*) - COUNT(DISTINCT "Nclient") as nb_doublons_a_supprimer
FROM "2009_bu02".client;

-- ============================================================================
-- 2. ARTICLES - Doublons basés sur Narticle
-- ============================================================================
SELECT '=== ARTICLES DOUBLONS ===' as info;

SELECT 
  "Narticle",
  COUNT(*) as nb_doublons,
  STRING_AGG(designation, ' | ') as designations,
  STRING_AGG(COALESCE(stock_f, 0)::text, ' | ') as stocks,
  STRING_AGG(COALESCE(prix_vente, 0)::text, ' | ') as prix
FROM "2009_bu02".article
GROUP BY "Narticle"
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- Résumé articles
SELECT 
  COUNT(*) as total_articles,
  COUNT(DISTINCT "Narticle") as articles_uniques,
  COUNT(*) - COUNT(DISTINCT "Narticle") as nb_doublons_a_supprimer
FROM "2009_bu02".article;

-- ============================================================================
-- 3. FOURNISSEURS - Doublons basés sur Nfournisseur
-- ============================================================================
SELECT '=== FOURNISSEURS DOUBLONS ===' as info;

SELECT 
  "Nfournisseur",
  COUNT(*) as nb_doublons,
  STRING_AGG("Raison_sociale", ' | ') as raisons_sociales,
  STRING_AGG(COALESCE("Adresse_fourni", ''), ' | ') as adresses
FROM "2009_bu02".fournisseur
GROUP BY "Nfournisseur"
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- Résumé fournisseurs
SELECT 
  COUNT(*) as total_fournisseurs,
  COUNT(DISTINCT "Nfournisseur") as fournisseurs_uniques,
  COUNT(*) - COUNT(DISTINCT "Nfournisseur") as nb_doublons_a_supprimer
FROM "2009_bu02".fournisseur;

-- ============================================================================
-- 4. BONS DE LIVRAISON (BL) - Doublons basés sur NFact
-- ============================================================================
SELECT '=== BL DOUBLONS ===' as info;

SELECT 
  "NFact",
  COUNT(*) as nb_doublons,
  STRING_AGG("Nclient", ' | ') as clients,
  STRING_AGG(date_bl::text, ' | ') as dates,
  STRING_AGG((montant_ht + "TVA")::text, ' | ') as montants_ttc
FROM "2009_bu02".bl
GROUP BY "NFact"
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- Résumé BL
SELECT 
  COUNT(*) as total_bl,
  COUNT(DISTINCT "NFact") as bl_uniques,
  COUNT(*) - COUNT(DISTINCT "NFact") as nb_doublons_a_supprimer
FROM "2009_bu02".bl;

-- Détails des BL en doublon (pour analyse approfondie)
SELECT 
  b."NFact",
  b."Nclient",
  b.date_bl,
  b.montant_ht,
  b."TVA",
  b.montant_ht + b."TVA" as total_ttc,
  (SELECT COUNT(*) FROM "2009_bu02".detail_bl WHERE "NFact" = b."NFact") as nb_lignes_detail
FROM "2009_bu02".bl b
WHERE b."NFact" IN (
  SELECT "NFact"
  FROM "2009_bu02".bl
  GROUP BY "NFact"
  HAVING COUNT(*) > 1
)
ORDER BY b."NFact", b.date_bl DESC;

-- ============================================================================
-- 5. FACTURES - Doublons basés sur NFact
-- ============================================================================
SELECT '=== FACTURES DOUBLONS ===' as info;

SELECT 
  "NFact",
  COUNT(*) as nb_doublons,
  STRING_AGG("Nclient", ' | ') as clients,
  STRING_AGG(date_fact::text, ' | ') as dates,
  STRING_AGG((montant_ht + "TVA")::text, ' | ') as montants_ttc
FROM "2009_bu02".fact
GROUP BY "NFact"
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- Résumé factures
SELECT 
  COUNT(*) as total_factures,
  COUNT(DISTINCT "NFact") as factures_uniques,
  COUNT(*) - COUNT(DISTINCT "NFact") as nb_doublons_a_supprimer
FROM "2009_bu02".fact;

-- ============================================================================
-- 6. PROFORMAS - Doublons basés sur NFact
-- ============================================================================
SELECT '=== PROFORMAS DOUBLONS ===' as info;

SELECT 
  "NFact",
  COUNT(*) as nb_doublons,
  STRING_AGG("Nclient", ' | ') as clients,
  STRING_AGG(date_proforma::text, ' | ') as dates,
  STRING_AGG((montant_ht + "TVA")::text, ' | ') as montants_ttc
FROM "2009_bu02".proforma
GROUP BY "NFact"
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- Résumé proformas
SELECT 
  COUNT(*) as total_proformas,
  COUNT(DISTINCT "NFact") as proformas_uniques,
  COUNT(*) - COUNT(DISTINCT "NFact") as nb_doublons_a_supprimer
FROM "2009_bu02".proforma;

-- ============================================================================
-- RÉSUMÉ GLOBAL
-- ============================================================================
SELECT '=== RÉSUMÉ GLOBAL ===' as info;

SELECT 
  'Clients' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT "Nclient") as unique_keys,
  COUNT(*) - COUNT(DISTINCT "Nclient") as doublons_a_supprimer,
  ROUND(100.0 * (COUNT(*) - COUNT(DISTINCT "Nclient")) / NULLIF(COUNT(*), 0), 2) as pourcentage_doublons
FROM "2009_bu02".client
UNION ALL
SELECT 
  'Articles',
  COUNT(*),
  COUNT(DISTINCT "Narticle"),
  COUNT(*) - COUNT(DISTINCT "Narticle"),
  ROUND(100.0 * (COUNT(*) - COUNT(DISTINCT "Narticle")) / NULLIF(COUNT(*), 0), 2)
FROM "2009_bu02".article
UNION ALL
SELECT 
  'Fournisseurs',
  COUNT(*),
  COUNT(DISTINCT "Nfournisseur"),
  COUNT(*) - COUNT(DISTINCT "Nfournisseur"),
  ROUND(100.0 * (COUNT(*) - COUNT(DISTINCT "Nfournisseur")) / NULLIF(COUNT(*), 0), 2)
FROM "2009_bu02".fournisseur
UNION ALL
SELECT 
  'BL',
  COUNT(*),
  COUNT(DISTINCT "NFact"),
  COUNT(*) - COUNT(DISTINCT "NFact"),
  ROUND(100.0 * (COUNT(*) - COUNT(DISTINCT "NFact")) / NULLIF(COUNT(*), 0), 2)
FROM "2009_bu02".bl
UNION ALL
SELECT 
  'Factures',
  COUNT(*),
  COUNT(DISTINCT "NFact"),
  COUNT(*) - COUNT(DISTINCT "NFact"),
  ROUND(100.0 * (COUNT(*) - COUNT(DISTINCT "NFact")) / NULLIF(COUNT(*), 0), 2)
FROM "2009_bu02".fact
UNION ALL
SELECT 
  'Proformas',
  COUNT(*),
  COUNT(DISTINCT "NFact"),
  COUNT(*) - COUNT(DISTINCT "NFact"),
  ROUND(100.0 * (COUNT(*) - COUNT(DISTINCT "NFact")) / NULLIF(COUNT(*), 0), 2)
FROM "2009_bu02".proforma;
