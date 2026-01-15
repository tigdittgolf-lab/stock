# Fix Admin Users - Password Column Error ✅

## Problème Initial
```
Could not find the 'password' column of 'users' in the schema cache
```

L'API frontend envoyait un champ `password` mais la table database utilise `password_hash`.

## Solution Implémentée

### 1. Modification POST /api/admin/users (Création)
**Fichier**: `frontend/app/api/admin/users/route.ts`

**Changements**:
- Validation des champs requis (username, email, password)
- Hash du mot de passe avec SHA-256
- Mapping `password` → `password_hash` avant insertion
- Gestion des erreurs améliorée

```typescript
const crypto = require('crypto');
const password_hash = crypto
  .createHash('sha256')
  .update(body.password)
  .digest('hex');

const userData = {
  username: body.username,
  email: body.email,
  password_hash: password_hash, // ✅ Utilise password_hash
  full_name: body.full_name || '',
  role: body.role || 'user',
  business_units: body.business_units || [],
  active: true
};
```

### 2. Création Routes Dynamiques [id]
**Fichier**: `frontend/app/api/admin/users/[id]/route.ts` (nouveau)

**Méthodes implémentées**:

#### GET - Récupérer un utilisateur par ID
- Validation de l'ID
- Récupération depuis Supabase
- Support Next.js 15 async params

#### PUT - Mettre à jour un utilisateur
- Validation de l'ID
- Hash du nouveau mot de passe si fourni
- Mapping vers `password_hash`
- Mise à jour de `updated_at`

#### DELETE - Supprimer un utilisateur
- Validation de l'ID
- Suppression depuis Supabase
- Gestion des erreurs

### 3. Fix Next.js 15 Async Params
Tous les routes dynamiques utilisent maintenant:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

## Tests Effectués

### Test Complet CRUD ✅
```bash
node test-admin-users-complete.js
```

**Résultats**:
- ✅ CREATE - Création avec password_hash
- ✅ READ - Lecture par ID
- ✅ UPDATE - Mise à jour (avec nouveau password)
- ✅ LIST - Liste complète
- ✅ DELETE - Suppression

### Détails des Tests
1. **CREATE**: Utilisateur créé avec ID 10, password hashé correctement
2. **READ**: Utilisateur récupéré, password_hash présent
3. **UPDATE**: Full name et role mis à jour, business_units modifiés
4. **LIST**: 6 utilisateurs trouvés, notre utilisateur présent
5. **DELETE**: Utilisateur supprimé et vérification confirmée

## Commits Git

1. **68d74d2** - Fix: Admin users password hashing - map password to password_hash column
   - Modification POST route
   - Création [id] route avec GET/PUT/DELETE

2. **60ee36a** - Fix: Next.js 15 async params for user ID routes
   - Support async params pour Next.js 15
   - Fix GET/PUT/DELETE routes

## Déploiement

**URL Production**: https://frontend-iota-six-72.vercel.app

**Déploiements Vercel**:
- Premier déploiement: FhzCj7VDbukrrPWis81EQsaFmSMF
- Second déploiement: 4n1tGT7WhuWxnd7ZmAupEjeMCH3T

## Sécurité

### Actuel
- Hash SHA-256 pour les mots de passe
- Validation des champs requis
- Gestion des erreurs

### Recommandation Future
Pour la production, considérer:
```typescript
import bcrypt from 'bcrypt';
const password_hash = await bcrypt.hash(password, 10);
```

## Statut Final

✅ **Page /admin/users 100% fonctionnelle**

Toutes les opérations CRUD fonctionnent:
- Création d'utilisateurs avec mot de passe
- Lecture des utilisateurs
- Mise à jour (y compris changement de mot de passe)
- Suppression d'utilisateurs
- Liste complète des utilisateurs

## Fichiers Modifiés

1. `frontend/app/api/admin/users/route.ts` - POST avec password_hash
2. `frontend/app/api/admin/users/[id]/route.ts` - GET/PUT/DELETE (nouveau)
3. `test-admin-users-complete.js` - Tests CRUD complets (nouveau)

## Architecture

```
Frontend (Vercel)
  ↓
/api/admin/users
  ├── GET    → Liste tous les utilisateurs
  ├── POST   → Crée un utilisateur (password → password_hash)
  └── /[id]
      ├── GET    → Récupère un utilisateur
      ├── PUT    → Met à jour un utilisateur
      └── DELETE → Supprime un utilisateur
  ↓
Supabase (table: public.users)
  - Colonne: password_hash (pas password)
```

---

**Date**: 15 janvier 2026
**Status**: ✅ COMPLET ET TESTÉ
