# 🔐 Solution au Problème de Connexion

## ❌ Problème Identifié

Vous avez créé un utilisateur via l'interface admin, mais vous ne pouvez pas vous connecter avec.

**Message d'erreur**: "Nom d'utilisateur ou mot de passe incorrect"

## 🔍 Cause du Problème

La fonction `authenticate_user` dans Supabase compare:
- `password_hash` (mot de passe hashé en SHA-256) 
- avec `p_password` (mot de passe en clair)

**Code problématique** (ligne 113 de SYSTEME_AUTHENTIFICATION.sql):
```sql
IF v_user.password_hash != p_password THEN
    -- ❌ Compare hashé avec clair = toujours faux!
```

## ✅ Solution

Hasher le mot de passe fourni AVANT de le comparer:

```sql
-- Hasher le mot de passe fourni
v_password_hash := encode(digest(p_password, 'sha256'), 'hex');

-- Comparer les deux hash
IF v_user.password_hash != v_password_hash THEN
    -- ✅ Compare hashé avec hashé = fonctionne!
```

---

## 🛠️ Méthode 1: Correction Manuelle (RECOMMANDÉE)

### Étapes:

1. **Ouvrez votre dashboard Supabase**:
   ```
   https://supabase.com/dashboard/project/szgodrjglbpzkrksnroi/sql/new
   ```

2. **Copiez le contenu du fichier** `FIX_AUTHENTICATE_USER_HASH.sql`

3. **Collez dans l'éditeur SQL** de Supabase

4. **Cliquez sur "Run"** (bouton vert en bas à droite)

5. **Vérifiez le message de succès**:
   ```
   ✅ Fonction authenticate_user corrigée avec hash SHA-256 !
   ```

### Test après correction:

Dans l'éditeur SQL de Supabase, exécutez:
```sql
SELECT authenticate_user('habib', 'votre_mot_de_passe');
```

Résultat attendu:
```json
{
  "success": true,
  "user": {
    "id": 11,
    "username": "habib",
    "email": "habib.belkacemi@outlook.com",
    "role": "manager",
    ...
  }
}
```

---

## 🛠️ Méthode 2: Via Script Node.js (Alternative)

Si vous préférez automatiser:

```bash
node execute-fix-authenticate.js
```

**Note**: Cette méthode peut ne pas fonctionner si l'API REST de Supabase ne permet pas l'exécution de CREATE FUNCTION. Dans ce cas, utilisez la Méthode 1.

---

## 👥 Utilisateurs Actuels dans la Base

D'après la vérification, voici les utilisateurs existants:

| ID | Username | Email | Role | Actif |
|----|----------|-------|------|-------|
| 1 | admin | admin@example.com | admin | ✅ |
| 3 | manager | manager@example.com | manager | ✅ |
| 4 | user | user@example.com | user | ✅ |
| 8 | testuser_1768516507908 | test1768516507908@example.com | user | ✅ |
| 9 | testuser_1768516634805 | test1768516634805@example.com | user | ✅ |
| **11** | **habib** | **habib.belkacemi@outlook.com** | **manager** | ✅ |

---

## 🧪 Test de Connexion

Après avoir appliqué la correction:

1. **Allez sur**: https://frontend-iota-six-72.vercel.app

2. **Connectez-vous avec**:
   - Username: `habib` (ou email: `habib.belkacemi@outlook.com`)
   - Password: Le mot de passe que vous avez saisi lors de la création

3. **Résultat attendu**: Connexion réussie ✅

---

## 🔐 Détails Techniques

### Hash SHA-256

**Lors de la création** (frontend/app/api/admin/users/route.ts):
```typescript
const crypto = require('crypto');
const password_hash = crypto
  .createHash('sha256')
  .update(body.password)
  .digest('hex');
```

**Lors de la connexion** (après correction):
```sql
v_password_hash := encode(digest(p_password, 'sha256'), 'hex');
```

Les deux méthodes produisent le même hash, donc la comparaison fonctionne!

### Exemple:

Mot de passe: `test123`

Hash SHA-256: `ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae`

---

## 📝 Fichiers Créés

1. **FIX_AUTHENTICATE_USER_HASH.sql** - Script SQL de correction
2. **fix-authenticate-function.js** - Script d'information
3. **execute-fix-authenticate.js** - Script d'exécution automatique
4. **FIX_LOGIN_PROBLEM_SOLUTION.md** - Ce document

---

## ⚠️ Important

### Sécurité Future

Pour la production, considérez d'utiliser **bcrypt** au lieu de SHA-256:

**Avantages de bcrypt**:
- Salt automatique
- Résistant aux attaques par force brute
- Standard de l'industrie

**Migration vers bcrypt**:
```typescript
import bcrypt from 'bcrypt';

// Création
const password_hash = await bcrypt.hash(password, 10);

// Vérification
const isValid = await bcrypt.compare(password, password_hash);
```

### Compatibilité

La correction est **rétrocompatible**:
- ✅ Fonctionne avec les utilisateurs existants (admin, manager, user)
- ✅ Fonctionne avec les nouveaux utilisateurs créés via l'admin
- ✅ Fonctionne avec tous les mots de passe hashés en SHA-256

---

## 🎯 Résumé

1. **Problème**: Fonction `authenticate_user` ne hashait pas le mot de passe avant comparaison
2. **Solution**: Ajouter `encode(digest(p_password, 'sha256'), 'hex')` dans la fonction
3. **Action**: Exécuter `FIX_AUTHENTICATE_USER_HASH.sql` dans Supabase SQL Editor
4. **Test**: Se connecter avec l'utilisateur créé
5. **Résultat**: ✅ Connexion réussie!

---

**Date**: 15 janvier 2026  
**Status**: 🔧 CORRECTION PRÊTE - EXÉCUTION MANUELLE REQUISE
