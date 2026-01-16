# 👥 Gestion Complète des Utilisateurs - Architecture Centralisée

## 🎯 Réponse à Votre Question

**Question**: Comment créer un utilisateur dans MySQL et PostgreSQL? Comment gérer les profils et accès?

**Réponse**: Vous **NE CRÉEZ PAS** d'utilisateurs dans MySQL ou PostgreSQL! 

Voici pourquoi et comment ça fonctionne:

---

## 🏗️ Architecture Centralisée (Supabase)

### Principe Fondamental

**TOUS les utilisateurs sont gérés dans Supabase**, peu importe la base de données utilisée pour les données métier.

```
┌─────────────────────────────────────────────────────────┐
│  SUPABASE (Base Centralisée)                            │
│                                                         │
│  ┌─────────────────────────────────────────┐           │
│  │  Table: users                           │           │
│  │  - id, username, email, password_hash   │           │
│  │  - role (admin, manager, user)          │           │
│  │  - business_units (array)               │           │
│  │  - active, created_at, etc.             │           │
│  └─────────────────────────────────────────┘           │
│                                                         │
│  ┌─────────────────────────────────────────┐           │
│  │  Table: user_permissions                │           │
│  │  - user_id, module, can_read, etc.      │           │
│  └─────────────────────────────────────────┘           │
│                                                         │
│  ┌─────────────────────────────────────────┐           │
│  │  Table: business_units                  │           │
│  │  - schema_name (bu01_2024, etc.)        │           │
│  │  - nom_entreprise, active, etc.         │           │
│  └─────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   ┌─────────┐     ┌──────────┐    ┌──────────┐
   │  MySQL  │     │PostgreSQL│    │ Supabase │
   │         │     │          │    │ Schemas  │
   │bu01_2024│     │bu01_2024 │    │bu01_2024 │
   │bu02_2024│     │bu02_2024 │    │bu02_2024 │
   └─────────┘     └──────────┘    └──────────┘
   (Données)       (Données)       (Données)
```

---

## 👤 Création d'un Nouvel Utilisateur

### Méthode 1: Via l'Interface Admin (Recommandée)

**URL**: https://frontend-iota-six-72.vercel.app/admin/users

**Étapes**:
1. Connectez-vous en tant qu'admin
2. Cliquez sur "➕ Nouvel Utilisateur"
3. Remplissez le formulaire:
   - Username
   - Email
   - Mot de passe (avec bouton 👁️ pour afficher)
   - Nom complet
   - Rôle (admin, manager, user)
   - Business Units autorisées (cochez les BU)
4. Cliquez sur "✅ Créer l'utilisateur"

**Résultat**:
- ✅ Utilisateur créé dans Supabase
- ✅ Mot de passe hashé en SHA-256
- ✅ Peut se connecter immédiatement
- ✅ Accès aux BU sélectionnées (MySQL, PostgreSQL ou Supabase)

### Méthode 2: Via SQL Direct (Supabase)

```sql
-- Insérer un nouvel utilisateur dans Supabase
INSERT INTO public.users (
    username, 
    email, 
    password_hash, 
    full_name, 
    role, 
    business_units, 
    active
) VALUES (
    'nouveau_user',
    'nouveau@example.com',
    encode(digest('mot_de_passe', 'sha256'), 'hex'), -- Hash SHA-256
    'Nouveau Utilisateur',
    'user', -- ou 'manager' ou 'admin'
    ARRAY['bu01_2024', 'bu02_2024'], -- BU autorisées
    true
);
```

### Méthode 3: Via API Backend

```javascript
// POST /api/admin/users
const response = await fetch('https://frontend-iota-six-72.vercel.app/api/admin/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    username: 'nouveau_user',
    email: 'nouveau@example.com',
    password: 'mot_de_passe', // Sera hashé automatiquement
    full_name: 'Nouveau Utilisateur',
    role: 'user',
    business_units: ['bu01_2024', 'bu02_2024']
  })
});
```

---

## 🔐 Gestion des Profils et Accès

### 1. Rôles (Niveau Global)

Définis dans la table `users` de Supabase:

