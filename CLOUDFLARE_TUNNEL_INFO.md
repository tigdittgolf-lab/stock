# 🌐 Cloudflare Tunnel - Informations

## ✅ Tunnel Actif

**URL du Tunnel:** `https://midi-charm-harvard-performed.trycloudflare.com`

**Status:** ✅ Actif et fonctionnel

**Backend Local:** `http://localhost:3005`

## 🔍 Vérification

Le tunnel a été testé avec succès:
```bash
curl https://midi-charm-harvard-performed.trycloudflare.com/health
# Résultat: {"status":"OK","timestamp":"2026-02-21T12:43:36.288Z"}
```

## 📋 Configuration

### Frontend
Le fichier `frontend/lib/backend-url.ts` a été mis à jour pour utiliser cette URL en production.

### Processus
Le tunnel tourne en arrière-plan (ProcessId: 5)

## ⚠️ Important

### Quick Tunnel (Mode Actuel)
- ✅ Pas besoin de compte Cloudflare
- ✅ Démarrage instantané
- ⚠️ URL temporaire (change à chaque redémarrage)
- ⚠️ Pas de garantie de disponibilité (usage test/dev)

### Pour Production
Si tu veux une URL permanente:
1. Crée un compte Cloudflare gratuit
2. Utilise le script `setup-cloudflare-tunnel.ps1`
3. Configure un tunnel nommé permanent

## 🔄 Gestion du Tunnel

### Voir les Logs
```powershell
# Voir les logs du tunnel
Get-Content -Path "cloudflare-tunnel.log" -Wait
```

### Arrêter le Tunnel
Le tunnel tourne en processus background (ProcessId: 5)
Pour l'arrêter, utilise Kiro ou ferme le processus.

### Redémarrer le Tunnel
```powershell
.\start-cloudflare-quick-tunnel.ps1
```

## 📝 Prochaines Étapes

1. ✅ Tunnel créé et testé
2. ✅ Frontend mis à jour avec l'URL
3. 🔄 Redéployer le frontend sur Vercel
4. 🧪 Tester l'application

## 🚀 Commande de Déploiement

```bash
cd frontend
npx vercel --prod --force
```

---

**Date de création:** 21 février 2026, 12:43 UTC
**Type:** Quick Tunnel (temporaire)
**Durée de vie:** Tant que le processus tourne
