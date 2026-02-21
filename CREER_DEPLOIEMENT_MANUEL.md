# 🚀 Créer un Déploiement Manuel sur Vercel

## 🎯 Situation Actuelle
- Projet Vercel: `st-article-1`
- GitHub: `tigdittgolf-lab/stock`
- Problème: Aucun déploiement en cours, pas de synchronisation

## 📋 ÉTAPES SIMPLES

### Étape 1: Aller sur le Projet
1. Va sur: https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1
2. Tu devrais voir la page du projet

### Étape 2: Vérifier la Connexion Git

**Option A: Si tu vois "Connect Git Repository"**
1. Clique sur "Connect Git Repository"
2. Choisis "GitHub"
3. Sélectionne le repository: `tigdittgolf-lab/stock`
4. Sélectionne le dossier: `frontend` (important!)
5. Clique sur "Continue"
6. Vercel va automatiquement déployer

**Option B: Si tu vois déjà un repository connecté**
1. Clique sur "Settings" (en haut)
2. Clique sur "Git" dans le menu de gauche
3. Vérifie que c'est bien: `tigdittgolf-lab/stock`
4. Si non, déconnecte et reconnecte (Option A)

### Étape 3: Créer un Nouveau Déploiement

**Si la connexion Git ne marche toujours pas:**

1. Va sur: https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1/deployments

2. Clique sur le bouton "Create Deployment" (en haut à droite)

3. Tu verras 2 options:
   - **Import from Git** → Choisis ça
   - Import from Template

4. Sélectionne:
   - Repository: `tigdittgolf-lab/stock`
   - Branch: `main`
   - Root Directory: `frontend` ⚠️ IMPORTANT

5. Clique sur "Deploy"

### Étape 4: Configuration du Root Directory

⚠️ **TRÈS IMPORTANT**: Le code frontend est dans le dossier `frontend/`

Si Vercel cherche à déployer depuis la racine du repo, ça ne marchera pas.

**Pour configurer:**
1. Settings → General
2. Cherche "Root Directory"
3. Mets: `frontend`
4. Save

## 🔧 Alternative: Créer un Nouveau Projet

Si rien ne marche, crée un nouveau projet:

1. Va sur: https://vercel.com/new

2. Clique sur "Import Git Repository"

3. Choisis: `tigdittgolf-lab/stock`

4. Configure:
   - Project Name: `frontend` (ou autre nom)
   - Framework Preset: Next.js
   - Root Directory: `frontend` ⚠️
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. Environment Variables (clique "Add"):
   ```
   NEXT_PUBLIC_API_URL = https://midi-charm-harvard-performed.trycloudflare.com/api
   NEXT_PUBLIC_SUPABASE_URL = https://szgodrjglbpzkrksnroi.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg
   ```

6. Clique sur "Deploy"

## 🔍 Diagnostic: Pourquoi Pas de Déploiement?

### Raison 1: Root Directory Incorrect
- Vercel cherche dans la racine du repo
- Mais le code Next.js est dans `frontend/`
- Solution: Configurer Root Directory = `frontend`

### Raison 2: Pas de Connexion Git
- Le projet existe mais n'est pas lié au repo GitHub
- Solution: Connecter le repo dans Settings → Git

### Raison 3: Webhook GitHub Manquant
- GitHub ne notifie pas Vercel des nouveaux commits
- Solution: Reconnecter le repo (Vercel recrée le webhook)

## 📊 Ce qu'on Cherche à Obtenir

```
GitHub (tigdittgolf-lab/stock)
    ↓
    └─ frontend/ (dossier)
         ↓
         └─ Vercel Project (st-article-1)
              ↓
              └─ Déploiement automatique à chaque commit
```

## 🔗 Liens Utiles

- **Dashboard Vercel**: https://vercel.com/habibbelkacemimosta-7724s-projects
- **Projet st-article-1**: https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1
- **Créer nouveau projet**: https://vercel.com/new
- **GitHub Repo**: https://github.com/tigdittgolf-lab/stock

---

**Dis-moi ce que tu vois sur la page Vercel et je t'aiderai à créer le déploiement!**