| Rôle | Description | Accès |
|------|-------------|-------|
| **admin** | Administrateur système | Tout accès, gestion utilisateurs, configuration |
| **manager** | Gestionnaire | Accès complet aux données, pas de gestion utilisateurs |
| **user** | Utilisateur standard | Accès lecture/écriture selon permissions |

**Modification du rôle**:
```sql
-- Via SQL
UPDATE public.users 
SET role = 'manager' 
WHERE username = 'habib';

-- Via Interface Admin
-- Modifier l'utilisateur → Changer le rôle → Enregistrer
```

### 2. Business Units (Accès aux Données)

Définis dans le champ `business_units` (array):

```sql
-- Donner accès à plusieurs BU
UPDATE public.users 
SET business_units = ARRAY['bu01_2024', 'bu02_2024', 'bu01_2025']
WHERE username = 'habib';

-- Ajouter une BU
UPDATE public.users 
SET business_units = array_append(business_units, 'bu03_2024')
WHERE username = 'habib';

-- Retirer une BU
UPDATE public.users 
SET business_units = array_remove(business_units, 'bu01_2024')
WHERE username = 'habib';
```

**Via Interface Admin**:
- Modifier l'utilisateur
- Cocher/décocher les Business Units
- Enregistrer

### 3. Permissions Détaillées (Optionnel)

Table `user_permissions` pour un contrôle granulaire:

```sql
-- Donner des permissions spécifiques sur un module
INSERT INTO public.user_permissions (
    user_id, 
    module, 
    can_read, 
    can_create, 
    can_update, 
    can_delete
) VALUES (
    11, -- ID de l'utilisateur habib
    'articles',
    true,  -- Peut lire
    true,  -- Peut créer
    true,  -- Peut modifier
    false  -- Ne peut pas supprimer
);

-- Modules disponibles:
-- 'articles', 'clients', 'suppliers', 'sales', 'purchases', 
-- 'stock', 'reports', 'settings'
```

---

## 🔄 Flux Complet d'Accès aux Données

### Étape 1: Connexion
```
User entre username/password
         ↓
Supabase.authenticate_user()
         ↓
Vérification dans table users (Supabase)
         ↓
Retour: { user, token, business_units: ['bu01_2024', 'bu02_2024'] }
```

### Étape 2: Sélection BU
```
User sélectionne bu01_2024
         ↓
Frontend vérifie: bu01_2024 dans user.business_units?
         ↓
Si OUI: Autoriser l'accès
Si NON: Refuser l'accès
```

### Étape 3: Accès aux Données
```
User demande la liste des articles
         ↓
Backend vérifie le token
         ↓
Backend se connecte à la base bu01_2024:
  - MySQL: base bu01_2024
  - PostgreSQL: schéma bu01_2024
  - Supabase: schéma bu01_2024
         ↓
Retour: Liste des articles
```

---

## 📊 Exemple Concret: Utilisateur "habib"

### Profil Actuel (dans Supabase)
```sql
SELECT * FROM public.users WHERE username = 'habib';
```

**Résultat**:
```
id: 11
username: habib
email: habib.belkacemi@outlook.com
role: manager
business_units: ['bu01_2024', 'bu02_2024'] (exemple)
active: true
```

### Ce que "habib" peut faire:

1. **Connexion**: ✅ Oui (via Supabase)
2. **Accès bu01_2024**: ✅ Oui (si dans business_units)
3. **Accès bu02_2024**: ✅ Oui (si dans business_units)
4. **Accès bu03_2024**: ❌ Non (si pas dans business_units)
5. **Gestion utilisateurs**: ❌ Non (role = manager, pas admin)

### Modifier les Accès de "habib"

#### Donner accès à plus de BU:
```sql
UPDATE public.users 
SET business_units = ARRAY['bu01_2024', 'bu02_2024', 'bu01_2025', 'bu02_2025']
WHERE username = 'habib';
```

#### Promouvoir en admin:
```sql
UPDATE public.users 
SET role = 'admin'
WHERE username = 'habib';
```

