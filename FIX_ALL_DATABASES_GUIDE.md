# 🔐 Guide de Correction - Toutes les Bases de Données

## 📊 Vue d'Ensemble

Le problème de connexion affecte **les 3 bases de données** de votre projet:
- 🐘 **PostgreSQL** (Supabase)
- 🐬 **MySQL**
- 🐘 **PostgreSQL** (Local)

Chaque base nécessite la correction de la fonction `authenticate_user`.

---

## 🎯 Scripts SQL Créés

| Base de Données | Fichier SQL | Méthode |
|----------------|-------------|---------|
| **Supabase** (PostgreSQL) | `FIX_AUTHENTICATE_USER_HASH.sql` | Manuelle (SQL Editor) |
| **MySQL** | `FIX_AUTHENTICATE_MYSQL.sql` | Auto ou Manuelle |
| **PostgreSQL** (Local) | `FIX_AUTHENTICATE_POSTGRESQL.sql` | Auto ou Manuelle |

---

## 🚀 Méthode Automatique (Recommandée)

### Exécuter le script pour toutes les bases:

```bash
node fix-all-databases.js
```

**Ce script va**:
- ✅ Tester la connexion à chaque base
- ✅ Exécuter automatiquement le script SQL (MySQL et PostgreSQL local)
- ⚠️  Afficher les instructions pour Supabase (exécution manuelle requise)
- ✅ Tester la fonction après correction

---

## 📝 Méthode Manuelle

### 1️⃣ SUPABASE (PostgreSQL Cloud)

#### Étapes:

1. **Ouvrez le SQL Editor**:
   ```
   https://supabase.com/dashboard/project/szgodrjglbpzkrksnroi/sql/new
   ```

2. **Copiez le contenu de**: `FIX_AUTHENTICATE_USER_HASH.sql`

3. **Collez dans l'éditeur SQL**

4. **Cliquez sur "Run"** (bouton vert)

5. **Vérifiez le message**:
   ```
   ✅ Fonction authenticate_user corrigée avec hash SHA-256 !
   ```

#### Test:
```sql
SELECT authenticate_user('habib', 'votre_mot_de_passe');
```

---

### 2️⃣ MYSQL

#### Option A: Via Script Node.js
```bash
node fix-all-databases.js
```

#### Option B: Via MySQL CLI
```bash
mysql -u root -p stock_management < FIX_AUTHENTICATE_MYSQL.sql
```

#### Option C: Via MySQL Workbench
1. Ouvrez MySQL Workbench
2. Connectez-vous à votre base `stock_management`
3. Ouvrez le fichier `FIX_AUTHENTICATE_MYSQL.sql`
4. Exécutez le script (⚡ Execute)

#### Test:
```sql
SELECT authenticate_user('admin', 'admin123');
```

**Résultat attendu**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    ...
  }
}
```

---

### 3️⃣ POSTGRESQL (Local)

#### Option A: Via Script Node.js
```bash
node fix-all-databases.js
```

#### Option B: Via psql CLI
```bash
psql -U postgres -d stock_management < FIX_AUTHENTICATE_POSTGRESQL.sql
```

#### Option C: Via pgAdmin
1. Ouvrez pgAdmin
2. Connectez-vous à votre serveur PostgreSQL
3. Sélectionnez la base `stock_management`
4. Ouvrez Query Tool
5. Copiez le contenu de `FIX_AUTHENTICATE_POSTGRESQL.sql`
6. Exécutez (F5)

#### Test:
```sql
SELECT authenticate_user('admin', 'admin123');
```

---

## 🔐 Détails Techniques

### Problème Commun aux 3 Bases

**Code incorrect** (comparaison hashé vs clair):
```sql
IF v_user.password_hash != p_password THEN
    -- ❌ Compare hashé avec clair = toujours faux!
