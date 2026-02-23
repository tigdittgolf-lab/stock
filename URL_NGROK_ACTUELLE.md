# ✅ Ngrok est Démarré!

## URL Ngrok Actuelle

```
https://karmen-unordainable-irvin.ngrok-free.dev
```

## Action Immédiate: Mettre à Jour Vercel

### 1. Allez sur Vercel

https://vercel.com/dashboard

### 2. Sélectionnez st-article-1

Cliquez sur votre projet **st-article-1**

### 3. Settings → Environment Variables

Dans le menu de gauche, cliquez sur **Settings**, puis **Environment Variables**

### 4. Mettez à Jour ou Ajoutez Ces Variables

Pour **Production, Preview, et Development**:

#### Variable 1: BACKEND_URL
```
Name: BACKEND_URL
Value: https://karmen-unordainable-irvin.ngrok-free.dev
Environments: ✓ Production ✓ Preview ✓ Development
```

#### Variable 2: NEXT_PUBLIC_API_URL
```
Name: NEXT_PUBLIC_API_URL
Value: https://karmen-unordainable-irvin.ngrok-free.dev/api
Environments: ✓ Production ✓ Preview ✓ Development
```

### 5. Vérifiez les Variables Supabase

Assurez-vous que ces variables existent aussi:

```
✓ NEXT_PUBLIC_SUPABASE_URL = https://szgodrjglbpzkrksnroi.supabase.co
✓ SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg
✓ SUPABASE_URL = https://szgodrjglbpzkrksnroi.supabase.co
```

### 6. Attendez le Redéploiement

Vercel va automatiquement redéployer (2-3 minutes).

### 7. Testez Votre Application

Une fois le déploiement terminé, testez:

- Articles: https://votre-app.vercel.app/articles
- Clients: https://votre-app.vercel.app/clients
- Fournisseurs: https://votre-app.vercel.app/suppliers
- BL de Vente: https://votre-app.vercel.app/delivery-notes/list
- BL d'Achat: https://votre-app.vercel.app/purchases/delivery-notes/list

Toutes vos données devraient réapparaître!

## Important

### Gardez Ngrok Ouvert

La fenêtre ngrok DOIT rester ouverte en permanence.

Si vous fermez ngrok:
- Vercel ne pourra plus accéder à votre backend
- Vos données disparaîtront à nouveau

### Interface Web Ngrok

Vous pouvez voir les requêtes en temps réel sur:
http://127.0.0.1:4040

### Redémarrer Ngrok

Si vous devez redémarrer ngrok, l'URL changera. Vous devrez:
1. Noter la nouvelle URL
2. Mettre à jour BACKEND_URL et NEXT_PUBLIC_API_URL dans Vercel
3. Attendre le redéploiement

## Vérification Rapide

Pour vérifier que ngrok fonctionne:

```powershell
Invoke-WebRequest -Uri https://karmen-unordainable-irvin.ngrok-free.dev/health -UseBasicParsing
```

Devrait retourner: `{"status":"OK",...}`

## Architecture Actuelle

```
[Utilisateur]
    ↓
[Vercel Frontend]
    ↓
[Ngrok Tunnel] https://karmen-unordainable-irvin.ngrok-free.dev
    ↓
[Backend Local] http://localhost:3005
    ↓
[Bases de Données]
    ├─→ Supabase Cloud
    ├─→ MySQL Local
    └─→ PostgreSQL Local
```

## Checklist

- [x] Ngrok mis à jour
- [x] Ngrok démarré
- [x] URL ngrok obtenue
- [ ] BACKEND_URL mis à jour dans Vercel
- [ ] NEXT_PUBLIC_API_URL mis à jour dans Vercel
- [ ] Variables Supabase vérifiées
- [ ] Redéploiement attendu (2-3 min)
- [ ] Application testée
- [ ] Données visibles

## Prochaine Étape

**Allez maintenant sur Vercel et mettez à jour les variables!**

https://vercel.com/dashboard
