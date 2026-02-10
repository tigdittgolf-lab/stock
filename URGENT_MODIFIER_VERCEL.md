# 🚨 URGENT: Modifier BACKEND_URL dans Vercel

## Le déploiement est en cours MAIS...

Le code est déployé, mais **vous DEVEZ modifier la variable d'environnement** sinon les erreurs 500 continueront!

## Étapes à suivre MAINTENANT

### 1. Aller sur Vercel
```
https://vercel.com/dashboard
```

### 2. Sélectionner votre projet
Cliquer sur le projet `frontend` ou le nom de votre application

### 3. Aller dans Settings
- Cliquer sur "Settings" dans le menu du haut
- Puis "Environment Variables" dans le menu de gauche

### 4. Trouver BACKEND_URL
Chercher la variable `BACKEND_URL`

### 5. Modifier la valeur

**Valeur ACTUELLE (INCORRECTE)**:
```
https://desktop-bhhs068.tail1d9c54.ts.net/api
```

**Nouvelle valeur (CORRECTE)**:
```
https://desktop-bhhs068.tail1d9c54.ts.net
```

**IMPORTANT**: Enlever le `/api` à la fin!

### 6. Sauvegarder
- Cliquer sur "Save"
- Vercel va demander de redéployer
- Cliquer sur "Redeploy" ou "Redéployer"

## Pourquoi cette modification?

### Le problème
Quand `BACKEND_URL` contient `/api`, les URLs deviennent:
```
https://desktop-bhhs068.tail1d9c54.ts.net/api/api/sales/articles
                                            ^^^ ^^^ DOUBLE!
```

### La solution
Sans `/api` dans `BACKEND_URL`, les URLs deviennent:
```
https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/articles
                                        ^^^ CORRECT!
```

## Vérification après modification

### 1. Attendre le déploiement
Vercel va redéployer automatiquement (1-2 minutes)

### 2. Ouvrir l'application
```
https://frontend-fmmokvp8g-habibbelkacemimosta-7724s-projects.vercel.app
```

### 3. Ouvrir la console (F12)
Vérifier qu'il n'y a plus d'erreurs 500

### 4. Vérifier les données
Vous devriez voir:
- ✅ 4 articles
- ✅ 5 clients
- ✅ 3 fournisseurs

## Si ça ne fonctionne toujours pas

### Vérifier les logs Vercel
1. Aller dans "Deployments"
2. Cliquer sur le dernier déploiement
3. Cliquer sur "Logs"
4. Chercher les erreurs

### Vérifier que Tailscale est actif
```powershell
tailscale funnel status
```

Doit afficher:
```
https://desktop-bhhs068.tail1d9c54.ts.net (Funnel on)
|-- /api   proxy http://127.0.0.1:3005
```

### Vérifier que le backend répond
```powershell
Invoke-WebRequest -Uri "https://desktop-bhhs068.tail1d9c54.ts.net/api/health" -UseBasicParsing
```

Doit retourner: `200 OK`

## Résumé en 3 étapes

1. ✅ Code déployé (fait automatiquement)
2. ⚠️ **Modifier `BACKEND_URL` dans Vercel** (À FAIRE MAINTENANT)
3. ✅ Redéployer (fait automatiquement après modification)

---

**Ne pas oublier**: Cette modification est **CRITIQUE** pour que l'application fonctionne en production!
