# 🔍 Guide de Vérification MySQL

## 🎯 Objectif

Vérifier quelles bases de données existent dans votre serveur MySQL et trouver où sont stockés les paiements.

---

## 📋 Méthode 1 : Via ligne de commande (Recommandé)

### Étape 1 : Ouvrir MySQL

```cmd
mysql -h localhost -P 3307 -u root
```

Si vous avez un mot de passe :
```cmd
mysql -h localhost -P 3307 -u root -p
```

### Étape 2 : Lister toutes les bases

```sql
SHOW DATABASES;
```

**Résultat attendu :**
```
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| sys                |
| 2025_bu01          |  ← Vos bases tenant
| 2024_bu01          |
| stock_management   |  ← Base pour payments
+--------------------+
```

### Étape 3 : Chercher les bases tenant

```sql
SHOW DATABASES LIKE '%bu%';
```

Ou :
```sql
SELECT SCHEMA_NAME 
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME LIKE '%bu%' 
   OR SCHEMA_NAME LIKE '%2024%' 
   OR SCHEMA_NAME LIKE '%2025%';
```

### Étape 4 : Vérifier stock_management

```sql
-- Utiliser la base
USE stock_management;

-- Voir les tables
SHOW TABLES;

-- Chercher la table payments
SHOW TABLES LIKE 'payments';
```

Si la table existe :
```sql
-- Voir la structure
DESCRIBE payments;

-- Compter les paiements
SELECT COUNT(*) FROM payments;

-- Voir quelques exemples
SELECT * FROM payments LIMIT 5;

-- Voir par tenant
SELECT tenant_id, COUNT(*) as nb_paiements, SUM(amount) as total
FROM payments
GROUP BY tenant_id;
```

---

## 📋 Méthode 2 : Via script automatique

### Option A : Script SQL

```cmd
mysql -h localhost -P 3307 -u root < check-mysql-databases.sql
```

### Option B : Script Batch (Windows)

Double-cliquez sur `check-mysql.bat`

---

## 📋 Méthode 3 : Via outil graphique

### MySQL Workbench

1. Ouvrir MySQL Workbench
2. Créer une connexion :
   - Host: `localhost`
   - Port: `3307`
   - User: `root`
   - Password: (vide)
3. Se connecter
4. Dans le panneau de gauche, voir toutes les bases

### phpMyAdmin

1. Ouvrir phpMyAdmin (si installé)
2. Se connecter
3. Voir la liste des bases dans le panneau de gauche

### HeidiSQL

1. Ouvrir HeidiSQL
2. Créer une session :
   - Type: MySQL
   - Host: `localhost`
   - Port: `3307`
   - User: `root`
3. Se connecter
4. Voir les bases dans l'arbre à gauche

---

## 🔍 Scénarios possibles

### Scénario 1 : stock_management existe

```sql
USE stock_management;
SHOW TABLES;
```

**Si la table payments existe :**
✅ Tout est OK ! Les paiements sont dans `stock_management.payments`

**Si la table payments n'existe pas :**
❌ Il faut créer la table :
```sql
SOURCE backend/migrations/create_payments_table_mysql.sql;
```

### Scénario 2 : stock_management n'existe pas

**Option A : Créer la base**
```sql
CREATE DATABASE stock_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE stock_management;
SOURCE backend/migrations/create_payments_table_mysql.sql;
```

**Option B : Utiliser une base existante**

Si vous avez déjà une base (ex: `2025_bu01`), vous pouvez :
1. Créer la table payments dedans
2. Mettre à jour `.env` :
   ```env
   MYSQL_DATABASE=2025_bu01
   ```

### Scénario 3 : Vous utilisez PostgreSQL

Si vous ne trouvez aucune base MySQL, c'est peut-être que vous utilisez PostgreSQL !

Vérifiez avec :
```cmd
psql -h localhost -p 5432 -U postgres -l
```

---

## 🛠️ Commandes utiles

### Créer la base stock_management

```sql
CREATE DATABASE stock_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

### Créer la table payments

```sql
USE stock_management;
SOURCE backend/migrations/create_payments_table_mysql.sql;
```

Ou copiez-collez le contenu du fichier directement.

### Vérifier la configuration

```sql
-- Version MySQL
SELECT VERSION();

-- Bases de données
SHOW DATABASES;

-- Tables dans une base
USE stock_management;
SHOW TABLES;

-- Structure d'une table
DESCRIBE payments;

-- Utilisateurs MySQL
SELECT User, Host FROM mysql.user;
```

---

## 🐛 Dépannage

### Erreur : "Access denied"

```
ERROR 1045 (28000): Access denied for user 'root'@'localhost'
```

**Solution :**
1. Vérifier le mot de passe dans `.env`
2. Essayer avec mot de passe :
   ```cmd
   mysql -h localhost -P 3307 -u root -p
   ```

### Erreur : "Can't connect to MySQL server"

```
ERROR 2003 (HY000): Can't connect to MySQL server on 'localhost'
```

**Solutions :**
1. Vérifier que MySQL est démarré
2. Vérifier le port (3307 ou 3306 ?)
3. Essayer avec 127.0.0.1 au lieu de localhost

### Erreur : "Unknown database"

```
ERROR 1049 (42000): Unknown database 'stock_management'
```

**Solution :**
La base n'existe pas, créez-la :
```sql
CREATE DATABASE stock_management;
```

---

## 📊 Résumé des emplacements possibles

### Option 1 : Base centralisée (Recommandé)
```
MySQL Server
└── Database: stock_management
    └── Table: payments (avec tenant_id)
```

### Option 2 : Base par tenant
```
MySQL Server
├── Database: 2025_bu01
│   └── Table: payments
├── Database: 2024_bu01
│   └── Table: payments
└── Database: 2024_bu02
    └── Table: payments
```

### Option 3 : PostgreSQL (schémas)
```
PostgreSQL Server
└── Database: postgres
    ├── Schema: 2025_bu01
    │   └── Tables: article, client, bl, etc.
    ├── Schema: 2024_bu01
    └── Schema: public
        └── Table: payments (centralisée)
```

---

## 🎯 Prochaines étapes

1. **Exécuter** : `mysql -h localhost -P 3307 -u root`
2. **Lister** : `SHOW DATABASES;`
3. **Vérifier** : Chercher `stock_management` ou bases tenant
4. **Créer si besoin** : `CREATE DATABASE stock_management;`
5. **Créer la table** : Exécuter la migration
6. **Me dire** : Quelles bases vous avez trouvées !

---

## 📞 Besoin d'aide ?

Dites-moi :
1. Quelles bases de données vous voyez avec `SHOW DATABASES;`
2. Si vous utilisez MySQL ou PostgreSQL
3. Les erreurs que vous rencontrez

Je vous aiderai à configurer correctement ! 🚀
