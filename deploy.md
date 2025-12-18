# 🚀 Guide de Déploiement Vercel

## Prérequis

1. **Compte Vercel** : [vercel.com](https://vercel.com)
2. **Compte GitHub** : Votre repo doit être sur GitHub
3. **Supabase configuré** : Base de données opérationnelle

## Étapes de Déploiement

### 1. Préparer le Repository

```bash
# S'assurer que tout est commité
git add .
git commit -m "feat: Configuration pour déploiement Vercel"
git push origin main
```

### 2. Connecter à Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Se connecter avec GitHub
3. Cliquer "New Project"
4. Importer votre repository `stock`

### 3. Configuration du Projet

#### Framework Preset : **Next.js**
#### Root Directory : **frontend**

#### Build Settings :
- **Build Command** : `bun run build`
- **Output Directory** : `.next`
- **Install Command** : `bun install`

### 4. Variables d'Environnement

Dans Vercel Dashboard → Settings → Environment Variables :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_publique_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_supabase

# JWT
JWT_SECRET=votre-secret-jwt-production-256-bits

# API
NEXT_PUBLIC_API_URL=https://votre-app.vercel.app/api

# Node
NODE_ENV=production
```

### 5. Configuration Supabase

#### URLs autorisées dans Supabase Dashboard :
```
Site URL: https://votre-app.vercel.app
Redirect URLs: 
- https://votre-app.vercel.app/auth/callback
- https://votre-app.vercel.app/login
```

### 6. Déployer

1. Cliquer **"Deploy"** dans Vercel
2. Attendre la compilation (2-5 minutes)
3. Tester l'URL générée

## Structure de Déploiement

```
vercel.app/
├── / (frontend Next.js)
├── /api/ (backend Bun/Hono)
├── /admin/ (module administration)
├── /login (authentification)
└── /dashboard (application principale)
```

## Tests Post-Déploiement

### ✅ Checklist de Vérification

1. **Page d'accueil** : `https://votre-app.vercel.app`
2. **Login** : `https://votre-app.vercel.app/login`
3. **API Health** : `https://votre-app.vercel.app/api/health`
4. **Authentification** : Login avec admin/admin123
5. **Sélection tenant** : Choisir une BU
6. **Dashboard** : Accès aux modules
7. **Administration** : Accès admin uniquement

### 🔧 Debugging

#### Logs Vercel :
- Dashboard → Functions → View Function Logs

#### Erreurs communes :
1. **500 Error** : Vérifier variables d'environnement
2. **API 404** : Vérifier routes dans vercel.json
3. **DB Connection** : Vérifier clés Supabase
4. **CORS** : Ajouter domaine Vercel dans backend

## Commandes Utiles

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer depuis le terminal
vercel

# Voir les logs
vercel logs

# Variables d'environnement
vercel env ls
vercel env add JWT_SECRET
```

## Domaine Personnalisé (Optionnel)

1. Vercel Dashboard → Settings → Domains
2. Ajouter votre domaine
3. Configurer DNS selon instructions Vercel
4. Mettre à jour les URLs Supabase

## Monitoring

### Métriques Vercel :
- **Performance** : Core Web Vitals
- **Usage** : Bandwidth, Function Invocations
- **Errors** : 4xx/5xx responses

### Alertes :
- Configurer notifications par email
- Monitoring uptime avec services externes

## Sécurité Production

### ✅ Checklist Sécurité :

1. **JWT Secret** : Générer clé 256-bits sécurisée
2. **HTTPS** : Forcé automatiquement par Vercel
3. **Variables d'env** : Jamais dans le code
4. **CORS** : Restreindre aux domaines autorisés
5. **Rate Limiting** : Implémenter si nécessaire
6. **Logs** : Monitoring des tentatives d'intrusion

## Maintenance

### Mises à jour :
```bash
# Développement local
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
# → Déploiement automatique sur Vercel
```

### Rollback :
- Vercel Dashboard → Deployments
- Cliquer sur version précédente → Promote to Production

## Support

- **Documentation** : [vercel.com/docs](https://vercel.com/docs)
- **Community** : [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Status** : [vercel-status.com](https://vercel-status.com)