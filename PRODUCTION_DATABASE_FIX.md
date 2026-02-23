# Fix: BL d'Achat manquants en Production

## Problème Identifié

En production (Vercel), aucun BL d'achat n'est visible, alors qu'en développement local, plusieurs BL d'achat sont présents.

## ⚠️ PROBLÈME RÉEL: Mauvaise URL!

**Vous êtes sur la mauvaise page!**

Les logs montrent que vous appelez: `GET /api/sales/delivery-notes` (BL de VENTE)
Mais vous voulez voir: `GET /api/purchases/delivery-notes` (BL d'ACHAT)

### Solution Immédiate

Changez l'URL dans votre navigateur:
- ❌ **Mauvais**: `https://frontend-gamma-tan-26.vercel.app/delivery-notes/list`
- ✅ **Correct**: `https://frontend-gamma-tan-26.vercel.app/purchases/delivery-notes/list`

Ou depuis le dashboard, cliquez sur le bouton "BL d'Achat" qui devrait vous rediriger vers `/purchases/delivery-notes/list`.

## Cause Racine (si le problème persiste après avoir changé l'URL)

Les variables d'environnement Supabase ne sont **pas configurées dans Vercel**. Le fichier `.env.vercel` ne contient que le token OIDC, mais pas les credentials de la base de données.

### Variables Manquantes en Production:
```
SUPABASE_URL=https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Sans ces variables, le backend ne peut pas se connecter à Supabase, donc:
- Aucune donnée n'est récupérée
- Les requêtes échouent silencieusement
- L'application utilise des données de fallback vides

## Solution

### Étape 1: Ajouter les Variables d'Environnement dans Vercel

1. Aller sur le dashboard Vercel: https://vercel.com/dashboard
2. Sélectionner le projet: **st-article-1**
3. Aller dans **Settings** → **Environment Variables**
4. Ajouter les variables suivantes pour **Production, Preview, et Development**:

```bash
SUPABASE_URL=https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU
JWT_SECRET=4b5546596ba4ffc0d9a9e404ff6d890e3e9b72c6248ead0b08b8c1e124974e89
```

### Étape 2: Variables Optionnelles (si nécessaire)

Si vous utilisez WhatsApp, Redis, ou d'autres services:

```bash
# WhatsApp (optionnel)
WHATSAPP_BUSINESS_ACCOUNT_ID=726078073628981
WHATSAPP_PHONE_NUMBER_ID=1003772659482663
WHATSAPP_ACCESS_TOKEN=EABAt72ZAXWokBQ...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=stockdz_webhook_secret_2024_xyz
WHATSAPP_API_VERSION=v18.0

# Redis (optionnel)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Étape 3: Redéployer

Après avoir ajouté les variables:
1. Vercel redéploiera automatiquement
2. OU déclencher un redéploiement manuel depuis le dashboard
3. OU faire un nouveau commit/push pour déclencher le déploiement

```bash
git commit --allow-empty -m "chore: Trigger redeploy after env vars update"
git push
```

## Vérification

Après le redéploiement, vérifier:

1. **Backend logs** dans Vercel:
   - Chercher: `📋 Fetching purchase delivery notes for tenant:`
   - Devrait afficher: `✅ Returning X purchase delivery notes`

2. **Frontend**:
   - Aller sur `/purchases/delivery-notes/list`
   - Les BL d'achat devraient maintenant s'afficher

3. **API directe**:
   ```bash
   curl -H "X-Tenant: 2009_bu02" https://votre-backend.vercel.app/api/purchases/delivery-notes
   ```

## Pourquoi ça marche en développement?

En développement local:
- Le fichier `backend/.env` contient toutes les variables nécessaires
- Le backend lit automatiquement ce fichier
- La connexion Supabase fonctionne correctement

En production (Vercel):
- Les fichiers `.env` ne sont **pas déployés** (pour des raisons de sécurité)
- Vercel utilise uniquement les variables configurées dans le dashboard
- Sans ces variables, le backend ne peut pas se connecter à la base de données

## Architecture Multi-Tenant

L'application utilise une architecture multi-tenant avec Supabase:
- Chaque tenant (2009_bu02, 2025_bu01, etc.) est un schéma PostgreSQL séparé
- Le header `X-Tenant` détermine quel schéma utiliser
- Les fonctions RPC (Remote Procedure Call) sont utilisées pour accéder aux données

## Commandes Utiles

### Vérifier les variables d'environnement Vercel (CLI)
```bash
vercel env ls
```

### Ajouter une variable via CLI
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### Voir les logs de production
```bash
vercel logs
```

## Résumé

**Problème**: Variables d'environnement manquantes en production
**Solution**: Ajouter SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans Vercel
**Résultat**: Les BL d'achat s'afficheront correctement en production
