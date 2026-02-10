# ✅ PROBLÈME RÉSOLU!

## Le problème

La configuration Tailscale Funnel était incorrecte. Elle routait `/api` vers le port 3005 en ENLEVANT le préfixe `/api`, ce qui causait des 404.

### Ancienne configuration (INCORRECTE)
```
https://desktop-bhhs068.tail1d9c54.ts.net/api → http://127.0.0.1:3005
```

Quand on appelait `/api/sales/articles`, Tailscale enlevait `/api` et envoyait `/sales/articles` au backend, qui retournait 404.

### Nouvelle configuration (CORRECTE)
```
https://desktop-bhhs068.tail1d9c54.ts.net/ → http://127.0.0.1:3005
https://desktop-bhhs068.tail1d9c54.ts.net/mysql → http://127.0.0.1:3308
```

Maintenant Tailscale route TOUT vers le port 3005 sans enlever de préfixe.

## Configuration Vercel

`BACKEND_URL` doit être:
```
https://desktop-bhhs068.tail1d9c54.ts.net
```

(Sans `/api` à la fin)

## Tests de vérification

### Test 1: Health check
```powershell
Invoke-WebRequest -Uri "https://desktop-bhhs068.tail1d9c54.ts.net/health" -UseBasicParsing
```
✅ Résultat: 200 OK

### Test 2: Articles
```powershell
Invoke-WebRequest -Uri "https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/articles" -Headers @{"X-Tenant"="2025_bu01"} -UseBasicParsing
```
✅ Résultat: 200 OK avec 4 articles

### Test 3: Clients
```powershell
Invoke-WebRequest -Uri "https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/clients" -Headers @{"X-Tenant"="2025_bu01"} -UseBasicParsing
```
✅ Résultat: 200 OK avec 5 clients

### Test 4: Suppliers
```powershell
Invoke-WebRequest -Uri "https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/suppliers" -Headers @{"X-Tenant"="2025_bu01"} -UseBasicParsing
```
✅ Résultat: 200 OK avec 3 fournisseurs

## Commandes Tailscale utilisées

```powershell
# Désactiver l'ancienne configuration
tailscale funnel off

# Configurer le routing principal (backend)
tailscale funnel --bg --set-path=/ 3005

# Ajouter le routing MySQL
tailscale funnel --bg --set-path=/mysql 3308
```

## Vérification de la configuration

```powershell
tailscale funnel status
```

Doit afficher:
```
https://desktop-bhhs068.tail1d9c54.ts.net/
|-- proxy http://127.0.0.1:3005

https://desktop-bhhs068.tail1d9c54.ts.net/mysql
|-- proxy http://127.0.0.1:3308
```

## Prochaines étapes

1. ✅ Tailscale configuré correctement
2. ✅ Backend accessible via Tailscale
3. ⏳ Attendre le redéploiement Vercel (1-2 minutes)
4. ✅ Tester l'application en production

## Vérification finale

Après le redéploiement, ouvrir:
```
https://[votre-app].vercel.app/api/debug/backend-test
```

Tous les tests doivent être OK (status: 200).

Puis ouvrir votre application, vous devriez voir:
- 4 articles
- 5 clients
- 3 fournisseurs
- Plus d'erreurs 500!
