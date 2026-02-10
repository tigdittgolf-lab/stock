# ⚙️ Configuration Paramétrable - Local ou Cloud

## 🎯 Principe

Votre application est **100% paramétrable** et peut fonctionner :
- ✅ **En local** : MySQL ou PostgreSQL
- ✅ **Dans le cloud** : Supabase (PostgreSQL)

Vous choisissez via le fichier `backend/.env`

---

## 🚀 ÉTAPE 1 : Configuration MySQL Local

### A. Créer la base et la table

**Option 1 : Script automatique (Recommandé)**

```cmd
REM Windows CMD
setup-mysql-local.bat
```

```powershell
# Windows PowerShell
.\setup-mysql-local.ps1
```

**Option 2 : Manuellement**

```cmd
mysql -h localhost -P 3307 -u root < setup-mysql-local.sql
```

**Option 3 : Via MySQL Workbench**

1. Ouvrir MySQL Workbench
2. Se connecter à localhost:3307
3. Ouvrir `setup-mysql-local.sql`
4. Exécuter (⚡ Execute)

### B. Vérifier

```sql
USE stock_management;
SHOW TABLES;
DESCRIBE payments;
```

Vous devriez voir la table `payments` !

---

## 🚀 ÉTAPE 2 : Configuration PostgreSQL Local (Alternative)

Si vous préférez PostgreSQL en local :

```sql
-- Créer la base
CREATE DATABASE stock_management;

-- Se connecter
\c stock_management

-- Créer la table
-- Exécuter: backend/migrations/create_payments_table_postgresql.sql
```

---

## 🚀 ÉTAPE 3 : Configuration du fichier .env

### Configuration A : MySQL Local

```env
# backend/.env

# MySQL Local (ACTIF)
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_DATABASE=stock_management
MYSQL_USER=root
MYSQL_PASSWORD=

# PostgreSQL Local (INACTIF - commenté)
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
# POSTGRES_DATABASE=stock_management
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=postgres

# Supabase (INACTIF - commenté)
# SUPABASE_URL=https://votre-projet.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=votre-key
```

### Configuration B : PostgreSQL Local

```env
# backend/.env

# MySQL Local (INACTIF - commenté)
# MYSQL_HOST=localhost
# MYSQL_PORT=3307
# MYSQL_DATABASE=stock_management
# MYSQL_USER=root
# MYSQL_PASSWORD=

# PostgreSQL Local (ACTIF)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=stock_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Supabase (INACTIF - commenté)
# SUPABASE_URL=https://votre-projet.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=votre-key
```

### Configuration C : Supabase Cloud

```env
# backend/.env

# MySQL Local (INACTIF - commenté)
# MYSQL_HOST=localhost
# MYSQL_PORT=3307
# MYSQL_DATABASE=stock_management
# MYSQL_USER=root
# MYSQL_PASSWORD=

# PostgreSQL Local (INACTIF - commenté)
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
# POSTGRES_DATABASE=stock_management
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=postgres

# Supabase (ACTIF)
SUPABASE_URL=https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-key
```

---

## 🔧 ÉTAPE 4 : Code de l'application (Détection automatique)

L'application doit détecter automatiquement quelle base utiliser :

```javascript
// Exemple de logique de détection
function getDatabaseConfig() {
  // Priorité 1 : Supabase si configuré
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      type: 'supabase',
      client: createSupabaseClient()
    };
  }
  
  // Priorité 2 : PostgreSQL local
  if (process.env.POSTGRES_HOST) {
    return {
      type: 'postgresql',
      client: createPostgresClient()
    };
  }
  
  // Priorité 3 : MySQL local
  if (process.env.MYSQL_HOST) {
    return {
      type: 'mysql',
      client: createMySQLClient()
    };
  }
  
  throw new Error('Aucune base de données configurée !');
}
```

---

## 📊 Tableau récapitulatif

| Configuration | Base de données | Emplacement | Table payments |
|---------------|-----------------|-------------|----------------|
| **MySQL Local** | stock_management | localhost:3307 | stock_management.payments |
| **PostgreSQL Local** | stock_management | localhost:5432 | public.payments |
| **Supabase Cloud** | postgres | Cloud | public.payments |

---

## ✅ Vérification de la configuration

### Script de test

```javascript
// test-database-config.js
import * as dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

console.log('Configuration détectée:');

if (process.env.SUPABASE_URL) {
  console.log('✅ Supabase configuré');
}

if (process.env.POSTGRES_HOST) {
  console.log('✅ PostgreSQL local configuré');
}

if (process.env.MYSQL_HOST) {
  console.log('✅ MySQL local configuré');
}
```

---

## 🎯 Recommandations

### Pour le développement local
- ✅ **MySQL** : Plus simple, WAMP/XAMPP
- ✅ **PostgreSQL** : Plus proche de Supabase

### Pour la production
- ✅ **Supabase** : Scalable, backups automatiques, sécurisé

### Migration Local → Cloud
1. Exporter les données : `mysqldump` ou `pg_dump`
2. Importer dans Supabase via SQL Editor
3. Changer `.env` pour pointer vers Supabase
4. Redémarrer l'application

---

## 🚨 Important

**La table `payments` doit exister dans TOUTES les configurations !**

- MySQL local : `stock_management.payments`
- PostgreSQL local : `public.payments`
- Supabase : `public.payments`

**Structure identique partout** pour garantir la compatibilité.

---

## 📞 Prochaines étapes

1. ✅ Exécuter `setup-mysql-local.bat` ou `.ps1`
2. ✅ Vérifier que la base existe : `USE stock_management; SHOW TABLES;`
3. ✅ Configurer `backend/.env` selon votre choix
4. ✅ Tester l'application

Dites-moi quelle configuration vous voulez utiliser maintenant !
