-- ============================================
-- CORRECTION: Déplacer les tables vers stock_management_auth
-- ============================================
-- Si les tables ont été créées dans une autre base,
-- ce script les déplace vers stock_management_auth
-- ============================================

-- S'assurer que la base existe
CREATE DATABASE IF NOT EXISTS stock_management_auth;

-- Vérifier où sont les tables actuellement
SELECT 
    TABLE_SCHEMA as base_de_donnees,
    TABLE_NAME as nom_table
FROM information_schema.TABLES 
WHERE TABLE_NAME IN ('users', 'business_units', 'user_permissions', 'system_logs')
ORDER BY TABLE_SCHEMA, TABLE_NAME;

-- Si les tables sont dans une autre base, vous devrez les déplacer manuellement
-- Exemple si elles sont dans 'autre_base':
-- RENAME TABLE autre_base.users TO stock_management_auth.users;
-- RENAME TABLE autre_base.business_units TO stock_management_auth.business_units;
-- RENAME TABLE autre_base.user_permissions TO stock_management_auth.user_permissions;
-- RENAME TABLE autre_base.system_logs TO stock_management_auth.system_logs;

-- Afficher un message
SELECT '⚠️  Vérifiez le résultat ci-dessus' as message;
SELECT 'Si les tables sont dans une autre base, décommentez et adaptez les commandes RENAME TABLE' as instruction;
