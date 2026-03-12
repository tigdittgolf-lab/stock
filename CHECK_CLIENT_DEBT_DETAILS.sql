-- Vérifier les détails pour un client spécifique
-- Remplace '1051' par le code du client que tu veux vérifier

-- 1. Informations client de base
SELECT 
  "Nclient",
  "Raison_sociale",
  "C_affaire_fact",
  "C_affaire_bl"
FROM "2009_bu02".client
WHERE "Nclient" = '1051';

-- 2. Total des factures pour ce client
SELECT 
  "Nclient",
  COUNT(*) as nb_factures,
  SUM(montant_ht + "TVA") as total_factures_ttc
FROM "2009_bu02".fact
WHERE "Nclient" = '1051'
GROUP BY "Nclient";

-- 3. Total des BL pour ce client (TOUS les BL, pas seulement facturés)
SELECT 
  "Nclient",
  COUNT(*) as nb_bl,
  SUM(montant_ht + "TVA") as total_bl_ttc
FROM "2009_bu02".bl
WHERE "Nclient" = '1051'
GROUP BY "Nclient";

-- 4. Liste des factures de ce client avec leurs numéros
SELECT 
  "NFact",
  "Nclient",
  date_fact,
  montant_ht + "TVA" as total_ttc
FROM "2009_bu02".fact
WHERE "Nclient" = '1051'
ORDER BY "NFact";

-- 5. Liste des BL de ce client avec leurs numéros
SELECT 
  "NFact",
  "Nclient",
  date_fact,
  montant_ht + "TVA" as total_ttc
FROM "2009_bu02".bl
WHERE "Nclient" = '1051'
ORDER BY "NFact";

-- 6. Tous les paiements pour ce tenant (pour voir la structure)
SELECT 
  id,
  tenant_id,
  document_type,
  document_id,
  payment_date,
  amount,
  payment_method,
  notes
FROM public.payments
WHERE tenant_id = '2009_bu02'
ORDER BY payment_date DESC
LIMIT 20;

