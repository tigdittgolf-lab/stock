# 🏠 Guide d'Utilisation en Mode Local (Sans Internet)

## 🎯 Objectif
Utiliser votre application complètement en local quand vous n'avez pas d'accès Internet.

## 🚀 Démarrage Rapide

### Option 1 : Script Automatique (RECOMMANDÉ)
```bash
# Double-cliquez sur le fichier :
start-local-app.bat
```

### Option 2 : Script PowerShell
```powershell
# Clic droit → "Exécuter avec PowerShell" :
start-local-app.ps1
```

### Option 3 : Démarrage Manuel
```bash
# Terminal 1 - Backend
cd backend
bun index.ts

# Terminal 2 - Frontend  
cd frontend
npm run dev

# Puis ouvrir : http://localhost:3000
```

## 🌐 URLs Locales

| Service | URL | Description |
|---------|-----|-------------|
| **Application** | http://localhost:3000 | Interface utilisateur |
| **API Backend** | http://localhost:3005 | API et données |
| **Health Check** | http://localhost:3005/health | Vérification backend |

## 🗄️ Bases de Données Locales

### MySQL (WAMP)
- **Host** : localhost
- **Port** : 3307
- **Database** : stock_management
- **User** : root
- **Password** : (vide)

### PostgreSQL
- **Host** : localhost  
- **Port** : 5432
- **Database** : postgres
- **User** : postgres
- **Password** : postgres

## ✅ Avantages du Mode Local

- ✅ **Fonctionne sans Internet**
- ✅ **Performance maximale** (pas de latence réseau)
- ✅ **Données privées** (tout reste sur votre PC)
- ✅ **Développement rapide** (hot reload)
- ✅ **Contrôle total**

## 🔄 Basculer entre Local et Cloud

### Mode Local (Sans Internet)
```
Frontend (localhost:3000) → Backend (localhost:3005) → Bases Locales
```

### Mode Cloud (Avec Internet)  
```
Frontend (Vercel) → Tailscale → Backend (localhost:3005) → Bases Locales
```

## 🛠️ Dépannage

### Backend ne démarre pas
```bash
cd backend
bun install  # Réinstaller les dépendances
bun index.ts
```

### Frontend ne démarre pas
```bash
cd frontend
npm install  # Réinstaller les dépendances
npm run dev
```

### Port déjà utilisé
```bash
# Tuer les processus sur les ports
netstat -ano | findstr :3000
netstat -ano | findstr :3005
taskkill /PID [PID_NUMBER] /F
```

## 📊 Comparaison des Modes

| Aspect | Mode Local | Mode Cloud |
|--------|------------|------------|
| **Internet** | ❌ Pas requis | ✅ Requis |
| **Performance** | 🚀 Très rapide | 🌐 Dépend réseau |
| **Accès externe** | ❌ PC uniquement | ✅ Partout |
| **Sécurité** | 🔒 Très sécurisé | 🛡️ Tailscale sécurisé |
| **Maintenance** | 🔧 Manuelle | ☁️ Automatique |

## 🎯 Recommandations

- **Développement** : Mode Local
- **Démonstration** : Mode Cloud  
- **Production** : Mode Cloud
- **Pas d'Internet** : Mode Local

## 🚨 Important

Vos données restent **toujours locales** dans les deux modes. Seule l'interface change d'emplacement !