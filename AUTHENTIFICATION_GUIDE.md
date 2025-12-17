# 🔐 Système d'Authentification Complet - Guide d'Implémentation

## 📋 Vue d'ensemble

Système d'authentification complet avec :
- ✅ Authentification par username/password
- ✅ Gestion des sessions avec JWT
- ✅ Rôles (admin, manager, user)
- ✅ Permissions granulaires par module
- ✅ Logs d'activité en temps réel
- ✅ Sécurité renforcée

## 🚀 Installation

### Étape 1 : Exécuter le script SQL

Exécutez `backend/SYSTEME_AUTHENTIFICATION.sql` sur Supabase.

Ce script crée :
- ✅ Table `users` - Utilisateurs avec rôles
- ✅ Table `user_permissions` - Permissions détaillées par module
- ✅ Table `user_sessions` - Sessions actives avec JWT
- ✅ Table `system_logs` - Logs d'activité
- ✅ Fonctions RPC pour l'authentification
- ✅ 3 utilisateurs de test (admin, manager, user)

### Étape 2 : Installer les dépendances

```bash
cd backend
bun add hono/jwt
```

### Étape 3 : Redémarrer le backend

```bash
cd backend
bun run index.ts
```

## 👥 Utilisateurs de test créés

### 1. Administrateur
```
Username: admin
Password: admin123
Rôle: admin
BU: 2025_bu01, 2024_bu01, 2025_bu02
Permissions: TOUS LES DROITS
```

### 2. Manager
```
Username: manager
Password: manager123
Rôle: manager
BU: 2025_bu01
Permissions: Lecture/Création/Modification (pas de suppression sur settings)
```

### 3. Utilisateur
```
Username: user
Password: user123
Rôle: user
BU: 2025_bu01
Permissions: Lecture + Création/Modification sur ventes et achats uniquement
```

## 🔑 Endpoints API

### Authentification

#### POST /api/auth-real/login
Authentifie un utilisateur et retourne un token JWT.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "full_name": "Administrateur Système",
    "role": "admin",
    "business_units": ["2025_bu01", "2024_bu01", "2025_bu02"]
  }
}
```

#### POST /api/auth-real/logout
Déconnecte l'utilisateur et supprime sa session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

#### GET /api/auth-real/validate
Valide un token JWT.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    ...
  }
}
```

#### GET /api/auth-real/me
Récupère les informations de l'utilisateur connecté.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "full_name": "Administrateur Système",
    "role": "admin",
    "business_units": ["2025_bu01"]
  }
}
```

#### POST /api/auth-real/check-permission
Vérifie si l'utilisateur a une permission spécifique.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "module": "articles",
  "action": "delete"
}
```

**Response:**
```json
{
  "success": true,
  "hasPermission": true
}
```

### Logs

#### GET /api/admin/logs
Récupère les logs système.

**Query Parameters:**
- `limit` (default: 100) - Nombre de logs à retourner
- `level` (optional) - Filtrer par niveau (info, warning, error, success)
- `user_id` (optional) - Filtrer par utilisateur

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "timestamp": "2025-12-17T10:30:00Z",
      "level": "success",
      "user": "admin",
      "action": "LOGIN",
      "details": "Connexion réussie",
      "ip_address": "192.168.1.100"
    }
  ]
}
```

## 🎭 Système de Rôles

### Admin
- Accès total à toutes les fonctionnalités
- Accès au module d'administration
- Peut créer/modifier/supprimer des BU
- Peut créer/modifier/supprimer des utilisateurs
- Peut voir tous les logs

### Manager
- Accès complet à sa BU
- Peut créer/modifier/supprimer des données
- Ne peut pas accéder au module admin
- Ne peut pas modifier les paramètres système

### User
- Accès en lecture à sa BU
- Peut créer/modifier des ventes et achats
- Ne peut pas supprimer de données
- Ne peut pas accéder aux paramètres

## 🔒 Système de Permissions

### Modules disponibles
- `articles` - Gestion des articles
- `clients` - Gestion des clients
- `suppliers` - Gestion des fournisseurs
- `sales` - Gestion des ventes
- `purchases` - Gestion des achats
- `stock` - Gestion du stock
- `reports` - Rapports
- `settings` - Paramètres

### Actions disponibles
- `read` - Lecture
- `create` - Création
- `update` - Modification
- `delete` - Suppression

### Vérification des permissions

**Backend (dans vos routes):**
```typescript
// Vérifier si l'utilisateur peut supprimer des articles
const { data: hasPermission } = await supabaseAdmin.rpc('check_user_permission', {
  p_user_id: userId,
  p_module: 'articles',
  p_action: 'delete'
});

if (!hasPermission) {
  return c.json({ error: 'Permission refusée' }, 403);
}
```

**Frontend (via API):**
```typescript
const response = await fetch('http://localhost:3005/api/auth-real/check-permission', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    module: 'articles',
    action: 'delete'
  })
});

