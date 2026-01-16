-- ============================================
-- DÉPLACER LES TABLES DE 2025_bu01 vers stock_management_auth
-- ============================================

-- S'assurer que la base de destination existe
CREATE DATABASE IF NOT EXISTS stock_management_auth;

-- Déplacer les tables
RENAME TABLE `2025_bu01`.users TO stock_management_auth.users;
RENAME TABLE `2025_bu01`.business_units TO stock_management_auth.business_units;
RENAME TABLE `2025_bu01`.user_permissions TO stock_management_auth.user_permissions;
RENAME TABLE `2025_bu01`.system_logs TO stock_management_auth.system_logs;
