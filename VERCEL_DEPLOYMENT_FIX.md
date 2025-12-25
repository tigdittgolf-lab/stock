
# INSTRUCTIONS POUR CORRIGER LE DÉPLOIEMENT VERCEL

## 1. Désactiver la protection Vercel (si pas encore fait)

1. Aller sur: https://vercel.com/tigdittgolf-9191s-projects/frontend/settings/security
2. Désactiver "Build Logs and Source Protection"
3. Désactiver "Git Fork Protection" 
4. Sauvegarder les changements

## 2. Configurer les variables d'environnement

```bash
# Configurer l'URL du backend
vercel env add NEXT_PUBLIC_API_URL
# Entrer: https://enabled-encourage-mechanics-performance.trycloudflare.com/api

# Configurer l'environnement
vercel env add NODE_ENV
# Entrer: production
```

## 3. Utiliser la nouvelle configuration

```bash
# Copier la nouvelle configuration
cp vercel-fixed.json vercel.json

# Redéployer
cd frontend
vercel --prod
```

## 4. Vérifier le déploiement

Une fois déployé, l'application devrait :
- ✅ Être accessible sans protection Vercel
- ✅ Se connecter au backend local via tunnel
- ✅ Permettre l'authentification
- ✅ Permettre le switch entre bases de données

## 5. URL de test

Application: https://st-article-1-b5pn7fp0k-tigdittgolf-9191s-projects.vercel.app
Backend: https://enabled-encourage-mechanics-performance.trycloudflare.com

## 6. Test rapide

```bash
# Tester l'application
node fix-vercel-deployment.js
```
