# 🎯 SYSTÈME D'AUTHENTIFICATION AUTONOME COMPLET

## ✅ STATUT: IMPLÉMENTÉ ET DÉPLOYÉ

Ce document décrit le système d'authentification autonome pour les trois bases de données.

---

## 📊 ARCHITECTURE

Chaque base de données (MySQL, PostgreSQL, Supabase) possède son propre système d'authentification **COMPLÈTEMENT INDÉPENDANT**.

### Principe d'Autonomie
- ✅ Chaque base peut fonctionner seule
- ✅ Aucune dépendance entre les bases
- ✅ Même structure de données
- ✅ Même algorithme de hachage (SHA-256)
- ✅ API backend dédiée pour chaque base

---

## 🗄️ MYSQL - stock_management_auth

### Base de Données
```
Database: stock_management_auth
Port: 3307 (WAMP)
```

### Tables
1. **users** - Utilisateurs du système
2. **business_units** - Unités commerciales (BU)
3. **user_permissions** - Permissions par module
4. **system_logs** - Logs d'activité

### Fonctions et Procédures
- `authenticate_user(username, password)` - Authentification avec SHA-256
- `create_user(...)` - Création d'utilisateur
- `update_user(...)` - Mise à jour d'utilisateur
- `delete_user(user_id)` - Suppression d'utilisateur

### API Backend
```
POST   /api/auth-mysql/login
GET    /api/auth-mysql/users
POST   /api/auth-mysql/users
GET    /api/auth-mysql/users/:id
PUT    /api/auth-mysql/users/:id
DELETE /api/auth-mysql/users/:id
```

### Utilisateur par Défaut
```
Username: admin
Password: admin123
Role: admin
```

---

## 🐘 POSTGRESQL - public schema

### Base de Données
```
Database: postgres
Schema: public
Port: 5432
```

### Tables
1. **users** - Utilisateurs du système
2. **business_units** - Unités commerciales (BU)
3. **user_permissions** - Permissions par module
4. **system_logs** - Logs d'activité

### Fonctions
- `authenticate_user(username, password)` - Authentification avec SHA-256
- `create_user(...)` - Création d'utilisateur
- `update_user(...)` - Mise à jour d'utilisateur
- `delete_user(user_id)` - Suppression d'utilisateur

### API Backend
```
POST   /api/auth-postgresql/login
GET    /api/auth-postgresql/users
POST   /api/auth-postgresql/users
GET    /api/auth-postgresql/users/:id
PUT    /api/auth-postgresql/users/:id
DELETE /api/auth-postgresql/users/:id
```

### Utilisateur par Défaut
```
Username: admin
Password: admin123
Role: admin
```

---

## ☁️ SUPABASE - public schema

### Base de Données
```
Project: Supabase Cloud
Schema: public
```

### Tables
1. **users** - Utilisateurs du système
2. **business_units** - Unités commerciales (BU)
3. **user_permissions** - Permissions par module
4. **system_logs** - Logs d'activité

### Fonctions RPC
- `authenticate_user(p_username, p_password)` - Authentification avec SHA-256

### API Backend
```
POST   /api/auth-real/login (utilise Supabase)
GET    /api/admin/users (multi-DB avec Supabase)
POST   /api/admin/users (multi-DB avec Supabase)
GET    /api/admin/users/:id (multi-DB avec Supabase)
PUT    /api/admin/users/:id (multi-DB avec Supabase)
DELETE /api/admin/users/:id (multi-DB avec Supabase)
```

### Utilisateur par Défaut
```
Username: admin
Password: admin123
Role: admin
```

---

## 🔐 SÉCURITÉ

### Hachage des Mots de Passe
- **Algorithme**: SHA-256
- **Implémentation**: Identique sur les 3 bases
- **Format**: Hexadécimal (64 caractères)

### Exemple
```javascript
// JavaScript/TypeScript
const hash = crypto.createHash('sha256').update(password).digest('hex');

// MySQL
SHA2(password, 256)

// PostgreSQL
encode(digest(password, 'sha256'), 'hex')
```

