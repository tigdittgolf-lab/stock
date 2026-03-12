-- Vérifier tous les BL du client 1051
SELECT "NFact", "Nclient", date_bl, montant_ht + "TVA" as total_ttc
FROM "2009_bu02".bl
WHERE "Nclient" = '1051'
ORDER BY date_bl DESC;

-- Vérifier tous les paiements du client 1051
SELECT 
  p.id,
  p.tenant_id,
  p.document_type,
  p.document_id,
  p.payment_date,
  p.amount,
  p.payment_method,
  p.notes,
  b."Nclient" as bl_client,
  f."Nclient" as fact_client
FROM public.payments p
LEFT JOIN "2009_bu02".bl b ON p.document_type IN ('delivery_note', 'bl') AND p.document_id = b."NFact"
LEFT JOIN "2009_bu02".fact f ON p.document_type IN ('invoice', 'facture') AND p.document_id = f."NFact"
WHERE p.tenant_id = '2009_bu02'
  AND (b."Nclient" = '1051' OR f."Nclient" = '1051')
ORDER BY p.payment_date DESC;

-- Calcul manuel
SELECT 
  'Total BL' as type,
  SUM(montant_ht + "TVA") as montant
FROM "2009_bu02".bl
WHERE "Nclient" = '1051'
UNION ALL
SELECT 
  'Total Paiements' as type,
  (SELECT COALESCE(SUM(p.amount), 0)
   FROM public.payments p
   LEFT JOIN "2009_bu02".bl b ON p.document_type IN ('delivery_note', 'bl') AND p.document_id = b."NFact"
   WHERE p.tenant_id = '2009_bu02' AND b."Nclient" = '1051') as montant;