#### Via Interface Admin:
1. Aller sur https://frontend-iota-six-72.vercel.app/admin/users
2. Cliquer "✏️ Modifier" sur l'utilisateur habib
3. Changer le rôle ou les BU
4. Cliquer "✅ Enregistrer"

---

## 🎯 Réponses aux Questions Spécifiques

### Q1: Comment créer un utilisateur dans MySQL?
**R**: Vous ne créez PAS d'utilisateur dans MySQL. Tous les utilisateurs sont dans Supabase.

### Q2: Comment créer un utilisateur dans PostgreSQL?
**R**: Vous ne créez PAS d'utilisateur dans PostgreSQL. Tous les utilisateurs sont dans Supabase.

### Q3: Comment gérer les profils?
**R**: Via la table `users` dans Supabase:
- Rôle: `role` (admin, manager, user)
- Accès BU: `business_units` (array)
- Permissions: table `user_permissions` (optionnel)

### Q4: Comment gérer les accès?
**R**: 
- **Niveau 1**: Rôle global (admin, manager, user)
- **Niveau 2**: Business Units autorisées (array)
- **Niveau 3**: Permissions par module (optionnel)

### Q5: Un utilisateur peut-il accéder à plusieurs BU?
**R**: OUI! Via le champ `business_units` qui est un array:
```sql
business_units: ['bu01_2024', 'bu02_2024', 'bu01_2025']
```

### Q6: Les données sont-elles dupliquées?
**R**: NON! 
- **Utilisateurs**: Stockés UNE FOIS dans Supabase
- **Données métier**: Stockées dans MySQL/PostgreSQL/Supabase (selon BU)
- **Lien**: Via le champ `business_units`

---

## 🔧 Scripts Utiles

### Lister tous les utilisateurs et leurs accès:
```sql
SELECT 
    username, 
    email, 
    role, 
    business_units, 
    active,
    created_at
FROM public.users
ORDER BY created_at DESC;
```

### Trouver qui a accès à une BU spécifique:
```sql
SELECT username, email, role
FROM public.users
WHERE 'bu01_2024' = ANY(business_units)
AND active = true;
```

### Donner accès à toutes les BU à un admin:
```sql
UPDATE public.users 
SET business_units = (
    SELECT array_agg(schema_name) 
    FROM public.business_units 
    WHERE active = true
)
WHERE role = 'admin';
```

---

## 📚 Tables Supabase Importantes

### 1. users
- Stocke tous les utilisateurs
- Gère l'authentification
- Définit les rôles et accès BU

### 2. business_units
- Liste toutes les BU disponibles
- Informations sur chaque BU
- Utilisé pour valider les accès

### 3. user_permissions (optionnel)
- Permissions granulaires par module
- Contrôle CRUD (Create, Read, Update, Delete)

### 4. user_sessions
- Sessions actives
- Tokens JWT
- Gestion de la sécurité

### 5. system_logs
- Logs d'activité
- Audit trail
- Débogage

---

## 🎉 Résumé

### ✅ Ce Qu'il Faut Retenir

1. **Utilisateurs**: TOUS dans Supabase (table `users`)
2. **Authentification**: TOUJOURS via Supabase
3. **Accès BU**: Défini dans `business_units` (array)
4. **Données métier**: MySQL/PostgreSQL/Supabase (selon BU)
5. **Gestion**: Via interface admin ou SQL Supabase

### ❌ Ce Qu'il NE Faut PAS Faire

1. ❌ Créer des utilisateurs dans MySQL
2. ❌ Créer des utilisateurs dans PostgreSQL
3. ❌ Dupliquer les utilisateurs entre bases
4. ❌ Gérer l'authentification dans MySQL/PostgreSQL

### ✅ Ce Qu'il FAUT Faire

1. ✅ Créer les utilisateurs dans Supabase
2. ✅ Définir les business_units autorisées
3. ✅ Utiliser l'interface admin pour la gestion
4. ✅ Laisser le système gérer les accès automatiquement

---

**Date**: 15 janvier 2026  
**Status**: ✅ ARCHITECTURE CENTRALISÉE EXPLIQUÉE
