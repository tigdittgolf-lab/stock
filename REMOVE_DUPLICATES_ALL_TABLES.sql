-- ============================================================================
-- SCRIPT DE SUPPRESSION DES DOUBLONS - TOUTES LES TABLES
-- ============================================================================
-- ATTENTION: Ce script supprime les doublons en gardant la ligne la plus récente
-- Exécutez d'abord les requêtes SELECT pour vérifier avant de supprimer
-- ============================================================================

-- Remplacer '2009_bu02' par votre tenant
\set tenant '2009_bu02'

-- ============================================================================
-- 1. CLIENTS - Doublons basés sur Nclient
-- ============================================================================

-- ÉTAPE 1: Voir les doublons clients
SELECT 
  "Nclient",
  COUNT(*) as nb_doublons,
  STRING_AGG("Raison_sociale", ' | ') as raisons_sociales
FROM "2009_bu02".client
GROUP BY "Nclient"
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- ÉTAPE 2: Supprimer les doublons clients (garde le plus récent basé sur C_affaire_fact + C_affaire_bl)
DELETE FROM "2009_bu02".client
WHERE ctid IN (
  SELECT ctid
  FROM (
    SELECT 
      ctid,
      ROW_NUMBER() OVER (
        PARTITION BY "Nclient" 
        ORDER BY 
          COALESCE("C_affaire_fact", 0) + COALESCE("C_affaire_bl", 0) DESC,
          ctid DESC
      ) as rn
    FROM "2009_bu02".client
  ) sub
  WHERE rn > 1
);

-- ============================================================================
-- 2. ARTICLES - Doublons basés sur Narticle
-- ============================================================================

-- ÉTAPE 1: Voir les doublons articles
SELECT 
  "Narticle",
  COUNT(*) as nb_doublons,
  STRING_AGG(designation, ' | ') as designations
FROM "2009_bu02".article
GROUP BY "Narticle"
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- ÉTAPE 2: Supprimer les doublons articles (garde le plus récent basé sur stock)
DELETE FROM "2009_bu02".article
WHERE ctid IN (
  SELECT ctid
  FROM (
    SELECT 
      ctid,
      ROW_NUMBER() OVER (
        PARTITION BY "Narticle" 
        ORDER BY 
          COALESCE(stock_f, 0) DESC,
          ctid DESC
      ) as rn
    FROM "2009_bu02".article
  ) sub
  WHERE rn > 1
);

-- ============================================================================
-- 3. FOURNISSEURS - Doublons basés sur Nfournisseur
-- ============================================================================

-- ÉTAPE 1: Voir les doublons fournisseurs
SELECT 
  "Nfournisseur",
  COUNT(*) as nb_doublons,
  STRING_AGG("Nom_fournisseur", ' | ') as noms_fournisseurs
FROM "2009_bu02".fournisseur
GROUP BY "Nfournisseur"
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- ÉTAPE 2: Supprimer les doublons fournisseurs (garde le plus récent)
DELETE FROM "2009_bu02".fournisseur
WHERE ctid IN (
  SELECT ctid
  FROM (
    SELECT 
      ctid,
      ROW_NUMBER() OVER (
        PARTITION BY "Nfournisseur" 
        ORDER BY ctid DESC
      ) as rn
    FROM "2009_bu02".fournisseur
  ) sub
  WHERE rn > 1
);

-- ============================================================================
-- 4. BONS DE LIVRAISON (BL) - Doublons basés sur NFact
-- ============================================================================

-- ÉTAPE 1: Voir les doublons BL
SELECT 
  "NFact",
  COUNT(*) as nb_doublons,
  STRING_AGG("Nclient", ' | ') as clients,
  STRING_AGG(date_bl::text, ' | ') as dates
FROM "2009_bu02".bl
GROUP BY "NFact"
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- ÉTAPE 2: Supprimer les doublons BL (garde le plus récent basé sur date_bl)
-- ATTENTION: Supprime aussi les détails associés
DO $$
DECLARE
  bl_to_delete RECORD;
BEGIN
  FOR bl_to_delete IN (
    SELECT ctid, "NFact"
    FROM (
      SELECT 
        ctid,
        "NFact",
        ROW_NUMBER() OVER (
          PARTITION BY "NFact" 
          ORDER BY 
            date_bl DESC,
            ctid DESC
        ) as rn
      FROM "2009_bu02".bl
    ) sub
    WHERE rn > 1
  )
  LOOP
    -- Supprimer les détails du BL en doublon
    DELETE FROM "2009_bu02".detail_bl 
    WHERE "NFact" = bl_to_delete."NFact" 
    AND ctid IN (
      SELECT ctid FROM "2009_bu02".detail_bl 
      WHERE "NFact" = bl_to_delete."NFact"
      LIMIT 1
    );
    
    -- Supprimer le BL en doublon
    DELETE FROM "2009_bu02".bl WHERE ctid = bl_to_delete.ctid;
  END LOOP;
