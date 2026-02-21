# 🚀 Déploiement Manuel Vercel - Instructions

## ⚠️ Problème
- Vercel CLI ne fonctionne pas (erreurs d'installation)
- Vercel ne détecte pas automatiquement les commits GitHub
- Le build local échoue sans les variables d'environnement

## ✅ Solution: Configuration Manuelle via l'Interface Vercel

### Étape 1: Configurer les Variables d'Environnement

1. **Va sur**: https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1/settings/environment-variables

2. **Ajoute ces variables** (clique sur "Add" pour chacune):

```
NEXT_PUBLIC_API_URL
Value: https://midi-charm-harvard-performed.trycloudflare.com/api
Environments: ✓ Production ✓ Preview ✓ Development
```

```
NEXT_PUBLIC_SUPABASE_URL
Value: https://szgodrjglbpzkrksnroi.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg
Environments: ✓ Production ✓ Preview ✓ Development
```

```
NODE_ENV
Value: production
Environments: ✓ Production
```

### Étape 2: Vérifier la Connexion Git

1. **Va sur**: https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1/settings/git

2. **Vérifie**:
   - Repository: `tigdittgolf-lab/stock`
   - Branch: `main`
   - Status: Connected ✓

3. **Si déconnecté**:
   - Clique sur "Connect Git Repository"
   - Sélectionne `tigdittgolf-lab/stock`
   - Confirme

### Étape 3: Forcer le Redéploiement

1. **Va sur**: https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1/deployments

2. **Trouve le dernier déploiement**

3. **Clique sur les 3 points (...)** à droite

4. **Clique sur "Redeploy"**

5. **Confirme**

6. **Attends 2-3 minutes** que le déploiement se termine

### Étape 4: Vérifier le Déploiement

Une fois terminé:

1. **Vérifie le commit**:
   - Le déploiement doit afficher: `32a4bc6`
   - Message: "fix: Replace Tailscale with Cloudflare in all API routes"

2. **Teste l'application**:
   - URL: https://frontend-809mt1gt5-habibbelkacemimosta-7724s-projects.vercel.app
   - Login: admin / admin123
   - Vérifie que les données se chargent

3. **Console (F12)**:
   - Plus d'erreurs 500
   - Requêtes vers: `midi-charm-harvard-performed.trycloudflare.com`

## 📊 Résumé des Changements à Déployer

### Code GitHub (✅ Déjà poussé)
```
32a4bc6 - fix: Replace Tailscale with Cloudflare in all API routes
  ✓ 9 routes API corrigées
  ✓ vercel.json mis à jour
  ✓ Toutes les URLs Tailscale remplacées par Cloudflare
```

### Variables d'Environnement (⚠️ À configurer)
- `NEXT_PUBLIC_API_URL` → Cloudflare tunnel
- `NEXT_PUBLIC_SUPABASE_URL` → Supabase Cloud
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Clé publique Supabase

## 🔗 Liens Rapides

- **Variables d'environnement**: https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1/settings/environment-variables
- **Configuration Git**: https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1/settings/git
- **Déploiements**: https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1/deployments
- **Application**: https://frontend-809mt1gt5-habibbelkacemimosta-7724s-projects.vercel.app

## ⏱️ Temps Estimé
- Configuration variables: 2 minutes
- Vérification Git: 30 secondes
- Redéploiement: 2-3 minutes
- **Total: ~5 minutes**

---

**Date**: 21 février 2026, 15:00 UTC
**Action requise**: Configuration manuelle via l'interface Vercel
