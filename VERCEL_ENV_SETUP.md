# Configuration Variables d'Environnement Vercel

## PROBLÈME IDENTIFIÉ
En production sur Vercel, l'application ne peut pas se connecter aux bases de données car :
1. Le backend n'est pas déployé
2. Les variables Supabase ne sont pas configurées
3. Les bases MySQL/PostgreSQL locales ne sont pas accessibles

## SOLUTION IMMÉDIATE

### 1. Configurer les Variables Supabase sur Vercel

Aller sur : https://vercel.com/tigdittgolf-9191s-projects/frontend/settings/environment-variables

Ajouter ces variables :

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
```

### 2. Commandes pour configurer automatiquement

```bash
# Configurer les variables Vercel (remplacer par vos vraies valeurs)
vercel env add SUPABASE_URL
# Entrer: https://your-project.supabase.co

vercel env add SUPABASE_SERVICE_ROLE_KEY  
# Entrer: your-service-role-key

vercel env add NODE_ENV
# Entrer: production
```

### 3. Redéployer après configuration

```bash
cd frontend
vercel --prod
```

## ARCHITECTURE PRODUCTION

### Mode Développement (Local)
```
Frontend (3000) → Backend (3005) → Supabase/MySQL/PostgreSQL
```

### Mode Production (Vercel)
```
Frontend (Vercel) → API Routes Next.js → Supabase uniquement
```

## FONCTIONNALITÉS EN PRODUCTION

### ✅ Disponibles
- Connexion/Authentification
- Gestion Articles/Clients/Fournisseurs
- Bons de livraison/Factures/Proformas
- Dashboard et statistiques
- **Supabase uniquement** (pas de switch de base)

### ❌ Non disponibles en production
- Migration vers MySQL/PostgreSQL local
- Switch entre bases de données
- Fonctions RPC locales (MySQL/PostgreSQL)

## SOLUTION COMPLÈTE (Optionnelle)

Pour avoir toutes les fonctionnalités en production, il faudrait :

1. **Déployer le backend** sur un service comme Railway/Render
2. **Utiliser des bases cloud** (PlanetScale MySQL, Neon PostgreSQL)
3. **Configurer les connexions cloud** dans le backend déployé

## RECOMMANDATION

Pour l'instant, configurer les variables Supabase permet d'avoir une application fonctionnelle en production avec toutes les fonctionnalités de base.

Le switch entre bases de données reste une fonctionnalité de développement/local.