END $$;

-- ============================================================================
-- 5. FACTURES - Doublons basés sur NFact
-- ============================================================================

-- ÉTAPE 1: Voir les doublons factures
SELECT 
  "NFact",
  COUNT(*) as nb_doublons,
  STRING_AGG("Nclient", ' | ') as clients,
  STRING_AGG(date_fact::text, ' | ') as dates
FROM "2009_bu02".fact
GROUP BY "NFact"
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- ÉTAPE 2: Supprimer les doublons factures (garde le plus récent basé sur date_fact)
DO $$
DECLARE
  fact_to_delete RECORD;
BEGIN
  FOR fact_to_delete IN (
    SELECT ctid, "NFact"
    FROM (
      SELECT 
        ctid,
        "NFact",
        ROW_NUMBER() OVER (
          PARTITION BY "NFact" 
          ORDER BY 
            date_fact DESC,
            ctid DESC
        ) as rn
      FROM "2009_bu02".fact
    ) sub
    WHERE rn > 1
  )
  LOOP
    -- Supprimer les détails de la facture en doublon
    DELETE FROM "2009_bu02".detail_fact 
    WHERE "NFact" = fact_to_delete."NFact" 
    AND ctid IN (
      SELECT ctid FROM "2009_bu02".detail_fact 
      WHERE "NFact" = fact_to_delete."NFact"
      LIMIT 1
    );
    
    -- Supprimer la facture en doublon
    DELETE FROM "2009_bu02".fact WHERE ctid = fact_to_delete.ctid;
  END LOOP;
END $$;

-- ============================================================================
-- 6. PROFORMAS - Doublons basés sur NFact
-- ============================================================================

-- ÉTAPE 1: Voir les doublons proformas
SELECT 
  "NFact",
  COUNT(*) as nb_doublons,
  STRING_AGG("Nclient", ' | ') as clients,
  STRING_AGG(date_proforma::text, ' | ') as dates
FROM "2009_bu02".proforma
GROUP BY "NFact"
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- ÉTAPE 2: Supprimer les doublons proformas (garde le plus récent basé sur date_proforma)
DO $$
DECLARE
  proforma_to_delete RECORD;
BEGIN
  FOR proforma_to_delete IN (
    SELECT ctid, "NFact"
    FROM (
      SELECT 
        ctid,
        "NFact",
        ROW_NUMBER() OVER (
          PARTITION BY "NFact" 
          ORDER BY 
            date_proforma DESC,
            ctid DESC
        ) as rn
      FROM "2009_bu02".proforma
    ) sub
    WHERE rn > 1
  )
  LOOP
    -- Supprimer les détails du proforma en doublon
    DELETE FROM "2009_bu02".detail_proforma 
    WHERE "NFact" = proforma_to_delete."NFact" 
    AND ctid IN (
      SELECT ctid FROM "2009_bu02".detail_proforma 
      WHERE "NFact" = proforma_to_delete."NFact"
      LIMIT 1
    );
    
    -- Supprimer le proforma en doublon
    DELETE FROM "2009_bu02".proforma WHERE ctid = proforma_to_delete.ctid;
  END LOOP;
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - Compter les lignes restantes
-- ============================================================================

SELECT 
  'Clients' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT "Nclient") as unique_keys
FROM "2009_bu02".client
UNION ALL
SELECT 
  'Articles',
  COUNT(*),
  COUNT(DISTINCT "Narticle")
FROM "2009_bu02".article
UNION ALL
SELECT 
  'Fournisseurs',
  COUNT(*),
  COUNT(DISTINCT "Nfournisseur")
FROM "2009_bu02".fournisseur
UNION ALL
SELECT 
  'BL',
  COUNT(*),
  COUNT(DISTINCT "NFact")
FROM "2009_bu02".bl
UNION ALL
SELECT 
  'Factures',
  COUNT(*),
  COUNT(DISTINCT "NFact")
FROM "2009_bu02".fact
UNION ALL
SELECT 
  'Proformas',
  COUNT(*),
  COUNT(DISTINCT "NFact")
FROM "2009_bu02".proforma;

-- ============================================================================
-- NOTES IMPORTANTES:
-- ============================================================================
-- 1. Ce script garde toujours la ligne la plus "importante" (plus récente, plus de CA, etc.)
-- 2. Pour BL/Factures/Proformas, il supprime aussi les lignes de détail associées
-- 3. Exécutez d'abord les SELECT pour voir ce qui sera supprimé
-- 4. Faites une sauvegarde avant d'exécuter les DELETE
-- 5. Si total_rows = unique_keys, il n'y a plus de doublons
-- ============================================================================
