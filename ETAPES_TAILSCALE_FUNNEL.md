# ✅ Serveur Proxy MySQL - PRÊT !

## 🎉 STATUT ACTUEL

✅ **Serveur proxy démarré** sur le port **3308**
✅ **MySQL accessible** (7 paiements trouvés)
✅ **API fonctionnelle** : http://localhost:3308

## 🚀 PROCHAINES ÉTAPES

### Étape 5 : Activer Tailscale Funnel

Ouvrez un **nouveau terminal PowerShell** et exécutez :

```powershell
tailscale funnel 3308
```

**Résultat attendu** :
```
Available on the internet:

https://votre-machine.tailnet-xxxx.ts.net/
|-- proxy http://127.0.0.1:3308

Press Ctrl+C to exit.
```

### Étape 6 : Obtenir votre URL publique

Dans un autre terminal :

```powershell
tailscale status
```

Cherchez la ligne avec votre machine et notez l'URL (ex: `https://votre-pc.tailnet-xxxx.ts.net`)

### Étape 7 : Tester l'URL publique

```powershell
curl https://votre-pc.tailnet-xxxx.ts.net/health
```

**Résultat attendu** :
```json
{"status":"OK","timestamp":"2026-02-10T..."}
```

### Étape 8 : Configurer Vercel

1. Allez sur https://vercel.com/habibbelkacemimosta-7724s-projects/frontend/settings/environment-variables

2. Ajoutez une nouvelle variable :
   - **Name** : `MYSQL_PROXY_URL`
   - **Value** : `https://votre-pc.tailnet-xxxx.ts.net`
   - **Environment** : Production

3. Cliquez sur "Save"

### Étape 9 : Modifier le code pour utiliser le proxy

Modifiez `frontend/lib/database/payment-adapter.ts` pour utiliser le proxy en production.

### Étape 10 : Redéployer

```powershell
git add .
git commit -m "feat: Support Tailscale proxy pour MySQL en production"
git push origin main
cd frontend
vercel --prod
```

## 🧪 TESTS

### Test local (maintenant)
```powershell
# Health check
curl http://localhost:3308/health

# Requête MySQL
curl -X POST http://localhost:3308/api/mysql/query `
  -H "Content-Type: application/json" `
  -d '{"sql":"SELECT COUNT(*) as total FROM payments"}'
```

### Test via Tailscale (après activation)
```powershell
# Health check
curl https://votre-pc.tailnet-xxxx.ts.net/health

# Requête MySQL
curl -X POST https://votre-pc.tailnet-xxxx.ts.net/api/mysql/query `
  -H "Content-Type: application/json" `
  -d '{"sql":"SELECT COUNT(*) as total FROM payments"}'
```

## ⚠️ IMPORTANT

### Le serveur proxy doit rester actif

Le processus Node.js tourne actuellement dans un terminal. Pour qu'il reste actif :

**Option 1 : Laisser le terminal ouvert**
- Ne fermez pas le terminal où tourne le proxy

**Option 2 : Utiliser PM2 (recommandé)**
```powershell
npm install -g pm2
pm2 start mysql-proxy-server.cjs --name mysql-proxy
pm2 save
pm2 startup
```

**Option 3 : Service Windows**
- Créer un service Windows avec NSSM

### Tailscale Funnel doit rester actif

Le terminal où vous exécutez `tailscale funnel 3308` doit rester ouvert.

## 📊 MONITORING

### Vérifier que le proxy fonctionne
```powershell
curl http://localhost:3308/health
```

### Vérifier que Tailscale Funnel est actif
```powershell
tailscale status
```

### Voir les logs du proxy
Les logs s'affichent dans le terminal où tourne le proxy.

## 🛑 ARRÊTER

### Arrêter le proxy
Dans le terminal du proxy : `Ctrl+C`

### Arrêter Tailscale Funnel
Dans le terminal de Tailscale Funnel : `Ctrl+C`

Ou :
```powershell
tailscale funnel --off 3308
```

## 🔄 REDÉMARRER

### Redémarrer le proxy
```powershell
node mysql-proxy-server.cjs
```

### Redémarrer Tailscale Funnel
```powershell
tailscale funnel 3308
```

## 📝 RÉSUMÉ

**Ce qui fonctionne maintenant** :
- ✅ Serveur proxy MySQL sur port 3308
- ✅ API accessible localement
- ✅ 7 paiements dans la base MySQL

**Ce qu'il reste à faire** :
1. Activer Tailscale Funnel
2. Obtenir l'URL publique
3. Configurer Vercel
4. Modifier le code
5. Redéployer

**Temps estimé** : 10-15 minutes

Voulez-vous que je vous aide pour les étapes suivantes ?
