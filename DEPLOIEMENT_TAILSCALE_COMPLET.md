# 🚀 Déploiement avec Tailscale - Guide Complet

## ✅ MODIFICATIONS EFFECTUÉES

### 1. Code modifié
- ✅ `frontend/lib/database/payment-adapter.ts` - Support proxy Tailscale
- ✅ `.env.example` - Documentation variable MYSQL_PROXY_URL

### 2. Serveur proxy
- ✅ `mysql-proxy-server.cjs` - Serveur proxy MySQL
- ✅ Serveur démarré sur port 3308
- ✅ Testé et fonctionnel (7 paiements trouvés)

## 🎯 PROCHAINES ÉTAPES

### Étape A : Activer Tailscale Funnel

**Ouvrez un nouveau terminal PowerShell** et exécutez :

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

⚠️ **IMPORTANT** : Laissez ce terminal ouvert !

### Étape B : Obtenir votre URL Tailscale

Dans un autre terminal :

```powershell
tailscale status
```

**Cherchez une ligne comme** :
```
100.x.x.x   votre-machine    user@   windows -
```

Votre URL sera : `https://votre-machine.tailnet-xxxx.ts.net`

### Étape C : Tester l'URL publique

```powershell
curl https://votre-machine.tailnet-xxxx.ts.net/health
```

**Résultat attendu** :
```json
{"status":"OK","timestamp":"2026-02-10T..."}
```

### Étape D : Tester une requête MySQL via Tailscale

```powershell
$body = @{sql="SELECT COUNT(*) as total FROM payments"} | ConvertTo-Json
Invoke-WebRequest -Uri "https://votre-machine.tailnet-xxxx.ts.net/api/mysql/query" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```

**Résultat attendu** :
```json
{"success":true,"data":[{"total":7}]}
```

### Étape E : Configurer Vercel

1. **Allez sur Vercel** :
   https://vercel.com/habibbelkacemimosta-7724s-projects/frontend/settings/environment-variables

2. **Ajoutez la variable** :
   - **Name** : `MYSQL_PROXY_URL`
   - **Value** : `https://votre-machine.tailnet-xxxx.ts.net` (votre URL Tailscale)
   - **Environment** : Production ✅

3. **Cliquez sur "Save"**

### Étape F : Commit et Push

```powershell
git add frontend/lib/database/payment-adapter.ts .env.example mysql-proxy-server.cjs DEPLOIEMENT_TAILSCALE_COMPLET.md
git commit -m "feat: Support Tailscale proxy pour accès MySQL local depuis Vercel

- Ajout détection MYSQL_PROXY_URL en production
- Serveur proxy MySQL sur port 3308
- Support MySQL local via Tailscale Funnel
- Documentation complète

Architecture:
Vercel → Tailscale Funnel → Proxy (3308) → MySQL (3306)"

git push origin main
```

### Étape G : Redéployer sur Vercel

```powershell
cd frontend
vercel --prod
```

**Attendez le déploiement** (~30 secondes)

### Étape H : Tester en production

1. **Ouvrez l'URL de production** :
   https://frontend-g57m6e1rk-habibbelkacemimosta-7724s-projects.vercel.app

2. **Allez sur le BL 3**

3. **Vérifiez** :
   - ✅ Le solde s'affiche correctement
   - ✅ Les paiements sont visibles
   - ✅ Pas d'erreur

## 🔍 VÉRIFICATION

### Vérifier que tout fonctionne

**1. Serveur proxy local** :
```powershell
curl http://localhost:3308/health
```

**2. Tailscale Funnel actif** :
```powershell
tailscale status
```

**3. URL publique accessible** :
```powershell
curl https://votre-machine.tailnet-xxxx.ts.net/health
```

**4. Vercel configuré** :
- Variable `MYSQL_PROXY_URL` présente dans les settings

**5. Production fonctionne** :
- Ouvrir l'app en production
- Tester les paiements

