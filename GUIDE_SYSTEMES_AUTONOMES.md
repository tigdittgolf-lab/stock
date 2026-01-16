# 🎯 Guide des Systèmes Autonomes

## ✅ VOTRE VISION RESPECTÉE

Chaque base de données fonctionne **COMPLÈTEMENT SEULE**:
- MySQL → Système complet autonome
- PostgreSQL → Système complet autonome
- Supabase → Système complet autonome

**AUCUNE DÉPENDANCE** entre les bases!

---

## 📦 Installation des Systèmes

### 1️⃣ MySQL - Système Autonome

#### Installation:
```bash
mysql -u root -p < MYSQL_COMPLETE_SYSTEM.sql
```

#### Ce qui est créé:
- ✅ Base: `stock_management_auth`
- ✅ Table: `users` (avec password_hash)
- ✅ Table: `business_units`
- ✅ Table: `user_permissions`
- ✅ Table: `system_logs`
- ✅ Fonction: `authenticate_user(username, password)`
- ✅ Procédure: `create_user(...)`
- ✅ Procédure: `update_user(...)`
- ✅ Procédure: `delete_user(...)`
- ✅ Utilisateur admin: admin / admin123

#### Test:
```sql
USE stock_management_auth;
SELECT authenticate_user('admin', 'admin123');
```

---

### 2️⃣ PostgreSQL - Système Autonome

#### Installation:
```bash
psql -U postgres -d stock_management < POSTGRESQL_COMPLETE_SYSTEM.sql
```

#### Ce qui est créé:
- ✅ Schema: `public`
- ✅ Table: `users` (avec password_hash)
- ✅ Table: `business_units`
- ✅ Table: `user_permissions`
- ✅ Table: `system_logs`
- ✅ Fonction: `authenticate_user(username, password)`
- ✅ Fonction: `create_user(...)`
- ✅ Fonction: `update_user(...)`
- ✅ Fonction: `delete_user(...)`
- ✅ Utilisateur admin: admin / admin123

#### Test:
```sql
SELECT authenticate_user('admin', 'admin123');
```

---

### 3️⃣ Supabase - Système Autonome

#### Installation:
Déjà fait! ✅ (via `FIX_AUTHENTICATE_USER_HASH.sql`)

#### Ce qui existe:
- ✅ Table: `users` (avec password_hash)
- ✅ Table: `business_units`
- ✅ Table: `user_permissions`
- ✅ Table: `system_logs`
- ✅ Fonction: `authenticate_user(username, password)` - CORRIGÉE ✅

#### Test:
```sql
SELECT authenticate_user('admin', 'admin123');
```

---

## 👤 Gestion des Utilisateurs

### MySQL

#### Créer un utilisateur:
```sql
USE stock_management_auth;

CALL create_user(
    'habib',                                    -- username
    'habib@example.com',                        -- email
    'mon_mot_de_passe',                         -- password
    'Habib Belkacemi',                          -- full_name
    'manager',                                  -- role
    JSON_ARRAY('bu01_2024', 'bu02_2024')       -- business_units
);
```

#### Modifier un utilisateur:
```sql
CALL update_user(
    2,                                          -- user_id
    'habib',                                    -- username
    'habib@example.com',                        -- email
    'nouveau_mot_de_passe',                     -- password (NULL si pas de changement)
    'Habib Belkacemi',                          -- full_name
    'admin',                                    -- role
    JSON_ARRAY('bu01_2024', 'bu02_2024', 'bu01_2025'), -- business_units
    TRUE                                        -- active
);
```

#### Supprimer un utilisateur:
```sql
CALL delete_user(2); -- user_id
```

#### Lister les utilisateurs:
```sql
SELECT id, username, email, role, business_units, active 
FROM users 
ORDER BY created_at DESC;
```

---

### PostgreSQL

#### Créer un utilisateur:
```sql
SELECT create_user(
    'habib',                                    -- username
    'habib@example.com',                        -- email
    'mon_mot_de_passe',                         -- password
    'Habib Belkacemi',                          -- full_name
    'manager',                                  -- role
    ARRAY['bu01_2024', 'bu02_2024']            -- business_units
);
```

#### Modifier un utilisateur:
```sql
SELECT update_user(
    2,                                          -- user_id
    'habib',                                    -- username
    'habib@example.com',                        -- email
    'nouveau_mot_de_passe',                     -- password (NULL si pas de changement)
    'Habib Belkacemi',                          -- full_name
    'admin',                                    -- role
    ARRAY['bu01_2024', 'bu02_2024', 'bu01_2025'], -- business_units
    TRUE                                        -- active
);
```

