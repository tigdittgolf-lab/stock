# 🛠️ Commandes Utiles - Gestion de l'Application

## 🔍 Vérifications Rapides

### Vérifier le Backend Local
```powershell
curl -UseBasicParsing http://localhost:3005/health
```

### Vérifier le Tunnel Cloudflare
```powershell
curl -UseBasicParsing https://midi-charm-harvard-performed.trycloudflare.com/health
```

### Vérifier le Frontend Vercel
```powershell
curl -UseBasicParsing https://frontend-c9t9s49rm-habibbelkacemimosta-7724s-projects.vercel.app
```

## 🚀 Démarrage

### Démarrer le Backend Local
```powershell
cd backend
bun run dev
```

### Démarrer le Tunnel Cloudflare
```powershell
# Quick Tunnel (temporaire, sans auth)
.\start-cloudflare-quick-tunnel.ps1

# OU Tunnel Nommé (permanent, avec auth)
.\setup-cloudflare-tunnel.ps1
```

### Démarrer le Frontend Local (Dev)
```powershell
cd frontend
npm run dev
```

## 📦 Déploiement

### Déployer le Frontend sur Vercel
```powershell
cd frontend
npx vercel --prod --force
```

### Voir les Logs Vercel
```powershell
cd frontend
npx vercel logs
```

### Voir les Déploiements Vercel
```powershell
cd frontend
npx vercel ls
```

## 🔄 Git

### Commit et Push
```powershell
git add .
git commit -m "feat: description du changement"
git push
```

### Voir le Status
```powershell
git status
```

### Voir l'Historique
```powershell
git log --oneline -10
```

## 🗄️ Supabase

### Ouvrir le Dashboard
```
https://supabase.com/dashboard
```

### Ouvrir le SQL Editor
```
https://supabase.com/dashboard/project/szgodrjglbpzkrksnroi/sql
```

### Tester une Fonction RPC
```sql
SELECT get_articles_by_tenant('2009_bu02');
SELECT get_clients_by_tenant('2009_bu02');
SELECT get_suppliers_by_tenant('2009_bu02');
```

## 🔧 Maintenance

### Arrêter le Backend
```powershell
# Trouver le processus
netstat -ano | findstr :3005

# Tuer le processus (remplace PID par le numéro)
taskkill /PID <PID> /F
```

### Redémarrer le Tunnel
```powershell
# Si le tunnel s'arrête, relance-le
.\start-cloudflare-quick-tunnel.ps1

# ⚠️ Note: L'URL changera!
# Tu devras mettre à jour frontend/lib/backend-url.ts
```

### Nettoyer le Cache Frontend
```powershell
cd frontend
Remove-Item -Recurse -Force .next
npm run build
```

## 📊 Monitoring

### Voir les Processus Backend
```powershell
netstat -ano | findstr :3005
```

### Voir les Variables d'Environnement Vercel
```powershell
cd frontend
npx vercel env ls
```

### Voir les Builds Vercel
```powershell
cd frontend
npx vercel inspect
```

## 🧪 Tests

### Tester l'API Backend Locale
```powershell
# Health check
curl -UseBasicParsing http://localhost:3005/health

# Articles
curl -UseBasicParsing http://localhost:3005/api/articles -Headers @{"X-Tenant"="2009_bu02"}

# Clients
curl -UseBasicParsing http://localhost:3005/api/clients -Headers @{"X-Tenant"="2009_bu02"}
```

### Tester l'API via Tunnel
```powershell
# Health check
curl -UseBasicParsing https://midi-charm-harvard-performed.trycloudflare.com/health

# Articles
curl -UseBasicParsing https://midi-charm-harvard-performed.trycloudflare.com/api/articles -Headers @{"X-Tenant"="2009_bu02"}
```

## 🔐 Sécurité

### Voir les Variables d'Environnement Backend
```powershell
cd backend
Get-Content .env
```

### Régénérer le JWT Secret
```powershell
# Générer un nouveau secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📝 Logs

### Logs Backend (si configuré)
```powershell
cd backend
Get-Content -Path logs/app.log -Wait
```

### Logs Tunnel Cloudflare
```powershell
# Voir les logs du processus (ProcessId: 5)
# Utilise Kiro getProcessOutput
```

### Logs Frontend Vercel
```powershell
cd frontend
npx vercel logs --follow
```

## 🆘 Dépannage

### Le Backend ne Démarre Pas
```powershell
# Vérifier si le port est utilisé
netstat -ano | findstr :3005

# Tuer le processus si nécessaire
taskkill /PID <PID> /F

# Redémarrer
cd backend
bun run dev
```

### Le Tunnel ne Fonctionne Pas
```powershell
# Vérifier que cloudflared est installé
.\cloudflared.exe version

# Redémarrer le tunnel
.\start-cloudflare-quick-tunnel.ps1
```

### Le Frontend ne Build Pas
```powershell
cd frontend

# Nettoyer
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules

# Réinstaller
npm install

# Rebuild
npm run build
```

## 📱 URLs Importantes

### Application
- **Frontend Prod:** https://frontend-c9t9s49rm-habibbelkacemimosta-7724s-projects.vercel.app
- **Backend Tunnel:** https://midi-charm-harvard-performed.trycloudflare.com
- **Backend Local:** http://localhost:3005

### Dashboards
- **Vercel:** https://vercel.com/habibbelkacemimosta-7724s-projects
- **Supabase:** https://supabase.com/dashboard/project/szgodrjglbpzkrksnroi
- **GitHub:** https://github.com/tigdittgolf-lab/stock

## 💡 Astuces

### Déploiement Rapide
```powershell
# Tout en une commande
git add . && git commit -m "update" && git push && cd frontend && npx vercel --prod --force && cd ..
```

### Vérification Complète
```powershell
# Vérifier tout
curl -UseBasicParsing http://localhost:3005/health
curl -UseBasicParsing https://midi-charm-harvard-performed.trycloudflare.com/health
curl -UseBasicParsing https://frontend-c9t9s49rm-habibbelkacemimosta-7724s-projects.vercel.app
```

### Redémarrage Complet
```powershell
# 1. Arrêter le backend
taskkill /F /IM bun.exe

# 2. Arrêter le tunnel (si nécessaire)
# Utilise Kiro pour arrêter le processus 5

# 3. Redémarrer le backend
cd backend
bun run dev

# 4. Redémarrer le tunnel
.\start-cloudflare-quick-tunnel.ps1

# 5. Redéployer le frontend (si URL tunnel a changé)
cd frontend
npx vercel --prod --force
```

---

**Dernière mise à jour:** 21 février 2026
**Tunnel URL:** https://midi-charm-harvard-performed.trycloudflare.com
**Frontend URL:** https://frontend-c9t9s49rm-habibbelkacemimosta-7724s-projects.vercel.app
