# ✅ SOLUTION SIMPLE - 3 étapes

## Le problème

Les erreurs 500 sont causées par **`BACKEND_URL` manquant dans Vercel**.

## La solution

### Étape 1: Vérifier la configuration actuelle

Ouvrir dans le navigateur:
```
https://frontend-3m1e1x3sq-habibbelkacemimosta-7724s-projects.vercel.app/api/debug/config
```

Vous verrez quelque chose comme:
```json
{
  "BACKEND_URL": "NOT_CONFIGURED",
  "MYSQL_PROXY_URL": "NOT_CONFIGURED",
  ...
}
```

Si `BACKEND_URL` dit `"NOT_CONFIGURED"` → C'est le problème!

### Étape 2: Ajouter la variable dans Vercel

1. Aller sur https://vercel.com/dashboard
2. Cliquer sur votre projet
3. Settings (en haut)
4. Environment Variables (menu gauche)
5. Cliquer sur "Add New"
6. Remplir:
   ```
   Name: BACKEND_URL
   Value: https://desktop-bhhs068.tail1d9c54.ts.net
   ```
7. Cocher: Production, Preview, Development
8. Cliquer "Save"
9. Vercel va proposer de redéployer → Cliquer "Redeploy"

### Étape 3: Vérifier que ça fonctionne

Attendre 1-2 minutes, puis:

1. Recharger: `https://frontend-3m1e1x3sq-habibbelkacemimosta-7724s-projects.vercel.app/api/debug/config`

Vous devriez voir:
```json
{
  "BACKEND_URL": "https://desktop-bhhs068.tail1d9c54.ts.net",
  ...
}
```

2. Ouvrir votre application

Vous devriez voir:
- ✅ 4 articles
- ✅ 5 clients
- ✅ 3 fournisseurs
- ✅ Plus d'erreurs 500

## C'est tout!

Une seule variable manquante causait tous les problèmes.

---

## Si ça ne fonctionne toujours pas après avoir ajouté BACKEND_URL

### Vérifier que Tailscale est actif

```powershell
tailscale funnel status
```

Doit afficher:
```
https://desktop-bhhs068.tail1d9c54.ts.net (Funnel on)
|-- /api   proxy http://127.0.0.1:3005
```

Si ce n'est pas le cas:
```powershell
cd backend
bun run dev
```

Puis dans un autre terminal:
```powershell
tailscale funnel --bg --https=443 --set-path=/api 3005
```

### Vérifier que le backend répond

```powershell
Invoke-WebRequest -Uri "https://desktop-bhhs068.tail1d9c54.ts.net/api/health" -UseBasicParsing
```

Doit retourner: `200 OK`

Si erreur → Le backend n'est pas accessible via Tailscale.
