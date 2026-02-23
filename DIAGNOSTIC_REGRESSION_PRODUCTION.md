# 🔍 Diagnostic - Régression Production Après Dernier Push

## Contexte Important

✅ **L'application fonctionnait avant le dernier push/déploiement**
✅ **Architecture multi-base de données**: Supabase cloud, MySQL local, PostgreSQL local
✅ **Utilisation de ngrok** pour accès distant au backend local
✅ **Les variables d'environnement étaient déjà configurées**

## Dernier Commit

```
4c2d9bb - feat: Optimisations majeures pages d'achat - Dark mode + Performance
Date: Mon Feb 23 00:50:38 2026
```

### Fichiers Modifiés Critiques

- `backend/src/routes/purchases.ts` - Routes achats modifiées
- `backend/src/routes/sales.ts` - Routes ventes modifiées
- `frontend/app/api/sales/delivery-notes/[id]/route.ts` - Route API modifiée
- 7 pages frontend achats
- `ngrok.exe` ajouté au repo (32MB!)

## Problème Actuel

❌ Erreur 500 sur `/api/sales/delivery-notes`
❌ Erreur 500 sur `/api/purchases/delivery-notes`
❌ Message: `"fetch failed"`

## Hypothèses

### 1. Problème de Déploiement Vercel

Le fichier `ngrok.exe` (32MB) a été ajouté au repo. Cela peut:
- Ralentir le build
- Causer des timeouts
- Dépasser les limites de taille

**Action**: Vérifier les logs de build Vercel

### 2. Variables d'Environnement Écrasées

Le redéploiement peut avoir réinitialisé les variables d'environnement.

**Action**: Vérifier dans Vercel Dashboard → Settings → Environment Variables

### 3. Changement dans les Routes API

Bien que `git diff` ne montre pas de changement dans les routes API Next.js, il peut y avoir un problème de cache ou de build.

**Action**: Forcer un rebuild complet

### 4. Problème de CORS ou Headers

Les modifications dans `backend/src/routes/purchases.ts` et `sales.ts` peuvent avoir affecté les headers.

**Action**: Vérifier les logs backend

## Actions Immédiates

### 1. Vérifier les Variables d'Environnement Vercel

Allez sur: https://vercel.com/dashboard → st-article-1 → Settings → Environment Variables

Vérifiez que ces variables existent pour **Production**:

```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ SUPABASE_SERVICE_ROLE_KEY
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_URL
✓ BACKEND_URL (si utilisé)
✓ NEXT_PUBLIC_API_URL (si utilisé)
```

### 2. Vérifier les Logs de Build Vercel

1. Dashboard Vercel → Deployments
2. Cliquez sur le dernier déploiement (4c2d9bb)
3. Regardez les logs de build
4. Cherchez:
   - Erreurs de build
   - Warnings sur la taille
   - Timeouts

### 3. Vérifier les Logs Runtime

1. Dashboard Vercel → Deployments → Functions
2. Regardez les logs des routes API
3. Cherchez:
   - Erreurs Supabase
   - Variables undefined
   - Erreurs de connexion

### 4. Supprimer ngrok.exe du Repo

Ce fichier ne devrait PAS être dans le repo Git!

```powershell
# Supprimer ngrok.exe du repo
git rm ngrok.exe

# Ajouter au .gitignore
echo "ngrok.exe" >> .gitignore

# Commit
git add .gitignore
git commit -m "chore: Remove ngrok.exe from repo and add to gitignore"

# Push
git push
```

### 5. Forcer un Rebuild Complet

```powershell
# Option A: Via commit vide
git commit --allow-empty -m "chore: Force rebuild"
git push

# Option B: Via Vercel Dashboard
# Deployments → ... → Redeploy
```

## Vérifications Détaillées

### Vérifier que les Routes API Existent

Les routes suivantes doivent exister dans le déploiement:

```
✓ /api/sales/delivery-notes
✓ /api/purchases/delivery-notes
✓ /api/sales/articles
✓ /api/sales/clients
✓ /api/sales/suppliers
```

### Vérifier la Configuration Supabase

Dans Supabase Dashboard, vérifiez que les fonctions RPC existent:

```sql
-- Pour les BL de vente
SELECT * FROM pg_proc WHERE proname = 'get_bl_list';

-- Pour les BL d'achat
SELECT * FROM pg_proc WHERE proname = 'get_purchase_bl_list';
```

### Vérifier les Permissions Supabase

La clé `SUPABASE_SERVICE_ROLE_KEY` doit avoir les permissions pour:
- Appeler les fonctions RPC
- Accéder aux schémas tenants (2009_bu02, 2025_bu01, etc.)

## Solution Rapide si Variables Manquantes

Si les variables d'environnement ont été effacées, les rajouter:

```
NEXT_PUBLIC_SUPABASE_URL = https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg
SUPABASE_URL = https://szgodrjglbpzkrksnroi.supabase.co
```

## Rollback si Nécessaire

Si rien ne fonctionne, revenir au commit précédent:

```powershell
# Revenir au commit avant les optimisations
git revert 4c2d9bb

# Ou reset complet (ATTENTION: perd les changements)
git reset --hard dd9bec6
git push --force
```

## Checklist de Diagnostic

- [ ] Variables d'environnement vérifiées dans Vercel
- [ ] Logs de build vérifiés (pas d'erreur)
- [ ] Logs runtime vérifiés (pas d'erreur Supabase)
- [ ] ngrok.exe supprimé du repo
- [ ] Rebuild forcé
- [ ] Routes API testées individuellement
- [ ] Fonctions RPC Supabase vérifiées
- [ ] Permissions Supabase vérifiées

## Prochaines Étapes

1. **Immédiat**: Vérifier les variables d'environnement Vercel
2. **Si variables OK**: Vérifier les logs de build/runtime
3. **Si logs OK**: Supprimer ngrok.exe et rebuild
4. **Si toujours KO**: Rollback au commit précédent

## Notes

- Le problème est apparu APRÈS le dernier push
- Donc c'est soit un problème de déploiement, soit un problème de configuration
- PAS un problème de code (puisque ça marchait avant)
- Focus sur l'infrastructure et la configuration Vercel
