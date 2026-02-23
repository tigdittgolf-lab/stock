# 🚨 ACTION IMMÉDIATE - Régression Production

## Situation

✅ **Avant**: L'application fonctionnait parfaitement
❌ **Après dernier push (4c2d9bb)**: Erreur 500 sur BL vente ET achat
⏰ **Quand**: Depuis le déploiement de "Optimisations majeures pages d'achat"

## Cause Probable

Le dernier commit a ajouté `ngrok.exe` (32MB) au repo, ce qui peut:
- Causer des problèmes de build Vercel
- Avoir réinitialisé les variables d'environnement
- Créer des timeouts

## Solution en 3 Étapes

### Étape 1: Nettoyer le Repo (2 min)

```powershell
.\fix-production-regression.ps1
```

Ou manuellement:
```powershell
git rm ngrok.exe
echo "ngrok.exe" >> .gitignore
git add .gitignore
git commit -m "chore: Remove ngrok.exe and add to gitignore"
git push
```

### Étape 2: Vérifier les Variables Vercel (3 min)

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez **st-article-1**
3. **Settings** → **Environment Variables**
4. Vérifiez que ces variables existent pour **Production**:

```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ SUPABASE_SERVICE_ROLE_KEY
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_URL
```

**Si elles manquent**, les rajouter avec les valeurs de `backend/.env`:

```
NEXT_PUBLIC_SUPABASE_URL = https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg
SUPABASE_URL = https://szgodrjglbpzkrksnroi.supabase.co
```

### Étape 3: Attendre et Tester (2-3 min)

1. Vercel redéploiera automatiquement
2. Attendez 2-3 minutes
3. Testez:
   - BL de Vente: `https://votre-app.vercel.app/delivery-notes/list`
   - BL d'Achat: `https://votre-app.vercel.app/purchases/delivery-notes/list`

## Si Ça Ne Marche Toujours Pas

### Option A: Vérifier les Logs Vercel

1. Dashboard → Deployments → Dernier déploiement
2. Cliquez sur **Functions**
3. Regardez les logs pour voir l'erreur exacte

### Option B: Rollback au Commit Précédent

```powershell
# Revenir au commit qui fonctionnait
git revert 4c2d9bb
git push
```

Cela annulera les optimisations mais restaurera le fonctionnement.

## Pourquoi Ça a Cassé?

Votre application est multi-base de données et utilise:
- Routes API Next.js qui appellent Supabase directement
- Variables d'environnement pour les credentials Supabase

Le problème probable:
1. Le gros fichier `ngrok.exe` a causé un problème de build
2. Les variables d'environnement ont été réinitialisées
3. Le nouveau déploiement n'a pas les credentials Supabase

## Architecture de Votre App

```
[Frontend Vercel]
    ↓
[Routes API Next.js] (/api/purchases, /api/sales)
    ↓
[Supabase Cloud] ← Besoin des variables d'environnement!
    ↓
[Schémas Tenants] (2009_bu02, 2025_bu01, etc.)
```

En local, vous pouvez aussi utiliser:
- MySQL local via ngrok
- PostgreSQL local via ngrok

Mais en production Vercel, seul Supabase cloud fonctionne (via les routes API Next.js).

## Checklist

- [ ] ngrok.exe supprimé du repo
- [ ] .gitignore mis à jour
- [ ] Changements pushés
- [ ] Variables Vercel vérifiées
- [ ] Variables manquantes rajoutées (si nécessaire)
- [ ] Redéploiement attendu (2-3 min)
- [ ] Pages testées

## Temps Total Estimé

⏱️ **5-10 minutes** pour tout corriger

## Besoin d'Aide?

Si après ces étapes ça ne marche toujours pas:
1. Copiez les logs d'erreur de Vercel (Functions → Logs)
2. Copiez les erreurs de la console navigateur (F12)
3. Contactez-moi avec ces informations

## Fichiers de Référence

- `DIAGNOSTIC_REGRESSION_PRODUCTION.md` - Diagnostic complet
- `fix-production-regression.ps1` - Script automatique
- `backend/.env` - Variables d'environnement de référence
