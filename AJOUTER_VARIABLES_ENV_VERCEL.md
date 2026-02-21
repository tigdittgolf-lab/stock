# 🔧 Ajouter les Variables d'Environnement Vercel

## ❌ Problème Actuel

Les routes API retournent des erreurs 500:
```
❌ api/sales/clients: 500
❌ api/sales/articles: 500  
❌ api/sales/suppliers: 500
```

**Cause**: Les routes API ne savent pas où est le backend (variable `BACKEND_URL` manquante)

## ✅ Solution: Ajouter 4 Variables

Page déjà ouverte: https://vercel.com/habibbelkacemimosta-7724s-projects/frontend/settings/environment-variables

### Variable 1: BACKEND_URL
```
Name: BACKEND_URL
Value: https://midi-charm-harvard-performed.trycloudflare.com
Environments: ✓ Production ✓ Preview ✓ Development
```

### Variable 2: NEXT_PUBLIC_API_URL
```
Name: NEXT_PUBLIC_API_URL
Value: https://midi-charm-harvard-performed.trycloudflare.com/api
Environments: ✓ Production ✓ Preview ✓ Development
```

### Variable 3: NEXT_PUBLIC_SUPABASE_URL
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://szgodrjglbpzkrksnroi.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development
```

### Variable 4: NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg
Environments: ✓ Production ✓ Preview ✓ Development
```

## 📋 Comment Ajouter (Pour Chaque Variable)

1. **Clique sur "Add"** (bouton en haut à droite)

2. **Remplis le formulaire**:
   - Name: [copie le nom ci-dessus]
   - Value: [copie la valeur ci-dessus]
   - Environments: Coche les 3 cases (Production, Preview, Development)

3. **Clique sur "Save"**

4. **Répète pour les 4 variables**

## ⚠️ IMPORTANT: Redéployer Après

Une fois les 4 variables ajoutées:

1. **Va sur Deployments**:
   https://vercel.com/habibbelkacemimosta-7724s-projects/frontend/deployments

2. **Redéploie** (3 points → Redeploy)

3. **Attends 2-3 minutes**

4. **Teste à nouveau**

## 🧪 Vérification

Après le redéploiement, tu devrais voir dans la console:

**✅ Ce qui DOIT apparaître:**
```
🌐 BACKEND_URL configured: https://midi-charm-harvard-performed.trycloudflare.com
🎯 Full URL: https://midi-charm-harvard-performed.trycloudflare.com/api/sales/suppliers
✅ Frontend API: Received [nombre] suppliers from backend
```

**❌ Plus d'erreurs 500**

## 📊 Résumé

**Étape 1**: Ajouter 4 variables d'environnement (5 minutes)
**Étape 2**: Redéployer (2-3 minutes)
**Étape 3**: Tester l'application
**Total**: ~10 minutes

---

**Action immédiate**: Ajoute les 4 variables sur la page qui vient de s'ouvrir
