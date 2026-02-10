-- =====================================================
-- Script de vérification des bases de données MySQL
-- =====================================================

-- 1. Lister toutes les bases de données
SELECT '═══════════════════════════════════════════════════════' AS '';
SELECT '📊 TOUTES LES BASES DE DONNÉES' AS '';
SELECT '═══════════════════════════════════════════════════════' AS '';
SELECT '' AS '';

SHOW DATABASES;

SELECT '' AS '';
SELECT '═══════════════════════════════════════════════════════' AS '';
SELECT '🔍 BASES DE DONNÉES TENANT (contenant "bu", "2024" ou "2025")' AS '';
SELECT '═══════════════════════════════════════════════════════' AS '';
SELECT '' AS '';

-- 2. Chercher les bases tenant
SELECT SCHEMA_NAME as 'Base de données tenant'
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME LIKE '%bu%'
   OR SCHEMA_NAME LIKE '%2024%'
   OR SCHEMA_NAME LIKE '%2025%';

SELECT '' AS '';
SELECT '═══════════════════════════════════════════════════════' AS '';
SELECT '🔍 RECHERCHE DE "stock_management"' AS '';
SELECT '═══════════════════════════════════════════════════════' AS '';
SELECT '' AS '';

-- 3. Chercher stock_management
SELECT SCHEMA_NAME as 'Base trouvée'
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME LIKE '%stock%';

SELECT '' AS '';
SELECT '═══════════════════════════════════════════════════════' AS '';
SELECT '📋 INSTRUCTIONS' AS '';
SELECT '═══════════════════════════════════════════════════════' AS '';
SELECT '' AS '';
SELECT 'Si "stock_management" n\'existe pas, créez-la avec:' AS '';
SELECT 'CREATE DATABASE stock_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;' AS '';
SELECT '' AS '';
SELECT 'Ensuite, pour voir les tables:' AS '';
SELECT 'USE stock_management;' AS '';
SELECT 'SHOW TABLES;' AS '';