## 📊 ARCHITECTURE FINALE

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION (Vercel)                      │
│                                                             │
│  Frontend Next.js                                           │
│  ↓ Lit MYSQL_PROXY_URL                                     │
│  ↓ Envoie requêtes HTTPS                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Internet (HTTPS)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Tailscale Funnel (Public)                      │
│  https://votre-machine.tailnet-xxxx.ts.net                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Tunnel sécurisé
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  VOTRE PC (Local)                           │
│                                                             │
│  Serveur Proxy (port 3308)                                 │
│  ↓                                                          │
│  MySQL (port 3306)                                         │
│  └─ Base: stock_management                                 │
│     └─ Table: payments (7 enregistrements)                 │
└─────────────────────────────────────────────────────────────┘
```

## ⚠️ POINTS IMPORTANTS

### Votre PC doit rester allumé

Pour que la production fonctionne :
- ✅ Votre PC doit être allumé
- ✅ MySQL doit tourner
- ✅ Le serveur proxy doit tourner (port 3308)
- ✅ Tailscale Funnel doit être actif

### Redémarrage après reboot

Si vous redémarrez votre PC :

```powershell
# 1. Démarrer MySQL (WAMP ou service)
# 2. Démarrer le proxy
node mysql-proxy-server.cjs

# 3. Activer Tailscale Funnel
tailscale funnel 3308
```

### Automatiser avec PM2 (optionnel)

```powershell
npm install -g pm2-windows-startup
pm2-startup install
pm2 start mysql-proxy-server.cjs --name mysql-proxy
pm2 save
```

## 🧪 TESTS POST-DÉPLOIEMENT

### Test 1 : Health check production
```powershell
curl https://frontend-g57m6e1rk-habibbelkacemimosta-7724s-projects.vercel.app/api/payments/balance?documentType=delivery_note&documentId=3
```

### Test 2 : Créer un paiement en production
1. Ouvrir l'app en production
2. Aller sur BL 3
3. Créer un paiement de test (10 DA)
4. Vérifier dans MySQL local :
```powershell
# Via le proxy
$body = @{sql="SELECT * FROM payments ORDER BY id DESC LIMIT 1"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3308/api/mysql/query" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```

## 📈 MONITORING

### Logs du serveur proxy
Les logs s'affichent dans le terminal où tourne le proxy.

### Logs Vercel
https://vercel.com/habibbelkacemimosta-7724s-projects/frontend/logs

Cherchez les messages :
- `🔗 Using Tailscale proxy: https://...`
- `✅ Production: Utilisation de MySQL via Tailscale proxy`

## 🛑 DÉPANNAGE

### Erreur : "Failed to fetch"
- Vérifier que le proxy tourne : `curl http://localhost:3308/health`
- Vérifier que Tailscale Funnel est actif : `tailscale status`

### Erreur : "MySQL connection failed"
- Vérifier que MySQL tourne
- Vérifier les credentials dans `mysql-proxy-server.cjs`

### Erreur : "MYSQL_PROXY_URL not found"
- Vérifier la variable sur Vercel
- Redéployer après avoir ajouté la variable

### Production utilise Supabase au lieu de MySQL
- Vérifier que `MYSQL_PROXY_URL` est bien configurée sur Vercel
- Vérifier les logs Vercel pour voir les messages

## 🎉 RÉSULTAT FINAL

**En local** :
- ✅ Utilise MySQL local directement

**En production (Vercel)** :
- ✅ Utilise MySQL local via Tailscale Funnel
- ✅ Données synchronisées en temps réel
- ✅ Pas besoin de base cloud

## 📝 COMMANDES UTILES

```powershell
# Démarrer tout
node mysql-proxy-server.cjs          # Terminal 1
tailscale funnel 3308                # Terminal 2

# Tester
curl http://localhost:3308/health    # Local
curl https://votre-url.ts.net/health # Public

# Arrêter
Ctrl+C                               # Dans chaque terminal
tailscale funnel --off 3308          # Désactiver funnel

# Redéployer
git push origin main
cd frontend
vercel --prod
```

Prêt à continuer avec les étapes A-H ?
