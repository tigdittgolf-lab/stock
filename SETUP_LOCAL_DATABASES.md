# 🗄️ Configuration des Bases de Données Locales

## ❌ Problème Actuel
Vous obtenez l'erreur `Base 'stock_db' inconnue` car les bases de données locales n'existent pas encore.

## ✅ Solution Rapide

### Option 1: Script Automatique (Recommandé)
```bash
# Exécuter le script PowerShell
powershell -ExecutionPolicy Bypass -File setup-databases.ps1

# OU exécuter le script batch
setup-databases.bat
```

### Option 2: Configuration Manuelle

#### Pour MySQL:
```sql
-- Se connecter à MySQL en tant qu'administrateur
mysql -u root -p

-- Créer les bases de données
CREATE DATABASE IF NOT EXISTS stock_db;
CREATE DATABASE IF NOT EXISTS stock_local;
CREATE DATABASE IF NOT EXISTS stock_migration_mysql;

-- Créer un utilisateur (optionnel mais recommandé)
CREATE USER IF NOT EXISTS 'stock_user'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON stock_db.* TO 'stock_user'@'localhost';
GRANT ALL PRIVILEGES ON stock_local.* TO 'stock_user'@'localhost';
GRANT ALL PRIVILEGES ON stock_migration_mysql.* TO 'stock_user'@'localhost';
FLUSH PRIVILEGES;

-- Vérifier
SHOW DATABASES LIKE 'stock%';
```

#### Pour PostgreSQL:
```sql
-- Se connecter à PostgreSQL en tant qu'administrateur
psql -U postgres

-- Créer les bases de données
CREATE DATABASE stock_db;
CREATE DATABASE stock_local;
CREATE DATABASE stock_migration_postgres;

-- Créer un utilisateur (optionnel mais recommandé)
CREATE USER stock_user WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE stock_db TO stock_user;
GRANT ALL PRIVILEGES ON DATABASE stock_local TO stock_user;
GRANT ALL PRIVILEGES ON DATABASE stock_migration_postgres TO stock_user;

-- Vérifier
\l stock*
```

## 🔧 Configuration de l'Interface de Migration

Une fois les bases créées, vous pouvez utiliser l'interface web:

1. **Ouvrir l'interface**: http://localhost:3000/admin/database-migration

2. **Configuration Source** (Supabase):
   - Type: Supabase ☁️
   - URL: `https://szgodrjglbpzkrksnroi.supabase.co`
   - Clé: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (déjà configurée)

3. **Configuration Cible** (Local):
   - Type: MySQL 🐬 ou PostgreSQL 🐘
   - Host: `localhost`
   - Port: `3306` (MySQL) ou `5432` (PostgreSQL)
   - Base: `stock_db` ou `stock_local`
   - Utilisateur: `root` (MySQL) ou `postgres` (PostgreSQL)
   - Mot de passe: (votre mot de passe)

4. **Options de Migration**:
   - ✅ Inclure la structure (schémas et tables)
   - ✅ Inclure les données
   - ✅ Inclure les fonctions RPC
   - Taille des lots: 100

## 📊 Ce qui sera migré

### Tables (11 par schéma):
- `article` - Articles avec prix et stock
- `client` - Clients avec informations complètes
- `fournisseur` - Fournisseurs
- `famille_art` - Familles d'articles
- `activite` - Informations entreprise
- `bl` - Bons de livraison
- `facture` - Factures
- `proforma` - Proformas
- `detail_bl` - Détails des BL
- `detail_fact` - Détails des factures
- `detail_proforma` - Détails des proformas

### Schémas (4 tenants):
- `2025_bu01` - Business Unit 1, année 2025
- `2024_bu01` - Business Unit 1, année 2024
- `2025_bu02` - Business Unit 2, année 2025
- `2026_bu01` - Business Unit 1, année 2026

### Fonctions RPC (8 fonctions):
- `get_articles_by_tenant` - Récupérer articles par tenant
- `get_clients_by_tenant` - Récupérer clients par tenant
- `get_fournisseurs_by_tenant` - Récupérer fournisseurs par tenant
- `get_families_by_tenant` - Récupérer familles par tenant
- `get_activites_by_tenant` - Récupérer activités par tenant
- `calculate_margin` - Calculer les marges
- `get_next_number` - Numérotation séquentielle
- `update_stock` - Mise à jour du stock

## 🚀 Après la Configuration

1. **Tester la connexion** dans l'interface
2. **Lancer la migration complète**
3. **Vérifier l'intégrité** des données
4. **Utiliser votre base locale** pour les tests

## ⚠️ Notes Importantes

- La migration ne modifie **jamais** la base source (Supabase)
- Toutes les données sont **copiées** vers la base locale
- Les fonctions RPC sont **adaptées** au type de base cible
- La migration peut prendre **plusieurs minutes** selon la quantité de données

## 🆘 En cas de problème

1. Vérifiez que MySQL/PostgreSQL est **démarré**
2. Vérifiez les **permissions** utilisateur
3. Consultez les **logs** dans l'interface de migration
4. Utilisez les scripts de test de connexion

## 📞 Support

Si vous rencontrez des difficultés, les logs détaillés dans l'interface de migration vous aideront à identifier le problème exact.