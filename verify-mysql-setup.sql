-- ============================================
-- VÉRIFICATION DU SYSTÈME MYSQL
-- ============================================

-- Vérifier que la base existe
SELECT 'Vérification de la base de données...' as step;
SHOW DATABASES LIKE 'stock_management_auth';

-- Se connecter à la base
USE stock_management_auth;

-- Vérifier les tables
SELECT 'Tables dans stock_management_auth:' as info;
SHOW TABLES;

-- Vérifier la table users
SELECT 'Structure de la table users:' as info;
DESCRIBE users;

-- Compter les utilisateurs
SELECT 'Nombre d''utilisateurs:' as info;
SELECT COUNT(*) as total_users FROM users;

-- Lister les utilisateurs
SELECT 'Liste des utilisateurs:' as info;
SELECT id, username, email, role, active FROM users;

-- Vérifier les fonctions
SELECT 'Fonctions disponibles:' as info;
SHOW FUNCTION STATUS WHERE Db = 'stock_management_auth';

-- Vérifier les procédures
SELECT 'Procédures disponibles:' as info;
SHOW PROCEDURE STATUS WHERE Db = 'stock_management_auth';

-- Test de la fonction authenticate_user
SELECT 'Test de authenticate_user:' as info;
SELECT authenticate_user('admin', 'admin123') as test_result;
