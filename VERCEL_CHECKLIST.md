# ✅ Checklist de Déploiement Vercel

## Avant le Déploiement

### 🔧 Configuration Locale
- [ ] Tous les changements sont commités et poussés sur GitHub
- [ ] Le build local fonctionne : `cd frontend && bun run build`
- [ ] Les tests passent (si applicable)
- [ ] Les variables d'environnement sont documentées

### 📁 Fichiers Requis
- [ ] `vercel.json` - Configuration Vercel
- [ ] `frontend/.env.production` - Variables d'environnement
- [ ] `frontend/next.config.ts` - Configuration Next.js optimisée
- [ ] `deploy.md` - Guide de déploiement

### 🗄️ Base de Données Supabase
- [ ] Projet Supabase créé et configuré
- [ ] Tables créées (users, user_sessions, system_logs, etc.)
- [ ] Fonctions RPC déployées
- [ ] Clés API récupérées (URL + anon key + service role key)
- [ ] Politiques de sécurité configurées

## Déploiement Vercel

### 🚀 Étapes de Base
1. [ ] Aller sur [vercel.com](https://vercel.com)
2. [ ] Se connecter avec GitHub
3. [ ] Importer le repository `stock`
4. [ ] Configurer le projet :
   - Framework: **Next.js**
   - Root Directory: **frontend**
   - Build Command: `bun run build`

### 🔐 Variables d'Environnement
Configurer dans Vercel Dashboard → Settings → Environment Variables :

```env
# Supabase (REQUIS)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT (REQUIS)
JWT_SECRET=votre-secret-256-bits-super-securise

# API (REQUIS)
NEXT_PUBLIC_API_URL=https://votre-app.vercel.app/api

# Environnement
NODE_ENV=production
```

### 🌐 Configuration Supabase
Dans Supabase Dashboard → Authentication → URL Configuration :
- [ ] Site URL: `https://votre-app.vercel.app`
- [ ] Redirect URLs: `https://votre-app.vercel.app/auth/callback`

## Post-Déploiement

### 🧪 Tests Fonctionnels
- [ ] **Page d'accueil** : Redirection vers `/login`
- [ ] **API Health** : `https://votre-app.vercel.app/api/health`
- [ ] **Login Admin** : `admin` / `admin123`
- [ ] **Sélection Tenant** : Choisir une BU
- [ ] **Dashboard** : Accès aux modules
- [ ] **Administration** : Visible uniquement pour admin
- [ ] **Récupération MDP** : Lien "Mot de passe oublié"

### 🔍 Tests de Sécurité
- [ ] **Rôles** : Manager/User ne voient pas le module admin
- [ ] **API Protection** : Routes `/api/admin/*` protégées
- [ ] **JWT** : Tokens valides et expiration
- [ ] **HTTPS** : Toutes les requêtes en HTTPS

### 📊 Performance
- [ ] **Core Web Vitals** : Vérifier dans Vercel Analytics
- [ ] **Temps de chargement** : < 3 secondes
- [ ] **Taille des bundles** : Optimisée
- [ ] **Images** : Optimisées (si applicable)

## Monitoring

### 📈 Métriques à Surveiller
- [ ] **Uptime** : 99.9%+
- [ ] **Response Time** : < 500ms
- [ ] **Error Rate** : < 1%
- [ ] **Function Duration** : < 10s

### 🚨 Alertes
- [ ] Configurer notifications email pour erreurs 5xx
- [ ] Monitoring externe (UptimeRobot, Pingdom)
- [ ] Logs Vercel configurés

## Maintenance

### 🔄 Déploiements Futurs
```bash
# Workflow simple
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
# → Déploiement automatique sur Vercel
```

### 🛠️ Debugging
- [ ] **Logs Vercel** : Dashboard → Functions → View Logs
- [ ] **Console Browser** : F12 pour erreurs frontend
- [ ] **Network Tab** : Vérifier requêtes API
- [ ] **Supabase Logs** : Dashboard → Logs

## Sécurité Production

### 🔒 Bonnes Pratiques
- [ ] **Secrets** : Jamais dans le code, toujours en variables d'env
- [ ] **CORS** : Configuré pour domaine Vercel uniquement
- [ ] **Rate Limiting** : Implémenter si trafic élevé
- [ ] **Monitoring** : Surveiller tentatives d'intrusion
- [ ] **Backups** : Sauvegardes Supabase automatiques

### 🔑 Rotation des Clés
- [ ] JWT Secret : Changer tous les 6 mois
- [ ] Supabase Keys : Surveiller usage
- [ ] GitHub Tokens : Vérifier permissions

## Support

### 📚 Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Docs](https://supabase.com/docs)

### 🆘 En Cas de Problème
1. **Vérifier les logs** Vercel Dashboard
2. **Tester localement** avec `bun run build`
3. **Vérifier variables d'env** dans Vercel
4. **Rollback** si nécessaire (Vercel Dashboard → Deployments)

---

## 🎯 Résultat Attendu

Une fois déployé, vous aurez :
- ✅ Application accessible 24/7 sur Internet
- ✅ HTTPS automatique avec certificat SSL
- ✅ Déploiements automatiques à chaque push
- ✅ Monitoring et analytics intégrés
- ✅ Scalabilité automatique selon le trafic

**URL finale** : `https://votre-app.vercel.app`

Bonne chance pour votre premier déploiement ! 🚀