# Étapes Simples pour Corriger la Production

## Situation

Le fichier `ngrok.exe` a été supprimé localement mais Git est bloqué.

## Solution en 3 Étapes

### Étape 1: Fermer Tous les Processus Git

Fermez:
- ✓ VS Code (si ouvert)
- ✓ GitHub Desktop (si ouvert)
- ✓ Tout terminal Git
- ✓ Tout éditeur qui pourrait utiliser Git

### Étape 2: Exécuter le Script de Commit

```powershell
.\commit-fix.ps1
```

Si ça ne marche toujours pas, faites manuellement:

```powershell
# Supprimer le lock
del .git\index.lock

# Ajouter et commiter
git add .gitignore
git rm ngrok.exe --cached
git commit -m "chore: Remove ngrok.exe and add to gitignore"
git push
```

### Étape 3: Vérifier les Variables Vercel

**C'est l'étape la plus importante!**

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez **st-article-1**
3. Cliquez sur **Settings** (menu gauche)
4. Cliquez sur **Environment Variables**
5. Vérifiez que ces 4 variables existent pour **Production**:

```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ SUPABASE_SERVICE_ROLE_KEY
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_URL
```

### Si Variables Manquantes

Cliquez sur **Add New** et ajoutez:

**Variable 1:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://szgodrjglbpzkrksnroi.supabase.co
Environment: Production, Preview, Development
```

**Variable 2:**
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU
Environment: Production, Preview, Development
```

**Variable 3:**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg
Environment: Production, Preview, Development
```

**Variable 4:**
```
Name: SUPABASE_URL
Value: https://szgodrjglbpzkrksnroi.supabase.co
Environment: Production, Preview, Development
```

### Étape 4: Attendre et Tester

1. Vercel redéploiera automatiquement (2-3 minutes)
2. Testez vos pages:
   - BL de Vente: https://votre-app.vercel.app/delivery-notes/list
   - BL d'Achat: https://votre-app.vercel.app/purchases/delivery-notes/list

## C'est Tout!

Si les variables Supabase sont bien configurées dans Vercel, tout devrait fonctionner.

## Pourquoi Ça a Cassé?

Le dernier déploiement a probablement:
1. Eu un problème avec le gros fichier `ngrok.exe` (32MB)
2. Réinitialisé ou perdu les variables d'environnement

En ajoutant/vérifiant les variables Supabase dans Vercel, tout redevient fonctionnel.

## Note Importante

`ngrok.exe` ne devrait JAMAIS être dans Git. C'est un exécutable de 32MB qui:
- Ralentit Git
- Cause des problèmes de déploiement
- N'est pas nécessaire en production

Gardez-le localement mais pas dans le repo.
