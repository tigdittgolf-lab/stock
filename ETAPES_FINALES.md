# 🎯 Étapes Finales - À faire MAINTENANT

## ✅ Code déployé

Le code vient d'être pushé. Vercel va redéployer dans 1-2 minutes.

## ⚠️ PROBLÈME IDENTIFIÉ

`BACKEND_URL` n'est **PAS CONFIGURÉ** dans Vercel!

C'est pour ça que vous avez les erreurs 500. Le frontend utilise `http://localhost:3005` par défaut, qui ne fonctionne pas en production.

## 🚨 ACTION URGENTE

### 1. Aller sur Vercel
```
https://vercel.com/dashboard
```

### 2. Sélectionner votre projet

### 3. Settings → Environment Variables

### 4. AJOUTER (pas modifier) la variable `BACKEND_URL`

**Cliquer sur "Add New"**

- **Name**: `BACKEND_URL`
- **Value**: `https://desktop-bhhs068.tail1d9c54.ts.net`
- **Environment**: Cocher "Production", "Preview", "Development"

### 5. Sauvegarder

Vercel va demander de redéployer → Cliquer sur "Redeploy"

## 📊 Vérification après redéploiement

### Attendre 1-2 minutes

Vercel va redéployer l'application.

### Ouvrir l'application

```
https://frontend-gamma-tan-26.vercel.app
```

### Ouvrir la console (F12)

Vous devriez voir dans les logs:
```
🌐 BACKEND_URL configured: https://desktop-bhhs068.tail1d9c54.ts.net
🎯 Full URL: https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/articles
```

**Si vous voyez `http://localhost:3005`** → La variable n'est pas configurée!

### Vérifier les données

Vous devriez voir:
- ✅ 4 articles
- ✅ 5 clients
- ✅ 3 fournisseurs

## 🔍 Si ça ne fonctionne toujours pas

### Vérifier les logs Vercel

1. Vercel Dashboard → Votre projet
2. Deployments → Dernier déploiement
3. Logs → Chercher "BACKEND_URL configured"

**Si vous voyez `localhost:3005`** → La variable n'est pas configurée correctement

### Vérifier que Tailscale est actif

```powershell
tailscale funnel status
```

Doit afficher:
```
https://desktop-bhhs068.tail1d9c54.ts.net (Funnel on)
|-- /api   proxy http://127.0.0.1:3005
```

### Tester le backend directement

```powershell
Invoke-WebRequest -Uri "https://desktop-bhhs068.tail1d9c54.ts.net/api/health" -UseBasicParsing
```

Doit retourner: `200 OK`

## 📝 Résumé

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `BACKEND_URL` | `https://desktop-bhhs068.tail1d9c54.ts.net` | Production, Preview, Development |

**IMPORTANT**: Ne PAS mettre `/api` à la fin!

## 🎉 Succès confirmé quand

- [ ] Logs affichent: `BACKEND_URL configured: https://desktop-bhhs068.tail1d9c54.ts.net`
- [ ] Logs affichent: `Full URL: https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/articles`
- [ ] 4 articles affichés
- [ ] 5 clients affichés
- [ ] 3 fournisseurs affichés
- [ ] Plus d'erreurs 500

---

**Note**: Cette variable est CRITIQUE. Sans elle, l'application ne peut pas communiquer avec le backend en production!
