# 🐬 Guide de Configuration MySQL pour la Migration

## ✅ État Actuel

- ✅ **MySQL installé** : WAMP64 avec MySQL 5.7.36
- ✅ **Service actif** : MySQL fonctionne correctement
- ✅ **Bases créées** : `stock_db`, `stock_local`, `stock_migration_mysql`
- ✅ **Connexion testée** : Root sans mot de passe fonctionne

## 🔧 Configuration dans l'Interface de Migration

### Paramètres Source (Supabase)
- **Type** : Supabase ☁️
- **URL** : `https://szgodrjglbpzkrksnroi.supabase.co`
- **Clé** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (déjà configurée)

### Paramètres Cible (MySQL) ✅
- **Type** : MySQL 🐬
- **Host** : `localhost`
- **Port** : `3306`
- **Database** : `stock_local`
- **Username** : `root`
- **Password** : *(laisser vide)*

## 🚨 Erreur Précédente Analysée

```
❌ Erreur MySQL: Accès refusé pour l'utilisateur: 'postgres'@'@localhost' (mot de passe: NON)
```

**Problème** : Le système utilisait `postgres` (utilisateur PostgreSQL) au lieu de `root` (utilisateur MySQL).

## 🎯 Solution Appliquée

1. **Détection automatique** : Script PowerShell trouve MySQL dans WAMP64
2. **Bases créées** : `stock_db`, `stock_local`, `stock_migration_mysql`
3. **Connexion testée** : Root sans mot de passe fonctionne
4. **Configuration claire** : Paramètres exacts pour l'interface

## 🚀 Étapes pour Utiliser MySQL

### 1. Ouvrir l'Interface de Migration
```
http://localhost:3001/admin/database-migration
```

### 2. Configurer la Source (Supabase)
- Type : **Supabase** ☁️
- URL et clé déjà configurées

### 3. Configurer la Cible (MySQL)
- Type : **MySQL** 🐬
- Host : `localhost`
- Port : `3306`
- Database : `stock_local`
- Username : `root`
- Password : *(laisser vide)*

### 4. Options de Migration
- ✅ Inclure la structure (schémas et tables)
- ✅ Inclure les données
- ✅ Écraser les données existantes (si nécessaire)
- Taille des lots : `100`

### 5. Lancer la Migration
Cliquer sur "▶️ Démarrer la Migration"

## 📊 Résultats Attendus

```
✅ Connexion Supabase établie
✅ Connexion MySQL établie
🔍 Insertion SQL (corrigée): INSERT INTO `2025_bu01`.article (`narticle`, `nfournisseur`, ...)
📊 Valeurs mappées: ['5062', 'EQUIPRO', ...]
✅ 55 enregistrements migrés pour 2025_bu01.article
✅ Migration terminée avec succès !
```

## 🔍 Vérification Post-Migration

### Via Interface MySQL
```sql
-- Se connecter à MySQL
C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe -u root

-- Vérifier les schémas
SHOW DATABASES LIKE '%bu%';

-- Vérifier les tables
USE `2025_bu01`;
SHOW TABLES;

-- Vérifier les données
SELECT * FROM article LIMIT 5;
SELECT * FROM client LIMIT 5;
```

### Via phpMyAdmin (si WAMP)
```
http://localhost/phpmyadmin
```

## 🛠️ Dépannage

### Si Erreur de Connexion
1. Vérifier que WAMP est démarré
2. Vérifier que MySQL est vert dans WAMP
3. Tester la connexion : `powershell -File test-mysql-simple.ps1`

### Si Erreur de Base de Données
1. Recréer les bases : `powershell -ExecutionPolicy Bypass -File setup-databases.ps1`
2. Choisir option 1 (Configurer MySQL)

### Si Erreur de Permissions
1. Utiliser `root` comme utilisateur
2. Laisser le mot de passe vide
3. Vérifier que WAMP n'a pas de restrictions

## 📁 Fichiers de Support

- ✅ `setup-databases.ps1` - Configuration automatique
- ✅ `test-mysql-simple.ps1` - Test de connexion
- ✅ `setup-mysql-databases.sql` - Script SQL direct
- ✅ `MYSQL_CONFIGURATION_GUIDE.md` - Ce guide

## 🎯 Prochaines Étapes

1. **Tester la migration MySQL** avec les paramètres corrects
2. **Comparer avec PostgreSQL** pour vérifier la cohérence
3. **Valider les fonctions RPC** dans MySQL
4. **Documenter les différences** entre MySQL et PostgreSQL

MySQL est maintenant **100% configuré et prêt** pour la migration !