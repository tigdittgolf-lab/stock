# Configuration Urgente - Variables d'Environnement Vercel

## 🚨 Problème Actuel

Les BL de vente ET les BL d'achat retournent une erreur 500 en production.
Les routes API Next.js ne peuvent pas se connecter à Supabase car les variables d'environnement sont manquantes dans Vercel.

**Erreur**: `fetch failed` avec code 500
**Cause**: Variables Supabase non configurées dans Vercel

## ✅ Solution Rapide (via Dashboard Vercel)

### Étape 1: Accéder aux Variables d'Environnement

1. Allez sur: https://vercel.com/dashboard
2. Sélectionnez votre projet: **st-article-1**
3. Cliquez sur **Settings** (dans le menu de gauche)
4. Cliquez sur **Environment Variables**

### Étape 2: Ajouter les Variables Critiques

Ajoutez ces 4 variables pour **Production, Preview, et Development**:

#### Variable 1: NEXT_PUBLIC_SUPABASE_URL
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://szgodrjglbpzkrksnroi.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development
```

#### Variable 2: SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU
Environments: ✓ Production ✓ Preview ✓ Development
```

#### Variable 3: NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg
Environments: ✓ Production ✓ Preview ✓ Development
```

#### Variable 4: SUPABASE_URL (sans NEXT_PUBLIC)
```
Name: SUPABASE_URL
Value: https://szgodrjglbpzkrksnroi.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development
```

### Étape 3: Redéployer

Après avoir ajouté les variables:
1. Vercel redéploiera automatiquement
2. Attendez 2-3 minutes
3. Testez à nouveau vos pages

## 🔧 Solution Alternative (via CLI)

Si vous préférez utiliser la ligne de commande:

```bash
# Installer Vercel CLI (si pas déjà fait)
npm install -g vercel

# Se connecter
vercel login

# Ajouter les variables
vercel env add SUPABASE_URL production
# Coller: https://szgodrjglbpzkrksnroi.supabase.co

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Coller la clé complète

vercel env add JWT_SECRET production
# Coller: 4b5546596ba4ffc0d9a9e404ff6d890e3e9b72c6248ead0b08b8c1e124974e89

# Répéter pour preview et development
vercel env add SUPABASE_URL preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add JWT_SECRET preview

# Redéployer
vercel --prod
```

## 📊 Vérification

Après le redéploiement, vérifiez:

### 1. Vérifier les Variables
```bash
vercel env ls
```

Vous devriez voir:
```
SUPABASE_URL                    Production, Preview, Development
SUPABASE_SERVICE_ROLE_KEY       Production, Preview, Development
JWT_SECRET                      Production, Preview, Development
```

### 2. Vérifier les Logs Backend

Dans le dashboard Vercel:
1. Allez dans **Deployments**
2. Cliquez sur le dernier déploiement
3. Cliquez sur **Functions**
4. Regardez les logs pour voir si la connexion Supabase fonctionne

Cherchez ces messages:
- ✅ `📋 Fetching purchase delivery notes for tenant: 2009_bu02`
- ✅ `✅ Returning X purchase delivery notes`

### 3. Tester les Pages

Testez ces URLs:
- BL de Vente: `https://votre-app.vercel.app/delivery-notes/list`
- BL d'Achat: `https://votre-app.vercel.app/purchases/delivery-notes/list`

Les deux devraient maintenant fonctionner!

## 🔍 Diagnostic si ça ne marche toujours pas

Si après avoir ajouté les variables, ça ne marche toujours pas:

### Vérifier que le Backend est déployé

Le backend doit être dans le même projet Vercel ou accessible via une URL.
Vérifiez dans `frontend/lib/api.ts` ou `frontend/lib/config.ts` l'URL du backend.

### Vérifier les Logs d'Erreur

Dans Vercel Dashboard → Deployments → Functions → Logs, cherchez:
- Erreurs de connexion Supabase
- Erreurs "SUPABASE_URL is not defined"
- Erreurs "Cannot connect to database"

### Vérifier la Structure du Projet

Assurez-vous que:
- Le dossier `backend/` est bien déployé
- Le fichier `backend/index.ts` est l'entry point
- Le `package.json` a les bonnes dépendances

## 📝 Notes Importantes

1. **Sécurité**: Les variables d'environnement dans Vercel sont sécurisées et ne sont pas exposées au client
2. **Redéploiement**: Chaque changement de variable nécessite un redéploiement
3. **Cache**: Videz le cache du navigateur après le redéploiement
4. **Temps**: Le redéploiement prend 2-5 minutes

## 🆘 Si Rien ne Marche

Contactez-moi avec:
1. Les logs du backend (depuis Vercel Dashboard)
2. Les erreurs dans la console du navigateur (F12)
3. La liste des variables d'environnement (sans les valeurs sensibles)
