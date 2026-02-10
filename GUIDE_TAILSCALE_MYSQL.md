# 🔗 Accéder à MySQL Local depuis Vercel avec Tailscale

## 🎯 OBJECTIF

Permettre à Vercel (production) d'accéder à votre MySQL local via Tailscale Funnel.

## ⚠️ AVERTISSEMENTS

**Avantages** :
- ✅ Accès aux données locales depuis la production
- ✅ Pas besoin de base de données cloud
- ✅ Gratuit (Tailscale Funnel est gratuit)

**Inconvénients** :
- ⚠️ Votre PC doit rester allumé 24/7
- ⚠️ Sécurité : MySQL exposé sur Internet (même via HTTPS)
- ⚠️ Performance : Latence plus élevée
- ⚠️ Fiabilité : Si votre PC s'éteint, la prod tombe
- ❌ **NON RECOMMANDÉ pour une vraie production**

## 📋 PRÉREQUIS

1. **Tailscale installé** sur votre PC
2. **Node.js** installé
3. **MySQL** qui tourne sur le port 3306

## 🚀 ÉTAPES D'INSTALLATION

### 1. Installer les dépendances du proxy

```powershell
npm install express mysql2 cors
```

### 2. Démarrer le serveur proxy

```powershell
node mysql-proxy-server.js
```

Vous devriez voir :
```
🚀 MySQL Proxy Server running on port 3307
📊 MySQL: localhost:3306
💾 Database: stock_management
```

### 3. Tester localement

```powershell
curl http://localhost:3307/health
```

Résultat attendu :
```json
{"status":"OK","timestamp":"2026-02-10T..."}
```

### 4. Activer Tailscale Funnel

```powershell
tailscale funnel 3307
```

Cela va :
- Créer un tunnel HTTPS public
- Vous donner une URL publique (ex: `https://votre-machine.tailnet-xxxx.ts.net`)

### 5. Obtenir l'URL publique

```powershell
tailscale status
```

Cherchez la ligne avec "funnel" et notez l'URL.

### 6. Tester l'URL publique

```powershell
curl https://votre-machine.tailnet-xxxx.ts.net/health
```

### 7. Configurer Vercel

Ajoutez une variable d'environnement sur Vercel :

```
MYSQL_PROXY_URL=https://votre-machine.tailnet-xxxx.ts.net
```

### 8. Modifier le code pour utiliser le proxy

Modifiez `frontend/lib/database/payment-adapter.ts` :

```typescript
async function executeMySQLQuery(sql: string, params: any[] = [], database?: string): Promise<any> {
  // En production avec Tailscale
  if (process.env.MYSQL_PROXY_URL) {
    const response = await fetch(`${process.env.MYSQL_PROXY_URL}/api/mysql/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params, database })
    });
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  }
  
  // Reste du code...
}
```

### 9. Redéployer sur Vercel

```powershell
git add .
git commit -m "feat: Support Tailscale proxy pour MySQL en production"
git push origin main
cd frontend
vercel --prod
```

## 🧪 TESTS

### Test 1 : Proxy local
```powershell
curl -X POST http://localhost:3307/api/mysql/query \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT COUNT(*) as total FROM payments"}'
```

### Test 2 : Proxy via Tailscale
```powershell
curl -X POST https://votre-machine.tailnet-xxxx.ts.net/api/mysql/query \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT COUNT(*) as total FROM payments"}'
```

### Test 3 : Depuis Vercel
Ouvrez votre app en production et testez les paiements.

## 🔒 SÉCURITÉ

### Recommandations

1. **Authentification** : Ajoutez un token d'API
```javascript
// Dans mysql-proxy-server.js
const API_TOKEN = process.env.API_TOKEN || 'votre-token-secret';

app.use((req, res, next) => {
  const token = req.headers['x-api-token'];
  if (token !== API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

2. **Rate limiting** : Limitez les requêtes
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // max 100 requêtes par IP
});

app.use(limiter);
```

3. **Whitelist SQL** : N'autorisez que certaines requêtes
```javascript
const ALLOWED_TABLES = ['payments', 'delivery_notes', 'invoices'];

function validateSQL(sql) {
  // Vérifier que la requête est sûre
  if (sql.toLowerCase().includes('drop') || 
      sql.toLowerCase().includes('delete') ||
      sql.toLowerCase().includes('truncate')) {
    throw new Error('Dangerous SQL operation not allowed');
  }
}
```

## 📊 MONITORING

### Logs du proxy

Le serveur affiche tous les logs dans la console. Pour les sauvegarder :

```powershell
node mysql-proxy-server.js > proxy.log 2>&1
```

### Vérifier que Tailscale Funnel est actif

```powershell
tailscale status
```

Cherchez la ligne avec "funnel" active.

## 🛑 ARRÊTER LE PROXY

### Arrêter le serveur Node.js
```powershell
# Ctrl+C dans le terminal
```

### Désactiver Tailscale Funnel
```powershell
tailscale funnel --off 3307
```

## 🔄 ALTERNATIVE : Cloudflare Tunnel

Si Tailscale ne fonctionne pas, essayez Cloudflare Tunnel :

```powershell
# Installer cloudflared
choco install cloudflared

# Créer un tunnel
cloudflared tunnel create mysql-proxy

# Démarrer le tunnel
cloudflared tunnel --url http://localhost:3307
```

## 📈 COMPARAISON DES SOLUTIONS

| Solution | Coût | Complexité | Fiabilité | Production |
|----------|------|------------|-----------|------------|
| Tailscale Funnel | Gratuit | Moyenne | Faible | ❌ Non |
| Cloudflare Tunnel | Gratuit | Moyenne | Moyenne | ⚠️ Dev only |
| Supabase | Gratuit | Facile | Haute | ✅ Oui |
| PlanetScale | Gratuit | Facile | Haute | ✅ Oui |
| Railway | Gratuit | Facile | Haute | ✅ Oui |

## 🎯 RECOMMANDATION FINALE

**Pour tester/développement** :
- ✅ Tailscale Funnel (si votre PC reste allumé)

**Pour production réelle** :
- ✅ Supabase (déjà configuré, gratuit)
- ✅ PlanetScale (MySQL cloud, gratuit jusqu'à 5GB)
- ✅ Railway (PostgreSQL/MySQL cloud, gratuit avec limites)

## 🆘 BESOIN D'AIDE ?

Si vous voulez :
- Implémenter Tailscale Funnel
- Migrer vers PlanetScale
- Configurer Cloudflare Tunnel
- Autre solution

Dites-moi et je vous guide !

## 📝 SCRIPTS UTILES

### Démarrer le proxy en arrière-plan (Windows)

```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node mysql-proxy-server.js" -WindowStyle Minimized
```

### Vérifier que le proxy fonctionne

```powershell
curl http://localhost:3307/health
```

### Redémarrer le proxy

```powershell
# Arrêter tous les processus Node.js
Get-Process -Name "node" | Stop-Process -Force

# Redémarrer
node mysql-proxy-server.js
```
