# Commandes Utiles

## 🚀 Démarrage

### Démarrage Complet (Windows)
```bash
start-dev.bat
```

### Démarrage Backend
```bash
cd backend
bun run index.ts
```

### Démarrage Frontend
```bash
cd frontend
npm run dev
```

## 📦 Installation

### Backend
```bash
cd backend
bun install
```

### Frontend
```bash
cd frontend
npm install
```

## 🔨 Build

### Build Frontend (Production)
```bash
cd frontend
npm run build
npm start
```

### Build Backend
Le backend Bun n'a pas besoin de build, il s'exécute directement.

## 🧪 Tests

### Backend
```bash
cd backend
bun test
```

### Frontend
```bash
cd frontend
npm test
```

## 🧹 Nettoyage

### Nettoyer node_modules
```bash
# Backend
cd backend
rm -rf node_modules
bun install

# Frontend
cd frontend
rm -rf node_modules
npm install
```

### Nettoyer le cache Next.js
```bash
cd frontend
rm -rf .next
npm run dev
```

## 📊 Base de Données

### Réinitialiser la base de données
```bash
cd backend
# Exécuter les scripts SQL dans Supabase Dashboard
# ou utiliser le client Supabase
```

### Créer une sauvegarde
```bash
# Via Supabase Dashboard > Database > Backups
```

### Restaurer une sauvegarde
```bash
# Via Supabase Dashboard > Database > Backups
```

## 🔍 Débogage

### Vérifier les logs Backend
```bash
cd backend
bun run index.ts
# Les logs s'affichent dans la console
```

### Vérifier les logs Frontend
```bash
cd frontend
npm run dev
# Ouvrir DevTools (F12) dans le navigateur
```

### Tester une route API
```bash
# Avec curl
curl http://localhost:3005/api/articles

# Avec PowerShell
Invoke-WebRequest -Uri http://localhost:3005/api/articles
```

## 📝 Développement

### Créer une nouvelle route API
```bash
# 1. Créer le fichier
cd backend/src/routes
# Créer votre-route.ts

# 2. Importer dans index.ts
# import yourRoute from './src/routes/votre-route.js';
# app.route('/api/votre-route', yourRoute);
```

### Créer une nouvelle page
```bash
cd frontend/app
mkdir nouvelle-page
# Créer page.tsx dans le nouveau dossier
```

### Ajouter une dépendance

#### Backend
```bash
cd backend
bun add nom-du-package
```

#### Frontend
```bash
cd frontend
npm install nom-du-package
```

## 🔧 Configuration

### Mettre à jour les variables d'environnement

#### Backend (.env)
```bash
cd backend
# Éditer .env
```

#### Frontend (.env.local)
```bash
cd frontend
# Éditer .env.local
```

### Vérifier la configuration
```bash
# Backend
cd backend
cat .env

# Frontend
cd frontend
cat .env.local
```

## 📈 Performance

### Analyser le bundle Frontend
```bash
cd frontend
npm run build
# Vérifier la taille des bundles dans la sortie
```

### Profiler l'application
```bash
# Utiliser React DevTools Profiler
# Ouvrir DevTools > Profiler
```

## 🔐 Sécurité

### Vérifier les vulnérabilités

#### Backend
```bash
cd backend
bun audit
```

#### Frontend
```bash
cd frontend
npm audit
npm audit fix
```

## 📦 Déploiement

### Préparer pour la production

#### Frontend
```bash
cd frontend
npm run build
# Les fichiers sont dans .next/
```

#### Backend
```bash
cd backend
# Bun s'exécute directement en production
# Configurer les variables d'environnement de production
```

### Déployer sur Vercel (Frontend)
```bash
cd frontend
npm install -g vercel
vercel
```

### Déployer le Backend
```bash
# Utiliser un service comme Railway, Render, ou Fly.io
# Configurer les variables d'environnement
# Déployer le dossier backend/
```

## 🔄 Mise à jour

### Mettre à jour les dépendances

#### Backend
```bash
cd backend
bun update
```

#### Frontend
```bash
cd frontend
npm update
```

### Mettre à jour Next.js
```bash
cd frontend
npm install next@latest react@latest react-dom@latest
```

## 📊 Monitoring

### Vérifier l'état de l'API
```bash
curl http://localhost:3005/health
```

### Vérifier les logs Supabase
```bash
# Via Supabase Dashboard > Logs
```

## 🛠️ Maintenance

### Nettoyer les logs
```bash
# Les logs sont dans la console, pas de fichiers à nettoyer
```

### Optimiser la base de données
```bash
# Via Supabase Dashboard > Database > Optimize
```

## 📱 Mobile

### Tester sur mobile (même réseau)
```bash
# Trouver votre IP locale
ipconfig

# Accéder depuis mobile
# http://VOTRE_IP:3000
```

## 🔍 Recherche

### Rechercher dans le code
```bash
# Rechercher un terme
grep -r "terme" .

# Rechercher dans les fichiers TypeScript
grep -r "terme" --include="*.ts" --include="*.tsx" .
```

### Rechercher dans les logs
```bash
# Les logs sont dans la console
# Utiliser Ctrl+F dans le terminal
```

## 💡 Astuces

### Redémarrage rapide
```bash
# Backend: Ctrl+C puis relancer
# Frontend: Ctrl+C puis relancer
# Ou utiliser start-dev.bat
```

### Mode développement avec auto-reload
```bash
# Backend: Bun recharge automatiquement
# Frontend: Next.js recharge automatiquement
```

### Vérifier les ports utilisés
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3005

# Tuer un processus
taskkill /PID <PID> /F
```