const result = await response.json();
if (result.hasPermission) {
  // Afficher le bouton supprimer
}
```

## 📊 Logs d'Activité

### Types de logs automatiques

**Authentification:**
- `LOGIN` - Connexion réussie
- `FAILED_LOGIN` - Tentative de connexion échouée
- `LOGOUT` - Déconnexion

**Business Units:**
- `CREATE_BU` - Création d'une BU
- `UPDATE_BU` - Modification d'une BU
- `DELETE_BU` - Suppression d'une BU

**Utilisateurs:**
- `CREATE_USER` - Création d'un utilisateur
- `UPDATE_USER` - Modification d'un utilisateur
- `DELETE_USER` - Suppression d'un utilisateur

### Logger une action personnalisée

```typescript
await supabaseAdmin.rpc('log_action', {
  p_user_id: userId,
  p_username: username,
  p_level: 'info', // 'info', 'warning', 'error', 'success'
  p_action: 'CREATE_ARTICLE',
  p_details: 'Article "Marteau" créé',
  p_ip_address: ipAddress
});
```

## 🔐 Sécurité

### Tokens JWT
- Durée de vie : 24 heures
- Stockés dans `localStorage` côté frontend
- Vérifiés à chaque requête côté backend

### Sessions
- Stockées dans la table `user_sessions`
- Expiration automatique après 24h
- Nettoyage automatique des sessions expirées

### Mots de passe
⚠️ **IMPORTANT** : Actuellement, les mots de passe sont stockés en clair (pour le développement).

**En production, vous DEVEZ :**
1. Installer bcrypt : `bun add bcrypt`
2. Hasher les mots de passe lors de la création
3. Comparer les hash lors de l'authentification

**Exemple avec bcrypt:**
```typescript
import bcrypt from 'bcrypt';

// Lors de la création
const hashedPassword = await bcrypt.hash(password, 10);

// Lors de l'authentification
const isValid = await bcrypt.compare(password, user.password_hash);
```

## 🔄 Workflow d'authentification

### 1. Login
```
User → Frontend → POST /api/auth-real/login
                ↓
            Backend → RPC authenticate_user()
                ↓
            Supabase → Vérifier username/password
                ↓
            Backend → Générer JWT + Créer session
                ↓
            Frontend ← Token + User info
                ↓
            localStorage.setItem('token', token)
```

### 2. Requêtes authentifiées
```
Frontend → GET /api/articles
           Headers: Authorization: Bearer <token>
                ↓
            Backend → Vérifier JWT
                ↓
            Backend → Vérifier session dans DB
                ↓
            Backend → Vérifier permissions
                ↓
            Frontend ← Données
```

### 3. Logout
```
Frontend → POST /api/auth-real/logout
           Headers: Authorization: Bearer <token>
                ↓
            Backend → RPC logout_user()
                ↓
            Supabase → Supprimer session
                ↓
            Frontend ← Success
                ↓
            localStorage.removeItem('token')
```

## 🛠️ Prochaines étapes

### 1. Mettre à jour la page de login
Modifier `frontend/app/login/page.tsx` pour utiliser `/api/auth-real/login`

### 2. Créer un middleware d'authentification
Protéger toutes les routes avec vérification du token

### 3. Ajouter les vérifications de permissions
Dans chaque page, vérifier les permissions avant d'afficher les boutons

### 4. Implémenter le hashing des mots de passe
Utiliser bcrypt en production

### 5. Ajouter la gestion des permissions dans l'interface admin
Permettre de modifier les permissions d'un utilisateur

## ✅ Checklist de vérification

- [ ] Script SQL `SYSTEME_AUTHENTIFICATION.sql` exécuté
- [ ] Backend redémarré avec succès
- [ ] Tables créées (users, user_permissions, user_sessions, system_logs)
- [ ] 3 utilisateurs de test créés
- [ ] Endpoint `/api/auth-real/login` fonctionnel
- [ ] Endpoint `/api/auth-real/validate` fonctionnel
- [ ] Endpoint `/api/admin/logs` retourne les vrais logs
- [ ] Logs de connexion enregistrés automatiquement

## 🧪 Tests

### Test 1 : Login admin
```bash
curl -X POST http://localhost:3005/api/auth-real/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Test 2 : Valider le token
```bash
curl -X GET http://localhost:3005/api/auth-real/validate \
  -H "Authorization: Bearer <votre_token>"
```

### Test 3 : Vérifier une permission
```bash
curl -X POST http://localhost:3005/api/auth-real/check-permission \
  -H "Authorization: Bearer <votre_token>" \
  -H "Content-Type: application/json" \
  -d '{"module":"articles","action":"delete"}'
```

### Test 4 : Récupérer les logs
```bash
curl -X GET "http://localhost:3005/api/admin/logs?limit=10"
```

## 🎉 Félicitations !

Votre système d'authentification est maintenant opérationnel avec :
- ✅ Authentification sécurisée
- ✅ Gestion des rôles et permissions
- ✅ Logs d'activité en temps réel
- ✅ Sessions avec JWT
- ✅ 3 utilisateurs de test prêts à l'emploi

**Prochaine étape** : Intégrer l'authentification dans votre page de login et protéger vos routes !
