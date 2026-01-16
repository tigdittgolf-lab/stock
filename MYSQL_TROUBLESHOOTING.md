# 🔧 Dépannage MySQL - Tables Manquantes

## ❌ Problème Signalé

Les tables ne sont pas dans la base `stock_management_auth` après exécution du script.

## 🔍 Diagnostic

### Étape 1: Vérifier où sont les tables

```bash
mysql -u root -p < verify-mysql-setup.sql
```

OU dans MySQL:

```sql
-- Chercher où sont les tables
SELECT 
    TABLE_SCHEMA as base_de_donnees,
    TABLE_NAME as nom_table
FROM information_schema.TABLES 
WHERE TABLE_NAME IN ('users', 'business_units', 'user_permissions', 'system_logs')
ORDER BY TABLE_SCHEMA, TABLE_NAME;
```

---

## 🎯 Causes Possibles

### Cause 1: Script exécuté dans phpMyAdmin avec une base sélectionnée

**Problème**: Si vous avez une base sélectionnée dans phpMyAdmin avant d'exécuter le script, les tables peuvent être créées dans cette base au lieu de `stock_management_auth`.

**Solution**: 
1. Supprimez les tables de la mauvaise base
2. Réexécutez le script en vous assurant qu'AUCUNE base n'est sélectionnée
3. OU exécutez via ligne de commande:

```bash
mysql -u root -p < MYSQL_COMPLETE_SYSTEM.sql
```

### Cause 2: Erreur lors de l'exécution du USE

**Problème**: Le `USE stock_management_auth;` n'a pas été exécuté.

**Solution**: Exécutez le script complet d'un coup, pas ligne par ligne.

---

## ✅ Solutions

### Solution 1: Réexécution Propre (Recommandée)

```bash
# 1. Supprimer tout et recommencer
mysql -u root -p

# Dans MySQL:
DROP DATABASE IF EXISTS stock_management_auth;
exit;

# 2. Réexécuter le script complet
mysql -u root -p < MYSQL_COMPLETE_SYSTEM.sql

# 3. Vérifier
mysql -u root -p < verify-mysql-setup.sql
```

### Solution 2: Déplacer les Tables

Si les tables existent dans une autre base (ex: `autre_base`):

```sql
-- Vérifier où elles sont
SELECT TABLE_SCHEMA, TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_NAME = 'users';

-- Déplacer vers stock_management_auth
RENAME TABLE autre_base.users TO stock_management_auth.users;
RENAME TABLE autre_base.business_units TO stock_management_auth.business_units;
RENAME TABLE autre_base.user_permissions TO stock_management_auth.user_permissions;
RENAME TABLE autre_base.system_logs TO stock_management_auth.system_logs;

-- Déplacer les fonctions et procédures (plus complexe)
-- Il faut les recréer dans la bonne base
USE stock_management_auth;
-- Puis réexécuter les sections DELIMITER $$ ... $$ du script
```

### Solution 3: Script de Réparation

```bash
mysql -u root -p < MYSQL_FIX_TABLES_LOCATION.sql
```

Suivez les instructions affichées.

---

## 📋 Vérification Finale

Après correction, vérifiez que tout est OK:

```sql
USE stock_management_auth;

-- Vérifier les tables
SHOW TABLES;
-- Devrait afficher: users, business_units, user_permissions, system_logs

-- Vérifier les utilisateurs
SELECT * FROM users;
-- Devrait afficher au moins l'utilisateur 'admin'

-- Tester l'authentification
SELECT authenticate_user('admin', 'admin123');
-- Devrait retourner un JSON avec success: true
```

---

## 🎯 Pour Éviter le Problème

### Méthode 1: Ligne de Commande (Recommandée)

```bash
mysql -u root -p < MYSQL_COMPLETE_SYSTEM.sql
```

**Avantages**:
- ✅ Exécute tout le script d'un coup
- ✅ Respecte le `USE stock_management_auth;`
- ✅ Pas d'interférence avec phpMyAdmin

### Méthode 2: phpMyAdmin (Avec Précautions)

1. **NE PAS** sélectionner de base de données dans le menu de gauche
2. Aller dans l'onglet "SQL" en haut
3. Coller tout le script
4. Cliquer "Exécuter"

**Important**: Ne pas exécuter ligne par ligne!

---

## 🔍 Commandes de Diagnostic

```sql
-- Où est la base?
SHOW DATABASES LIKE 'stock_management_auth';

-- Quelles tables dans cette base?
USE stock_management_auth;
SHOW TABLES;

-- Où sont mes tables 'users'?
SELECT TABLE_SCHEMA, TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_NAME = 'users';

-- Quelles fonctions dans cette base?
SHOW FUNCTION STATUS WHERE Db = 'stock_management_auth';

-- Quelles procédures dans cette base?
SHOW PROCEDURE STATUS WHERE Db = 'stock_management_auth';
```

---

## 📞 Scripts Utiles

1. **verify-mysql-setup.sql** - Vérifier l'installation
2. **MYSQL_FIX_TABLES_LOCATION.sql** - Trouver où sont les tables
3. **MYSQL_COMPLETE_SYSTEM.sql** - Script d'installation complet

---

## ✅ Résultat Attendu

Après correction, vous devriez avoir:

```
stock_management_auth/
├── Tables:
│   ├── users (avec admin)
│   ├── business_units (4 BU)
│   ├── user_permissions
│   └── system_logs
├── Fonctions:
│   └── authenticate_user
└── Procédures:
    ├── create_user
    ├── update_user
    └── delete_user
```

---

**Date**: 15 janvier 2026  
**Status**: 🔧 GUIDE DE DÉPANNAGE CRÉÉ
