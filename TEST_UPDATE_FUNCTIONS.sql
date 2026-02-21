-- Test si les fonctions UPDATE existent et fonctionnent

-- 1. Vérifier que les fonctions existent
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_client_in_tenant', 'update_supplier_in_tenant');

-- 2. Test UPDATE client (remplace '1' par un vrai ID client)
SELECT update_client_in_tenant(
    '2009_bu02',  -- tenant
    '1',          -- nclient (CHANGE THIS TO A REAL CLIENT ID)
    'TEST RAISON SOCIALE',  -- raison_sociale
    'TEST ADRESSE',         -- adresse
    'TEST CONTACT',         -- contact_person
    '0123456789',          -- tel
    'test@test',           -- email (max 10 chars!)
    0,                     -- c_affaire_fact
    0,                     -- c_affaire_bl
    '',                    -- nrc
    '',                    -- date_rc
    '',                    -- lieu_rc
    '',                    -- i_fiscal
    '',                    -- n_article
    ''                     -- commentaire
);

-- 3. Vérifier que la modification a été faite
SELECT * FROM "2009_bu02".client WHERE "Nclient" = '1' LIMIT 1;