---

## 📝 STRUCTURE DES DONNÉES

### Table users
```sql
CREATE TABLE users (
    id INT/SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(191) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    business_units JSON/JSONB,
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Rôles Disponibles
- **admin** - Accès complet
- **manager** - Gestion opérationnelle
- **user** - Utilisateur standard

### Business Units
Format JSON:
```json
["bu01_2024", "bu02_2024", "bu01_2025", "bu02_2025"]
```

---

## 🚀 UTILISATION

### 1. Connexion avec MySQL
```bash
# Frontend appelle
POST http://localhost:3005/api/auth-mysql/login
{
  "username": "admin",
  "password": "admin123"
}
```

### 2. Connexion avec PostgreSQL
```bash
# Frontend appelle
POST http://localhost:3005/api/auth-postgresql/login
{
  "username": "admin",
  "password": "admin123"
}
```

### 3. Connexion avec Supabase
```bash
# Frontend appelle
POST http://localhost:3005/api/auth-real/login
{
  "username": "admin",
  "password": "admin123"
}
```

---

## 🔧 CONFIGURATION

### Variables d'Environnement Backend

#### MySQL
```env
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=root
MYSQL_PASSWORD=
```

#### PostgreSQL
```env
POSTGRESQL_HOST=localhost
POSTGRESQL_PORT=5432
POSTGRESQL_USER=postgres
POSTGRESQL_PASSWORD=postgres
```

#### Supabase
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 📦 FICHIERS CRÉÉS

### Scripts SQL
- `MYSQL_COMPLETE_SYSTEM.sql` - Système MySQL complet
- `MYSQL_MOVE_TABLES_FROM_2025_BU01.sql` - Migration MySQL
- `POSTGRESQL_COMPLETE_SYSTEM.sql` - Système PostgreSQL complet
- `FIX_AUTHENTICATE_USER_HASH.sql` - Fix Supabase

### Scripts d'Exécution
- `execute-mysql-migration.bat` - Migration MySQL (CMD)
- `execute-mysql-migration.ps1` - Migration MySQL (PowerShell)
- `verify-mysql-setup.sql` - Vérification MySQL

### Backend Routes
- `backend/src/routes/auth-mysql.ts` - API MySQL
- `backend/src/routes/auth-postgresql.ts` - API PostgreSQL
- `backend/src/routes/auth-real.ts` - API Supabase (existant)
- `backend/src/routes/adminUsers.ts` - API Admin multi-DB (existant)

### Frontend
- `frontend/app/admin/users/page.tsx` - Interface admin utilisateurs
- `frontend/app/api/admin/users/route.ts` - API Next.js multi-DB
- `frontend/app/api/admin/users/[id]/route.ts` - API Next.js par ID

---

## ✅ TESTS

### Test MySQL
```bash
# Dans MySQL Workbench ou ligne de commande
USE stock_management_auth;
SELECT authenticate_user('admin', 'admin123');
```

### Test PostgreSQL
```bash
# Dans pgAdmin ou psql
SELECT authenticate_user('admin', 'admin123');
```

### Test Supabase
```bash
# Dans Supabase SQL Editor
SELECT authenticate_user('admin', 'admin123');
```

---

## 🎉 RÉSULTAT

Vous avez maintenant **3 systèmes d'authentification complètement autonomes**:

1. ✅ **MySQL** - Base locale WAMP avec `stock_management_auth`
2. ✅ **PostgreSQL** - Base locale avec schéma `public`
3. ✅ **Supabase** - Base cloud avec schéma `public`

Chaque système peut fonctionner **indépendamment** des autres!

---

## 📞 SUPPORT

En cas de problème:
1. Vérifier les logs backend
2. Tester la connexion à la base de données
3. Vérifier que les fonctions/procédures existent
4. Tester l'authentification directement en SQL

---

**Date de création**: 2025-01-16
**Statut**: ✅ Opérationnel
**Version**: 1.0.0
