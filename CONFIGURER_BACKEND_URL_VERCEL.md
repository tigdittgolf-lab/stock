# Configuration BACKEND_URL dans Vercel

## Problème Actuel
La route `/api/purchases/delivery-notes/60754/MOSTA` retourne 404 même après le déploiement.

## Solution: Configurer BACKEND_URL

### Étape 1: Accéder à Vercel Dashboard
1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet `frontend-gamma-tan-26`

### Étape 2: Configurer la Variable d'Environnement
1. Cliquer sur **Settings** (dans le menu du projet)
2. Cliquer sur **Environment Variables** (dans le menu de gauche)
3. Ajouter une nouvelle variable:
   - **Name**: `BACKEND_URL`
   - **Value**: `https://karmen-unordainable-irvin.ngrok-free.dev`
   - **Environment**: Cocher **Production**, **Preview**, et **Development**
4. Cliquer sur **Save**

### Étape 3: Redéployer
Après avoir ajouté la variable, Vercel va automatiquement redéployer.
Si ce n'est pas le cas:
1. Aller dans **Deployments**
2. Cliquer sur le dernier déploiement
3. Cliquer sur **Redeploy**

### Étape 4: Vérifier Ngrok
Assurez-vous que ngrok est démarré et accessible:

```powershell
# Vérifier que ngrok est en cours d'exécution
Get-Process ngrok

# Si non démarré, le démarrer
.\start-ngrok.ps1

# Vérifier l'URL ngrok actuelle
# L'URL doit être: https://karmen-unordainable-irvin.ngrok-free.dev
```

### Étape 5: Tester
Une fois le déploiement terminé (1-2 minutes):
1. Rafraîchir la page de l'application
2. Aller dans BL d'Achat
3. Cliquer sur un BL pour voir les détails

## Vérification des Logs Vercel

Pour voir les logs de déploiement:
1. Aller dans **Deployments**
2. Cliquer sur le dernier déploiement
3. Cliquer sur **View Function Logs**

Chercher les erreurs liées à:
- `BACKEND_URL`
- `purchases/delivery-notes`
- 404 errors

## Alternative: Tester en Local

Pour vérifier que tout fonctionne en local:

```bash
# Terminal 1: Démarrer le backend
cd backend
npm run dev

# Terminal 2: Démarrer ngrok
.\start-ngrok.ps1

# Terminal 3: Démarrer le frontend avec la variable
cd frontend
$env:BACKEND_URL="https://karmen-unordainable-irvin.ngrok-free.dev"
npm run dev

# Tester dans le navigateur
# http://localhost:3000
```

## Troubleshooting

### Si la route retourne toujours 404:

1. **Vérifier que la variable est bien configurée**
   - Dans Vercel Dashboard → Settings → Environment Variables
   - La variable `BACKEND_URL` doit être présente

2. **Vérifier les logs de build**
   - Dans Vercel Dashboard → Deployments → [dernier déploiement]
   - Chercher des erreurs de build

3. **Vérifier que ngrok est accessible**
   ```bash
   curl https://karmen-unordainable-irvin.ngrok-free.dev/api/health
   ```

4. **Forcer un cache clear**
   - Dans le navigateur, faire Ctrl+Shift+R (hard refresh)
   - Ou ouvrir en navigation privée

5. **Vérifier la structure des fichiers**
   ```bash
   git ls-files | grep "purchases/delivery-notes"
   ```
   Doit afficher:
   ```
   frontend/app/api/purchases/delivery-notes/route.ts
   frontend/app/api/purchases/delivery-notes/[nfact]/[nfournisseur]/route.ts
   ```

## Commits Déployés

- `b038a61`: feat: Add dynamic route for individual purchase BL details
- `e83e1f6`: feat: Add dynamic route for purchase BL details (nfact/nfournisseur)
- `1199d41`: fix: Replace all hardcoded backend URLs with BACKEND_URL env variable
- `3d0d3f7`: docs: Add complete production fix documentation
- `2c5c4d5`: chore: Force Vercel redeploy for purchase BL details route

## Résultat Attendu

Après configuration et redéploiement, vous devriez voir dans les logs du navigateur:

```
🔧 Fetch interceptor: /api/purchases/delivery-notes/60754/MOSTA
🔍 Frontend API: Proxying purchase BL 60754/MOSTA to backend
🌐 Backend URL: https://karmen-unordainable-irvin.ngrok-free.dev/api
✅ Frontend API: Proxied purchase BL 60754/MOSTA from backend
```

Au lieu de:
```
Failed to load resource: the server responded with a status of 404
```
