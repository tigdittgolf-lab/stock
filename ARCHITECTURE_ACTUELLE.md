# 🏗️ Architecture Actuelle de l'Application

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         UTILISATEUR                              │
│                    (Navigateur Web / Mobile)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND VERCEL                             │
│  https://frontend-c9t9s49rm-habibbelkacemimosta-7724s-          │
│                  projects.vercel.app                             │
│                                                                  │
│  • Next.js 15 App Router                                        │
│  • React 19                                                      │
│  • TypeScript                                                    │
│  • Déployé automatiquement depuis GitHub                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             │ getBackendUrl()
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE TUNNEL                              │
│  https://midi-charm-harvard-performed.trycloudflare.com          │
│                                                                  │
│  • Quick Tunnel (temporaire)                                    │
│  • Pas d'authentification requise                               │
│  • Tourne en arrière-plan (ProcessId: 5)                        │
│  • Expose le backend local publiquement                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP (local)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND LOCAL (Bun)                           │
│                  http://localhost:3005                           │
│                                                                  │
│  • Bun Runtime                                                   │
│  • Hono Framework                                                │
│  • TypeScript                                                    │
│  • Multi-tenant Architecture                                     │
│  • Tourne sur ton PC                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ PostgreSQL Protocol
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE CLOUD                              │
│         https://szgodrjglbpzkrksnroi.supabase.co                │
│                                                                  │
│  • PostgreSQL Database                                           │
│  • Multi-schémas (2009_bu02, 2013_bu01, etc.)                   │
│  • RPC Functions                                                 │
│  • Row Level Security                                            │
│  • Hébergé sur Supabase Cloud                                    │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flux de Données

### 1. Consultation d'un Article

```
Utilisateur
    │
    │ 1. Clique sur article #6787
    ▼
Frontend Vercel
    │
    │ 2. GET /api/articles/6787
    │    Headers: X-Tenant: 2009_bu02
    ▼
Cloudflare Tunnel
    │
    │ 3. Forwarding vers localhost:3005
    ▼
Backend Local
    │
    │ 4. executeSupabaseRPC('get_articles_by_tenant', {tenant: '2009_bu02'})
    ▼
Supabase Cloud
    │
    │ 5. SELECT * FROM "2009_bu02".article WHERE "Narticle" = 6787
    │
    │ 6. Retourne les données JSON
    ▼
Backend Local
    │
    │ 7. Transforme et retourne
    ▼
Cloudflare Tunnel
    │
    │ 8. Forwarding vers Vercel
    ▼
Frontend Vercel
    │
    │ 9. Affiche l'article
    ▼
Utilisateur
```

## 🔐 Sécurité

### Frontend → Backend
- ✅ HTTPS via Cloudflare Tunnel
- ✅ Headers X-Tenant pour isolation multi-tenant
- ✅ CORS configuré

### Backend → Supabase
- ✅ Service Role Key (stockée dans .env)
- ✅ Connexion PostgreSQL sécurisée
- ✅ RPC Functions avec SECURITY DEFINER

## 📦 Composants

### Frontend (Vercel)
- **Framework:** Next.js 15
- **Runtime:** Node.js
- **Build:** Automatique via GitHub
- **Variables d'env:** Configurées sur Vercel
- **URL:** https://frontend-c9t9s49rm-habibbelkacemimosta-7724s-projects.vercel.app

### Tunnel (Cloudflare)
- **Type:** Quick Tunnel (temporaire)
- **Process:** Tourne en arrière-plan
- **URL:** https://midi-charm-harvard-performed.trycloudflare.com
- **Redémarrage:** Nécessite mise à jour frontend

### Backend (Local)
- **Runtime:** Bun
- **Framework:** Hono
- **Port:** 3005
- **Location:** Ton PC (C:\netbean\St_Article_1\backend)
- **Dépendance:** Doit rester allumé

### Database (Supabase)
- **Type:** PostgreSQL
- **Hébergement:** Supabase Cloud
- **Schémas:** Multi-tenant (2009_bu02, 2013_bu01, etc.)
- **URL:** https://szgodrjglbpzkrksnroi.supabase.co

## ⚙️ Configuration

### Variables d'Environnement

#### Frontend (Vercel)
```env
NEXT_PUBLIC_BACKEND_URL=https://midi-charm-harvard-performed.trycloudflare.com
NEXT_PUBLIC_SUPABASE_URL=https://szgodrjglbpzkrksnroi.supabase.co
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_URL=https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

#### Backend (Local)
```env
SUPABASE_URL=https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
JWT_SECRET=4b5546596ba4ffc0d9a9e404ff6d890e3e9b72c6248ead0b08b8c1e124974e89
PORT=3005
```

## 🔄 Déploiement

### Workflow Actuel

```
1. Développement Local
   ├─ Modifier le code
   ├─ Tester localement
   └─ Commit + Push

2. GitHub
   ├─ Reçoit le push
   └─ Déclenche Vercel

3. Vercel
   ├─ Build automatique
   ├─ Deploy automatique
   └─ URL de production mise à jour

4. Cloudflare Tunnel
   ├─ Tourne en continu
   └─ Expose le backend local

5. Backend Local
   ├─ Doit rester allumé
   └─ Connecté à Supabase
```

## 📊 Avantages et Inconvénients

### ✅ Avantages
- Frontend déployé automatiquement
- Backend Bun/Hono performant
- Pas de refactoring nécessaire
- Multi-tenant natif
- Coût minimal (Vercel + Supabase gratuits)

### ⚠️ Inconvénients
- Backend doit rester allumé (ton PC)
- URL tunnel temporaire (change au redémarrage)
- Dépendance à la connexion internet locale

## 🚀 Améliorations Futures

### Court Terme
1. ✅ Corriger les fonctions RPC Supabase
2. ⏳ Créer un tunnel nommé permanent (URL fixe)

### Moyen Terme
1. Déployer le backend sur un VPS
2. Configurer un domaine personnalisé
3. Ajouter monitoring et alertes

### Long Terme
1. Migrer vers une architecture serverless complète
2. Ajouter CDN pour les assets
3. Implémenter cache Redis

## 📝 Notes Importantes

### Redémarrage du Tunnel
Si le tunnel s'arrête ou redémarre:
1. L'URL changera
2. Tu devras mettre à jour `frontend/lib/backend-url.ts`
3. Redéployer le frontend

### Maintenance du Backend
Le backend doit rester allumé pour que l'application fonctionne.
Options:
- Laisser ton PC allumé
- Déployer sur un VPS
- Utiliser un service cloud

---

**Dernière mise à jour:** 21 février 2026, 12:50 UTC
**Status:** ✅ Opérationnel
**Tunnel:** https://midi-charm-harvard-performed.trycloudflare.com
**Frontend:** https://frontend-c9t9s49rm-habibbelkacemimosta-7724s-projects.vercel.app
