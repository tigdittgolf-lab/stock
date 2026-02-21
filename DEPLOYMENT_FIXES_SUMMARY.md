# Résumé des Corrections de Déploiement

## Problèmes Résolus

### 1. Erreur 404 sur les Pages Dynamiques
**Problème**: Les routes dynamiques comme `/dashboard/edit-article/[id]` retournaient 404 sur Vercel.

**Cause**: Configuration `vercel.json` avec des routes personnalisées qui interféraient avec le routing Next.js 13+ App Router.

**Solution**: Simplifié `vercel.json` pour laisser Next.js gérer le routing automatiquement.

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && npm install"
}
```

### 2. Contraste des Badges Sidebar
**Problème**: Les badges (nombre d'articles, clients, fournisseurs) dans la sidebar avaient un mauvais contraste en mode sombre/light.

**Solution**: Amélioré les styles CSS dans `frontend/app/page.module.css`:
- Badges normaux: couleur de texte explicite + backdrop-filter
- Badges actifs: fond blanc opaque avec texte violet contrasté

### 3. Routes API Manquantes
**Problème**: Pas de route pour consulter un article spécifique (`/api/articles/[id]`).

**Solution**: Créé les routes dynamiques:
- `frontend/app/api/articles/[id]/route.ts` (GET, PUT, DELETE)
- `frontend/app/api/settings/families/route.ts` (GET, POST)

### 4. URLs Hardcodées
**Problème**: Le code frontend utilisait des URLs hardcodées `http://localhost:3005` qui ne fonctionnent pas en production.

**Solution**: Remplacé par des URLs relatives dans `frontend/app/dashboard/edit-article/[id]/page.tsx`:
- `/api/articles/${id}` au lieu de `http://localhost:3005/api/articles/${id}`
- `/api/settings/families` au lieu de `http://localhost:3005/api/settings/families`

### 5. Routes Backend Incorrectes
**Problème**: Les routes backend utilisaient `databaseRouter.rpc` au lieu de `backendDatabaseService.executeRPC`.

**Solution**: Corrigé dans `backend/src/routes/articles.ts`:
- Route `GET /:id`
- Route `GET /force-refresh`

## Problèmes Restants

### Backend Non Accessible depuis Vercel
**Problème**: L'application déployée sur Vercel ne peut pas accéder au backend local via Tailscale.

**Cause**: Vercel ne peut pas se connecter à un serveur local via Tailscale (limitation réseau).

**Solutions Possibles**:

1. **Déployer le backend sur Vercel** (recommandé)
   - Créer un projet Vercel séparé pour le backend
   - Configurer les variables d'environnement
   - Mettre à jour `NEXT_PUBLIC_API_URL` dans le frontend

2. **Utiliser un tunnel public**
   - ngrok: `ngrok http 3005`
   - Cloudflare Tunnel
   - Mettre à jour les routes API frontend avec l'URL du tunnel

3. **Utiliser Supabase Edge Functions**
   - Migrer la logique backend vers Supabase Edge Functions
   - Accès direct depuis le frontend sans serveur intermédiaire

### Cache Navigateur
**Problème**: Anciennes URLs Vercel en cache (`frontend-pn8z8dd7o-tigdittgolf-9191s-projects.vercel.app`).

**Solution**: Vider le cache navigateur (Ctrl+Shift+Delete).

## Déploiements Effectués

1. **Commit 05400b9**: Fix Vercel routing + improve sidebar badge contrast
2. **Commit 47af188**: Add dynamic article route and fix hardcoded URLs
3. **Commit 72436c6**: Fix backend article routes to use backendDatabaseService

**URL Production Actuelle**: https://frontend-ebv7t7f12-habibbelkacemimosta-7724s-projects.vercel.app

## Prochaines Étapes

1. Décider de la stratégie de déploiement backend (Vercel, tunnel, ou Edge Functions)
2. Configurer les variables d'environnement appropriées
3. Tester l'application déployée avec le backend accessible
4. Exécuter le script SQL `FIX_RPC_FUNCTIONS_UPPERCASE_V2.sql` dans Supabase pour corriger les fonctions RPC
