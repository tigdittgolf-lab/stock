# Guide URL de Production Fixe

## 🎯 Objectif
Configurer une URL de production fixe qui ne change jamais lors des déploiements.

## 📍 URLs Expliquées

### URL Temporaire (Change à chaque déploiement)
```
https://frontend-1ijtpmvtb-tigdittgolf-9191s-projects.vercel.app
```
- ❌ Cette URL change à chaque nouveau déploiement
- ❌ Difficile à mémoriser et partager
- ❌ Liens cassés après redéploiement

### URL de Production Fixe (Recommandée)
```
https://frontend-iota-six-72.vercel.app
```
- ✅ URL fixe qui ne change jamais
- ✅ Facile à mémoriser et partager
- ✅ Liens permanents

## 🔧 Configuration Mise en Place

### 1. Vercel Configuration (`frontend/vercel.json`)
```json
{
  "version": 2,
  "framework": "nextjs",
  "name": "frontend",
  "alias": ["frontend-iota-six-72.vercel.app"],
  "env": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_API_URL": "https://desktop-bhhs068.tail1d9c54.ts.net/api"
  },
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "github": {
    "enabled": true,
    "autoAlias": false
  }
}
```

### 2. Scripts de Déploiement Automatique

#### PowerShell (`deploy-production-fixed.ps1`)
```powershell
./deploy-production-fixed.ps1
```

#### Batch (`deploy-production-fixed.bat`)
```batch
deploy-production-fixed.bat
```

#### NPM Script
```bash
cd frontend
npm run deploy:prod
```

## 🚀 Comment Déployer

### Méthode 1: Script Automatique (Recommandé)
```bash
# Double-clic sur le fichier
deploy-production-fixed.bat
```

### Méthode 2: Commandes Manuelles
```bash
cd frontend
git add .
git commit -m "Deploy to fixed production"
git push origin main
vercel --prod --yes
```

### Méthode 3: NPM
```bash
cd frontend
npm run deploy:fixed
```

## ✅ Vérification

Après déploiement, vérifiez que l'application est accessible sur:
```
https://frontend-iota-six-72.vercel.app
```

## 🔄 Processus Automatique

Désormais, chaque déploiement:
1. ✅ Commit automatique des changements
2. ✅ Push vers le repository Git
3. ✅ Déploiement vers l'URL fixe
4. ✅ URL de production reste toujours la même

## 📝 Notes Importantes

- **URL Fixe**: `https://frontend-iota-six-72.vercel.app`
- **Backend Tunnel**: `https://desktop-bhhs068.tail1d9c54.ts.net`
- **Configuration**: Automatique via `vercel.json`
- **Déploiement**: Un seul clic avec les scripts fournis

## 🎉 Avantages

1. **URL Permanente**: Ne change jamais
2. **Partage Facile**: Lien stable pour les utilisateurs
3. **Déploiement Simple**: Scripts automatiques
4. **Configuration Centralisée**: Tout dans `vercel.json`