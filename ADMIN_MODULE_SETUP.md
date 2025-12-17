# 👨‍💼 Module d'Administration - Guide de Configuration

## 📋 Vue d'ensemble

Le module d'administration permet de gérer l'ensemble du système multi-tenant :
- **Business Units** : Créer et gérer les unités commerciales avec leurs schémas de base de données
- **Utilisateurs** : Créer des comptes et assigner les accès aux BU
- **Logs & Monitoring** : Surveiller l'activité système

## 🚀 Installation

### Étape 1 : Exécuter le script SQL sur Supabase

Exécutez le fichier `backend/FONCTIONS_RPC_ADMIN.sql` dans l'éditeur SQL de Supabase.

Ce script va créer :
- ✅ Fonctions RPC pour la gestion des BU
- ✅ Fonctions RPC pour la gestion des utilisateurs
- ✅ Table `public.users` pour stocker les utilisateurs
- ✅ Utilisateur admin par défaut (username: `admin`, password: `admin123`)

### Étape 2 : Redémarrer le backend

```bash
cd backend
bun run index.ts
```

Le backend va charger les nouvelles routes :
- `/api/admin/stats` - Statistiques globales
- `/api/admin/business-units` - CRUD des BU
- `/api/admin/users` - CRUD des utilisateurs

### Étape 3 : Accéder au module admin

1. Connectez-vous à l'application
2. Depuis le dashboard, cliquez sur le bouton **👨‍💼 Administration**
3. Ou accédez directement à : `http://localhost:3000/admin`

## 📁 Structure des fichiers créés

### Backend
```
backend/
├── src/routes/admin.ts              # Routes API admin
├── FONCTIONS_RPC_ADMIN.sql          # Fonctions RPC Supabase
└── index.ts                         # Mise à jour avec routes admin
```

### Frontend
```
frontend/app/
├── admin/
│   ├── page.tsx                     # Dashboard admin
│   ├── business-units/
│   │   └── page.tsx                 # Gestion des BU
│   ├── users/
│   │   └── page.tsx                 # Gestion des utilisateurs
│   └── logs/
│       └── page.tsx                 # Logs & monitoring
└── dashboard/page.tsx               # Ajout du bouton admin
```

## 🎯 Fonctionnalités

### 1. Dashboard Admin (`/admin`)
- Vue d'ensemble avec statistiques
- Nombre de BU, utilisateurs, schémas DB
- Accès rapide aux 3 modules principaux

### 2. Gestion des Business Units (`/admin/business-units`)

#### Créer une BU
- Code BU (ex: bu01, bu02, bu03)
- Année fiscale
- Informations entreprise complètes (nom, adresse, NIF, RC, etc.)
- **Création automatique du schéma de base de données**
- **Création automatique des tables** (activite, famille, article, client, fournisseur)

#### Modifier une BU
- Tous les champs sont modifiables
- Les modifications sont sauvegardées dans la table `activite` du schéma

#### Supprimer une BU
- ⚠️ **ATTENTION** : Supprime le schéma complet avec toutes les données
- Confirmation obligatoire

### 3. Gestion des Utilisateurs (`/admin/users`)

#### Créer un utilisateur
- Username (unique)
- Email (unique)
- Mot de passe
- Nom complet
- Rôle : Admin / Manager / Utilisateur
- **Assigner aux Business Units** : Sélection multiple des BU autorisées

#### Modifier un utilisateur
- Tous les champs modifiables
- Changer les BU assignées
- Activer/Désactiver le compte

#### Supprimer un utilisateur
- Suppression définitive du compte

### 4. Logs & Monitoring (`/admin/logs`)

#### Fonctionnalités
- Affichage des logs système en temps réel
- Filtres par niveau (erreur, warning, success, info)
- Filtres par utilisateur
- Auto-refresh toutes les 5 secondes
- Statistiques des logs (total, erreurs, warnings, succès)

#### Types de logs
- 🔐 LOGIN / LOGOUT
- 🏢 CREATE_BU / UPDATE_BU / DELETE_BU
- 👤 CREATE_USER / UPDATE_USER / DELETE_USER
- ❌ Erreurs système
- ⚠️ Avertissements

## 🔐 Sécurité

### Utilisateur admin par défaut
```
Username: admin
Password: admin123
Email: admin@example.com
```

