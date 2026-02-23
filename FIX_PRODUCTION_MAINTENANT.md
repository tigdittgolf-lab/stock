# 🚨 FIX URGENT - Production ne fonctionne pas

## Problème

Ni les BL de vente ni les BL d'achat ne fonctionnent en production.
**Erreur**: HTTP 500 - "fetch failed"

## Cause

Les variables d'environnement Supabase ne sont **PAS configurées dans Vercel**.
Le code essaie de se connecter à Supabase mais les credentials sont manquants.

## Solution Rapide (3 options)

### Option 1: Dashboard Vercel (Le plus simple) ⭐

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez **st-article-1**
3. **Settings** → **Environment Variables**
4. Ajoutez ces 4 variables pour **Production, Preview, Development**:

```
NEXT_PUBLIC_SUPABASE_URL = https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg
SUPABASE_URL = https://szgodrjglbpzkrksnroi.supabase.co
```

5. Attendez le redéploiement automatique (2-3 minutes)
6. Testez vos pages!

### Option 2: Script PowerShell (Windows)

```powershell
.\setup-vercel-env.ps1
```

### Option 3: Script Bash (Linux/Mac)

```bash
chmod +x setup-vercel-env.sh
./setup-vercel-env.sh
```

## Vérification

Après le redéploiement, testez ces URLs:

- ✅ BL de Vente: `https://votre-app.vercel.app/delivery-notes/list`
- ✅ BL d'Achat: `https://votre-app.vercel.app/purchases/delivery-notes/list`

Les deux devraient maintenant afficher les données!

## Pourquoi ça marchait avant?

Si ça marchait avant et plus maintenant, c'est probablement parce que:
1. Les variables ont été supprimées accidentellement
2. Le projet a été redéployé sans les variables
3. Un changement de configuration Vercel

## Fichiers Créés

- `VERCEL_ENV_SETUP.md` - Guide détaillé
- `setup-vercel-env.ps1` - Script PowerShell automatique
- `setup-vercel-env.sh` - Script Bash automatique
- `PRODUCTION_DATABASE_FIX.md` - Diagnostic complet

## Besoin d'aide?

Si après avoir ajouté les variables ça ne marche toujours pas:
1. Vérifiez les logs Vercel (Dashboard → Deployments → Functions → Logs)
2. Vérifiez la console du navigateur (F12)
3. Contactez-moi avec les logs d'erreur
