-- =====================================================
-- SCRIPT DE CRÉATION DES BASES DE DONNÉES LOCALES
-- =====================================================

-- =====================================================
-- MYSQL - Créer les bases de données
-- =====================================================
-- Exécuter dans MySQL en tant qu'administrateur :
-- mysql -u root -p

-- Bases de données principales
CREATE DATABASE IF NOT EXISTS stock_db;
CREATE DATABASE IF NOT EXISTS stock_local;
CREATE DATABASE IF NOT EXISTS stock_migration_mysql;
CREATE DATABASE IF NOT EXISTS test_migration_mysql;

-- Créer un utilisateur pour l'application (recommandé)
CREATE USER IF NOT EXISTS 'stock_user'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON stock_db.* TO 'stock_user'@'localhost';
GRANT ALL PRIVILEGES ON stock_local.* TO 'stock_user'@'localhost';
GRANT ALL PRIVILEGES ON stock_migration_mysql.* TO 'stock_user'@'localhost';
GRANT ALL PRIVILEGES ON test_migration_mysql.* TO 'stock_user'@'localhost';
FLUSH PRIVILEGES;

-- Vérifier les bases créées
SHOW DATABASES LIKE 'stock%';

-- =====================================================
-- POSTGRESQL - Créer les bases de données  
-- =====================================================
-- Exécuter dans PostgreSQL en tant qu'administrateur :
-- psql -U postgres

-- Bases de données principales
CREATE DATABASE stock_db;
CREATE DATABASE stock_local;
CREATE DATABASE stock_migration_postgres;
CREATE DATABASE test_migration_postgres;

-- Créer un utilisateur pour l'application (recommandé)
CREATE USER stock_user WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE stock_db TO stock_user;
GRANT ALL PRIVILEGES ON DATABASE stock_local TO stock_user;
GRANT ALL PRIVILEGES ON DATABASE stock_migration_postgres TO stock_user;
GRANT ALL PRIVILEGES ON DATABASE test_migration_postgres TO stock_user;

-- Vérifier les bases créées
\l stock*