```

### Solution Commune

**Code corrigé** (hash avant comparaison):

#### Supabase/PostgreSQL:
```sql
v_password_hash := encode(digest(p_password, 'sha256'), 'hex');
IF v_user.password_hash != v_password_hash THEN
```

#### MySQL:
```sql
SET v_password_hash_input = SHA2(p_password, 256);
IF v_password_hash != v_password_hash_input THEN
```

### Hash SHA-256

**Exemple**:
- Mot de passe: `test123`
- Hash SHA-256: `ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae`

**Compatibilité**:
- ✅ Même hash produit par Node.js (création utilisateur)
- ✅ Même hash produit par SQL (vérification connexion)
- ✅ Fonctionne sur les 3 bases de données

---

## 🧪 Tests Après Correction

### Test 1: Utilisateurs de Test

**Supabase**:
```sql
SELECT authenticate_user('admin', 'admin123');
SELECT authenticate_user('manager', 'manager123');
SELECT authenticate_user('user', 'user123');
```

**MySQL**:
```sql
SELECT authenticate_user('admin', 'admin123');
```

**PostgreSQL**:
```sql
SELECT authenticate_user('admin', 'admin123');
```

### Test 2: Nouvel Utilisateur (habib)

```sql
SELECT authenticate_user('habib', 'votre_mot_de_passe');
```

### Test 3: Via Application Web

1. Allez sur: https://frontend-iota-six-72.vercel.app
2. Connectez-vous avec:
   - Username: `habib`
   - Password: Le mot de passe saisi lors de la création
3. Résultat attendu: ✅ Connexion réussie

---

## 📊 Configuration des Bases

### Variables d'Environnement

Créez un fichier `.env` à la racine du projet:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=votre_password
MYSQL_DATABASE=stock_management

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=votre_password
POSTGRES_DATABASE=stock_management
```

---

## ⚠️ Dépannage

### Supabase

**Erreur**: "permission denied for function authenticate_user"
- **Solution**: Exécutez `GRANT EXECUTE ON FUNCTION authenticate_user TO anon, authenticated;`

### MySQL

**Erreur**: "ECONNREFUSED"
- **Cause**: MySQL n'est pas démarré
- **Solution**: Démarrez MySQL (`net start mysql` sur Windows)

**Erreur**: "Access denied"
- **Cause**: Identifiants incorrects
- **Solution**: Vérifiez user/password dans la configuration

### PostgreSQL

**Erreur**: "ECONNREFUSED"
- **Cause**: PostgreSQL n'est pas démarré
- **Solution**: Démarrez PostgreSQL (`net start postgresql-x64-XX` sur Windows)

**Erreur**: "password authentication failed"
- **Cause**: Mot de passe incorrect
- **Solution**: Vérifiez le mot de passe dans la configuration

---

## 📋 Checklist de Vérification

### Avant Correction
- [ ] Scripts SQL téléchargés/créés
- [ ] Connexion aux bases de données testée
- [ ] Backup des bases (recommandé)

### Pendant Correction
- [ ] **Supabase**: Script exécuté via SQL Editor
- [ ] **MySQL**: Script exécuté (auto ou manuel)
- [ ] **PostgreSQL**: Script exécuté (auto ou manuel)

### Après Correction
- [ ] Test SQL sur chaque base
- [ ] Test connexion web avec utilisateur existant
- [ ] Test connexion web avec nouvel utilisateur (habib)
- [ ] Vérification des logs (optionnel)

---

## 🎯 Résumé

### Problème
La fonction `authenticate_user` ne hashait pas le mot de passe fourni avant de le comparer avec le hash stocké.

### Solution
Hasher le mot de passe avec SHA-256 avant la comparaison dans les 3 bases de données.

### Fichiers
- `FIX_AUTHENTICATE_USER_HASH.sql` - Supabase
- `FIX_AUTHENTICATE_MYSQL.sql` - MySQL
- `FIX_AUTHENTICATE_POSTGRESQL.sql` - PostgreSQL
- `fix-all-databases.js` - Script automatique

### Résultat
✅ Les utilisateurs créés via l'admin peuvent maintenant se connecter sur les 3 bases de données.

---

## 📞 Commandes Rapides

```bash
# Exécuter la correction sur toutes les bases
node fix-all-databases.js

# Test MySQL
mysql -u root -p -e "SELECT authenticate_user('admin', 'admin123');" stock_management

# Test PostgreSQL
psql -U postgres -d stock_management -c "SELECT authenticate_user('admin', 'admin123');"

# Ouvrir le guide interactif
start fix-login-guide.html
```

---

**Date**: 15 janvier 2026  
**Status**: 🔧 SCRIPTS PRÊTS POUR LES 3 BASES DE DONNÉES