⚠️ **IMPORTANT** : Changez ce mot de passe en production !

### Permissions
- Les fonctions RPC utilisent `SECURITY DEFINER` pour accéder aux schémas tenants
- Seuls les administrateurs devraient avoir accès au module `/admin`
- TODO : Implémenter la vérification du rôle admin côté backend

## 📊 Architecture Multi-Tenant

### Schémas de base de données
Chaque BU a son propre schéma : `{année}_{code_bu}`

Exemples :
- `2025_bu01` - Business Unit 01 pour l'année 2025
- `2025_bu02` - Business Unit 02 pour l'année 2025
- `2024_bu01` - Business Unit 01 pour l'année 2024

### Tables créées automatiquement
Lors de la création d'une BU, les tables suivantes sont créées dans son schéma :
- `activite` - Informations de l'entreprise
- `famille` - Familles d'articles
- `article` - Articles avec stock
- `client` - Clients
- `fournisseur` - Fournisseurs

### Table utilisateurs
La table `public.users` est partagée entre tous les tenants et contient :
- Informations de connexion
- Rôle (admin, manager, user)
- **Array des BU autorisées** : `business_units TEXT[]`

## 🔄 Workflow typique

### 1. Créer une nouvelle entreprise
1. Aller dans **Administration** → **Business Units**
2. Cliquer sur **➕ Nouvelle BU**
3. Remplir le formulaire :
   - Code BU : `bu03`
   - Année : `2025`
   - Nom entreprise : `Ma Nouvelle Entreprise`
   - Remplir les autres champs (adresse, NIF, RC, etc.)
4. Cliquer sur **✅ Créer la Business Unit**
5. Le schéma `2025_bu03` est créé automatiquement avec toutes les tables

### 2. Créer un utilisateur pour cette entreprise
1. Aller dans **Administration** → **Utilisateurs**
2. Cliquer sur **➕ Nouvel Utilisateur**
3. Remplir le formulaire :
   - Username : `user.bu03`
   - Email : `user@bu03.com`
   - Password : `password123`
   - Rôle : `Utilisateur`
4. Cocher la BU `2025_bu03` dans la liste
5. Cliquer sur **✅ Créer l'utilisateur**

### 3. L'utilisateur peut maintenant se connecter
1. Login avec `user.bu03` / `password123`
2. Sélection du tenant : `2025_bu03`
3. Accès à l'application avec les données de sa BU uniquement

## 🛠️ TODO / Améliorations futures

### Sécurité
- [ ] Implémenter le hashing des mots de passe (bcrypt)
- [ ] Vérification du rôle admin pour accéder à `/admin`
- [ ] Middleware d'authentification côté backend
- [ ] Logs d'audit pour toutes les actions admin

### Fonctionnalités
- [ ] Système de logs réel (actuellement démo)
- [ ] Export des logs en CSV/PDF
- [ ] Notifications par email pour les erreurs critiques
- [ ] Gestion des permissions granulaires par module
- [ ] Tableau de bord avec graphiques (Chart.js)
- [ ] Sauvegarde/Restauration des BU
- [ ] Migration de données entre BU

### Interface
- [ ] Mode sombre
- [ ] Pagination pour les grandes listes
- [ ] Recherche avancée avec filtres multiples
- [ ] Tri des colonnes dans les tableaux

## 📞 Support

Pour toute question ou problème :
1. Vérifier que le script SQL a été exécuté correctement
2. Vérifier que le backend est redémarré
3. Consulter les logs du backend pour les erreurs
4. Vérifier les permissions Supabase

## ✅ Checklist de vérification

Avant de commencer à utiliser le module admin :

- [ ] Script SQL `FONCTIONS_RPC_ADMIN.sql` exécuté sur Supabase
- [ ] Backend redémarré avec succès
- [ ] Table `public.users` créée
- [ ] Utilisateur admin par défaut créé
- [ ] Bouton "Administration" visible dans le dashboard
- [ ] Accès à `/admin` fonctionnel
- [ ] Accès à `/admin/business-units` fonctionnel
- [ ] Accès à `/admin/users` fonctionnel
- [ ] Accès à `/admin/logs` fonctionnel

## 🎉 Félicitations !

Votre module d'administration est maintenant opérationnel ! Vous pouvez créer des Business Units, gérer les utilisateurs et surveiller l'activité système.
