# Restaurer la Configuration Ngrok

## Situation

Ngrok est maintenant démarré et expose votre backend local.

## Étapes pour Restaurer

### 1. Récupérer l'URL Ngrok

Dans la fenêtre ngrok qui s'est ouverte, vous verrez quelque chose comme:

```
Forwarding  https://abc123-xyz.ngrok-free.app -> http://localhost:3005
```

**Copiez cette URL**: `https://abc123-xyz.ngrok-free.app`

### 2. Mettre à Jour Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez **st-article-1**
3. **Settings** → **Environment Variables**
4. Cherchez ou ajoutez ces 2 variables pour **Production, Preview, Development**:

```
BACKEND_URL = https://VOTRE-URL-NGROK.ngrok-free.app
NEXT_PUBLIC_API_URL = https://VOTRE-URL-NGROK.ngrok-free.app/api
```

**Remplacez `VOTRE-URL-NGROK` par l'URL que vous avez copiée!**

### 3. Ajouter les Variables Supabase (si manquantes)

Vérifiez aussi que ces variables existent:

```
NEXT_PUBLIC_SUPABASE_URL = https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg
SUPABASE_URL = https://szgodrjglbpzkrksnroi.supabase.co
```

### 4. Attendre le Redéploiement

Vercel redéploiera automatiquement (2-3 minutes).

### 5. Tester

Testez vos pages:
- Articles: https://votre-app.vercel.app/articles
- Clients: https://votre-app.vercel.app/clients  
- Fournisseurs: https://votre-app.vercel.app/suppliers
- BL de Vente: https://votre-app.vercel.app/delivery-notes/list
- BL d'Achat: https://votre-app.vercel.app/purchases/delivery-notes/list

## Important

### Garder Ngrok Ouvert

Ngrok DOIT rester ouvert en permanence pour que Vercel puisse accéder à votre backend local.

Si vous fermez ngrok:
- L'application en production ne fonctionnera plus
- Vous devrez redémarrer ngrok et mettre à jour l'URL dans Vercel

### URL Ngrok Change

Avec la version gratuite de ngrok, l'URL change à chaque redémarrage.

Si vous redémarrez ngrok:
1. Notez la nouvelle URL
2. Mettez à jour BACKEND_URL et NEXT_PUBLIC_API_URL dans Vercel
3. Attendez le redéploiement

### Ngrok Permanent

Pour avoir une URL permanente:
1. Créez un compte ngrok: https://dashboard.ngrok.com/signup
2. Obtenez votre authtoken
3. Configurez: `ngrok config add-authtoken VOTRE_TOKEN`
4. Utilisez un domaine réservé (plan payant) ou acceptez l'URL qui change

## Architecture Actuelle

```
[Utilisateur]
    ↓
[Vercel Frontend]
    ↓
[Ngrok Tunnel] ← DOIT RESTER OUVERT!
    ↓
[Backend Local] (localhost:3005)
    ↓
[Base de Données]
    ├─→ Supabase Cloud
    ├─→ MySQL Local
    └─→ PostgreSQL Local
```

## Vérification Rapide

Pour vérifier que tout fonctionne:

```powershell
# Verifier que le backend local repond
Invoke-WebRequest -Uri http://localhost:3005/health -UseBasicParsing

# Verifier que ngrok fonctionne (remplacez par votre URL)
Invoke-WebRequest -Uri https://VOTRE-URL.ngrok-free.app/health -UseBasicParsing
```

Les deux doivent retourner `{"status":"OK",...}`

## Redémarrer Ngrok

Si vous devez redémarrer ngrok:

```powershell
.\start-ngrok.ps1
```

Puis mettez à jour l'URL dans Vercel.

## Checklist

- [ ] Ngrok démarré
- [ ] URL ngrok copiée
- [ ] BACKEND_URL mis à jour dans Vercel
- [ ] NEXT_PUBLIC_API_URL mis à jour dans Vercel
- [ ] Variables Supabase vérifiées
- [ ] Redéploiement attendu (2-3 min)
- [ ] Pages testées
- [ ] Données (articles, clients, fournisseurs) visibles
