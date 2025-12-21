-- Vérifier les VRAIES données BL dans la base de données

-- Test 1: Voir TOUS les BL avec leurs vrais clients
SELECT 
  nfact as "N° BL",
  nclient as "Code Client",
  date_fact as "Date",
  montant_ht as "Montant HT",
  tva as "TVA",
  created_at as "Créé le"
FROM "2025_bu01".bl 
ORDER BY nfact;

-- Test 2: Compter combien de BL il y a vraiment
SELECT 'Total BL' as info, COUNT(*) as count FROM "2025_bu01".bl;

-- Test 3: Voir les clients qui existent vraiment
SELECT 
  nclient as "Code Client",
  raison_sociale as "Nom Client"
FROM "2025_bu01".client 
ORDER BY nclient;