#### Supprimer un utilisateur:
```sql
SELECT delete_user(2); -- user_id
```

#### Lister les utilisateurs:
```sql
SELECT id, username, email, role, business_units, active 
FROM public.users 
ORDER BY created_at DESC;
```

---

### Supabase

#### Créer un utilisateur:
Via l'interface admin: https://frontend-iota-six-72.vercel.app/admin/users

Ou via SQL:
```sql
INSERT INTO public.users (
    username, email, password_hash, full_name, role, business_units, active
) VALUES (
    'habib',
    'habib@example.com',
    encode(digest('mon_mot_de_passe', 'sha256'), 'hex'),
    'Habib Belkacemi',
    'manager',
    ARRAY['bu01_2024', 'bu02_2024'],
    true
);
```

#### Modifier un utilisateur:
```sql
UPDATE public.users 
SET 
    role = 'admin',
    business_units = ARRAY['bu01_2024', 'bu02_2024', 'bu01_2025'],
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'habib';
```

#### Supprimer un utilisateur:
```sql
DELETE FROM public.users WHERE username = 'habib';
```

---

## 🔄 Scénarios d'Utilisation

### Scénario 1: Travail avec MySQL SEUL

```
1. Installer MYSQL_COMPLETE_SYSTEM.sql
2. Créer des utilisateurs dans MySQL
3. Configurer l'application pour utiliser MySQL
4. Les utilisateurs se connectent via MySQL
5. Accès aux bases MySQL (bu01_2024, bu02_2024, etc.)
6. AUCUNE connexion à Supabase ou PostgreSQL
```

### Scénario 2: Travail avec PostgreSQL SEUL

```
1. Installer POSTGRESQL_COMPLETE_SYSTEM.sql
2. Créer des utilisateurs dans PostgreSQL
3. Configurer l'application pour utiliser PostgreSQL
4. Les utilisateurs se connectent via PostgreSQL
5. Accès aux schémas PostgreSQL (bu01_2024, bu02_2024, etc.)
6. AUCUNE connexion à Supabase ou MySQL
```

### Scénario 3: Travail avec Supabase SEUL

```
1. Utiliser le système Supabase existant (déjà configuré)
2. Créer des utilisateurs dans Supabase
3. Configurer l'application pour utiliser Supabase
4. Les utilisateurs se connectent via Supabase
5. Accès aux schémas Supabase (bu01_2024, bu02_2024, etc.)
6. AUCUNE connexion à MySQL ou PostgreSQL
```

---

## 🔐 Sécurité

### Hash SHA-256
Toutes les bases utilisent le même algorithme:
- MySQL: `SHA2(password, 256)`
- PostgreSQL: `encode(digest(password, 'sha256'), 'hex')`
- Supabase: `encode(digest(password, 'sha256'), 'hex')`

**Résultat**: Le même mot de passe produit le même hash sur les 3 bases!

### Exemple:
```
Mot de passe: admin123
Hash SHA-256: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
```

---

## 📊 Structure des Business Units

### MySQL:
```
MySQL Server
├── stock_management_auth (authentification)
│   └── users, business_units, etc.
├── bu01_2024 (données métier)
├── bu02_2024 (données métier)
└── bu01_2025 (données métier)
```

### PostgreSQL:
```
PostgreSQL Server
└── stock_management
    ├── public (authentification)
    │   └── users, business_units, etc.
    ├── bu01_2024 (données métier)
    ├── bu02_2024 (données métier)
    └── bu01_2025 (données métier)
```

### Supabase:
```
Supabase
├── public (authentification)
│   └── users, business_units, etc.
├── bu01_2024 (données métier)
├── bu02_2024 (données métier)
└── bu01_2025 (données métier)
```

---

## 🎯 Résumé

### ✅ Ce Qui Est Fait

1. **MySQL**: Système complet autonome créé
2. **PostgreSQL**: Système complet autonome créé
3. **Supabase**: Système complet autonome (déjà existant, corrigé)

### ✅ Ce Que Vous Pouvez Faire

1. Choisir MySQL → Tout fonctionne avec MySQL seul
2. Choisir PostgreSQL → Tout fonctionne avec PostgreSQL seul
3. Choisir Supabase → Tout fonctionne avec Supabase seul
4. **AUCUNE dépendance** entre les bases

### ✅ Autonomie Complète

- Créer des utilisateurs dans la base choisie
- Gérer les accès dans la base choisie
- Authentification dans la base choisie
- Données métier dans la base choisie
- **100% autonome!**

---

**Date**: 15 janvier 2026  
**Status**: ✅ SYSTÈMES AUTONOMES CRÉÉS - VOTRE VISION RESPECTÉE
