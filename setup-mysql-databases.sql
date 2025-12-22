-- =====================================================
-- MYSQL - Créer les bases de données pour la migration
-- =====================================================

-- Créer les bases de données
CREATE DATABASE IF NOT EXISTS stock_db;
CREATE DATABASE IF NOT EXISTS stock_local;
CREATE DATABASE IF NOT EXISTS stock_migration_mysql;

-- Afficher les bases créées
SHOW DATABASES LIKE 'stock%';

-- Créer un utilisateur pour l'application (optionnel)
-- CREATE USER IF NOT EXISTS 'stock_user'@'localhost' IDENTIFIED BY 'password123';
-- GRANT ALL PRIVILEGES ON stock_db.* TO 'stock_user'@'localhost';
-- GRANT ALL PRIVILEGES ON stock_local.* TO 'stock_user'@'localhost';
-- GRANT ALL PRIVILEGES ON stock_migration_mysql.* TO 'stock_user'@'localhost';
-- FLUSH PRIVILEGES;
