# ⚠️ ACTION IMMÉDIATE REQUISE

## Problème
Les BL d'achat retournent 404 en production.

## Solution en 3 Étapes

### 1️⃣ Configurer BACKEND_URL dans Vercel (2 minutes)

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet `frontend-gamma-tan-26`
3. Settings → Environment Variables
4. Ajouter:
   ```
   Name: BACKEND_URL
   Value: https://karmen-unordainable-irvin.ngrok-free.dev
   Environments: Production, Preview, Development
   ```
5. Cliquer sur **Save**

### 2️⃣ Vérifier Ngrok (30 secondes)

```powershell
# Vérifier que ngrok est démarré
Get-Process ngrok

# Si non démarré
.\start-ngrok.ps1
```

### 3️⃣ Attendre le Redéploiement (2 minutes)

Vercel va automatiquement redéployer après l'ajout de la variable.
Attendre 2-3 minutes puis tester.

## Test

1. Rafraîchir l'application
2. Aller dans BL d'Achat
3. Cliquer sur un BL
4. Les détails doivent s'afficher

## Si ça ne marche toujours pas

Vérifier dans Vercel Dashboard → Deployments:
- Le dernier déploiement est terminé (statut "Ready")
- Pas d'erreurs dans les logs

## Support

Si le problème persiste après ces 3 étapes, partager:
1. Screenshot de la variable BACKEND_URL dans Vercel
2. Screenshot du dernier déploiement Vercel
3. Logs du navigateur (console)
