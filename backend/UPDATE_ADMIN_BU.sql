-- =====================================================
-- MISE À JOUR : Assigner toutes les BU à l'admin
-- =====================================================

-- Vérifier les BU actuelles de l'admin
SELECT username, business_units 
FROM public.users 
WHERE username = 'admin';

-- Mettre à jour l'admin pour avoir accès à toutes les BU
UPDATE public.users
SET business_units = ARRAY['2025_bu01', '2024_bu01', '2025_bu02']
WHERE username = 'admin';

-- Vérifier la mise à jour
SELECT username, business_units 
FROM public.users 
WHERE username = 'admin';

-- Afficher toutes les BU disponibles dans la base
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name ~ '^\d{4}_bu\d{2}$'
ORDER BY schema_name;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Admin mis à jour avec toutes les Business Units';
    RAISE NOTICE '📝 L''admin a maintenant accès à: 2025_bu01, 2024_bu01, 2025_bu02';
END $$;
