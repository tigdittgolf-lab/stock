-- =====================================================================
-- Utilisateur admin par défaut pour le mode offline
-- =====================================================================
-- À exécuter APRÈS schema-mysql.sql
-- Crée un compte admin permettant la première connexion.
--
-- Identifiants par défaut (À CHANGER après la première connexion !) :
--   Utilisateur : admin
--   Mot de passe : admin123
--
-- Le mot de passe est stocké en SHA-256 (compatible avec auth-mysql.ts).
-- =====================================================================

USE `stock_management_auth`;

-- Hash SHA-256 de "admin123" (en minuscules hex)
-- Valeur : 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
INSERT IGNORE INTO `users` (`username`, `password_hash`, `profil`, `has_login`, `activite`, `code_activite`)
VALUES (
  'admin',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'ADMIN',
  1,
  '2025_bu01',
  'BU01'
);

-- Aussi côté métier (table user_info du tenant)
USE `2025_bu01`;

INSERT IGNORE INTO `user_info` (`username`, `pass_word`, `profil`, `has_login`, `activite`, `code_activite`)
VALUES (
  'admin',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'ADMIN',
  1,
  '2025_bu01',
  'BU01'
);

-- =====================================================================
-- IMPORTANT : Sécurité
-- Après installation, connectez-vous et changez immédiatement le mot de
-- passe via l'écran "Mon profil" ou "Paramètres > Utilisateurs".
-- =====================================================================
