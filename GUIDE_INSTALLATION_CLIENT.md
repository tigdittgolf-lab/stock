# 📦 Guide d'Installation Client

## Vue d'ensemble

Votre application a 3 composants:
1. **Frontend** (Next.js) - Interface utilisateur
2. **Backend** (Bun/Hono) - API et logique métier
3. **Base de données** (MySQL) - Stockage des données

## Options de déploiement

### Option 1: Installation Locale Complète (Recommandée pour PME)
**Avantages**: Données 100% locales, pas de dépendance internet, rapide
**Inconvénients**: Nécessite maintenance locale

### Option 2: Cloud Complet (SaaS)
**Avantages**: Pas d'installation, accessible partout, maintenance centralisée
**Inconvénients**: Dépendance internet, coûts récurrents

### Option 3: Hybride (Backend local + Frontend cloud)
**Avantages**: Données locales, interface accessible partout
**Inconvénients**: Configuration réseau complexe

---

## 🏢 OPTION 1: Installation Locale Complète

### Prérequis
- Windows 10/11 ou Linux
- 4 GB RAM minimum (8 GB recommandé)
- 10 GB espace disque
- Droits administrateur

### Étape 1: Installer les dépendances

#### Windows
```powershell
# 1. Installer Node.js (LTS)
# Télécharger depuis: https://nodejs.org/
# Vérifier: node --version (doit afficher v20.x ou plus)

# 2. Installer Bun
powershell -c "irm bun.sh/install.ps1 | iex"

# 3. Installer MySQL
# Télécharger depuis: https://dev.mysql.com/downloads/installer/
# Choisir: MySQL Server + MySQL Workbench
# Mot de passe root: [à définir]
```

#### Linux (Ubuntu/Debian)
```bash
# 1. Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Bun
curl -fsSL https://bun.sh/install | bash

# 3. MySQL
sudo apt-get install mysql-server
sudo mysql_secure_installation
```

### Étape 2: Cloner et configurer l'application

```powershell
# Cloner le repository
git clone https://github.com/tigdittgolf-lab/stock.git
cd stock

# Installer les dépendances
cd backend
bun install
cd ../frontend
npm install
cd ..
```

### Étape 3: Configurer la base de données

```powershell
# Se connecter à MySQL
mysql -u root -p

# Créer la base de données
CREATE DATABASE stock_management;
USE stock_management;

# Importer le schéma
source backend/schema.sql;

# Créer un utilisateur pour l'application
CREATE USER 'stock_user'@'localhost' IDENTIFIED BY 'mot_de_passe_securise';
GRANT ALL PRIVILEGES ON stock_management.* TO 'stock_user'@'localhost';
FLUSH PRIVILEGES;
```

### Étape 4: Configurer les variables d'environnement

**Backend** (`backend/.env`):
```env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=stock_user
DB_PASSWORD=mot_de_passe_securise
DB_NAME=stock_management

# Serveur
PORT=3005
NODE_ENV=production

# Sécurité
JWT_SECRET=generer_une_cle_secrete_longue_et_aleatoire
```

**Frontend** (`frontend/.env.local`):
```env
# Backend
NEXT_PUBLIC_API_URL=http://localhost:3005

# Base de données (pour les routes API)
BACKEND_URL=http://localhost:3005
```

### Étape 5: Créer les scripts de démarrage

**Windows** (`start-app.bat`):
```batch
@echo off
echo Demarrage de l'application Stock Management...

REM Demarrer MySQL (si pas deja demarre)
net start MySQL80

REM Demarrer le backend
start "Backend" cmd /k "cd backend && bun run dev"

REM Attendre 5 secondes
timeout /t 5

REM Demarrer le frontend
start "Frontend" cmd /k "cd frontend && npm run dev"

echo Application demarree!
echo Backend: http://localhost:3005
echo Frontend: http://localhost:3000
pause
```

**Linux** (`start-app.sh`):
```bash
#!/bin/bash
echo "Démarrage de l'application Stock Management..."

# Démarrer MySQL
sudo systemctl start mysql

# Démarrer le backend
cd backend
bun run dev &
BACKEND_PID=$!

# Attendre 5 secondes
sleep 5

# Démarrer le frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Application démarrée!"
echo "Backend: http://localhost:3005"
echo "Frontend: http://localhost:3000"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Attendre Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
```

### Étape 6: Créer un service Windows (optionnel)

Pour que l'application démarre automatiquement:

```powershell
# Installer NSSM (Non-Sucking Service Manager)
# Télécharger depuis: https://nssm.cc/download

# Créer le service backend
nssm install StockBackend "C:\Program Files\nodejs\node.exe"
nssm set StockBackend AppDirectory "C:\stock\backend"
nssm set StockBackend AppParameters "C:\Users\[USER]\.bun\bin\bun.exe run dev"
nssm set StockBackend DisplayName "Stock Management Backend"
nssm set StockBackend Start SERVICE_AUTO_START

# Créer le service frontend
nssm install StockFrontend "C:\Program Files\nodejs\node.exe"
nssm set StockFrontend AppDirectory "C:\stock\frontend"
nssm set StockFrontend AppParameters "node_modules\.bin\next start"
nssm set StockFrontend DisplayName "Stock Management Frontend"
nssm set StockFrontend Start SERVICE_AUTO_START

# Démarrer les services
nssm start StockBackend
nssm start StockFrontend
```

### Étape 7: Accès depuis d'autres appareils (réseau local)

Pour accéder depuis smartphones/tablettes sur le même réseau:

1. **Trouver l'IP du PC serveur**:
```powershell
ipconfig
# Chercher "Adresse IPv4" (ex: 192.168.1.100)
```

2. **Configurer le pare-feu**:
```powershell
# Autoriser les ports
netsh advfirewall firewall add rule name="Stock Backend" dir=in action=allow protocol=TCP localport=3005
netsh advfirewall firewall add rule name="Stock Frontend" dir=in action=allow protocol=TCP localport=3000
```

3. **Accéder depuis smartphone**:
```
http://192.168.1.100:3000
```

---

## ☁️ OPTION 2: Cloud Complet (SaaS)

### Architecture
- Frontend: Vercel (gratuit jusqu'à 100GB/mois)
- Backend: Railway/Render/Fly.io (~$5-10/mois)
- Base de données: PlanetScale/Supabase (~$10-25/mois)

### Étape 1: Déployer le backend

**Railway** (recommandé):
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Créer un nouveau projet
railway init

# Déployer
cd backend
railway up

# Ajouter MySQL
railway add mysql

# Configurer les variables
railway variables set DB_HOST=${{MYSQLHOST}}
railway variables set DB_PORT=${{MYSQLPORT}}
railway variables set DB_USER=${{MYSQLUSER}}
railway variables set DB_PASSWORD=${{MYSQLPASSWORD}}
railway variables set DB_NAME=${{MYSQLDATABASE}}
```

### Étape 2: Déployer le frontend

**Vercel**:
```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
cd frontend
vercel

# Configurer les variables
vercel env add BACKEND_URL
# Entrer: https://[votre-backend].railway.app
```

### Étape 3: Configurer le domaine personnalisé

```bash
# Ajouter un domaine
vercel domains add stock.votreentreprise.com

# Configurer DNS (chez votre registrar)
# Type: CNAME
# Name: stock
# Value: cname.vercel-dns.com
```

---

## 🔄 OPTION 3: Hybride (Recommandée pour multi-sites)

### Architecture
- Frontend: Vercel (cloud)
- Backend + DB: Local (chaque site)
- Connexion: Tailscale (VPN)

### Avantages
- Données locales (sécurité, rapidité)
- Interface accessible partout
- Pas de coûts cloud pour la DB

### Configuration

**Sur chaque site client**:

1. **Installer Tailscale**:
```powershell
# Télécharger: https://tailscale.com/download
# Installer et se connecter
tailscale login
```

2. **Exposer le backend**:
```powershell
cd backend
bun run dev

# Dans un autre terminal
tailscale funnel --bg 3005
```

3. **Noter l'URL Tailscale**:
```powershell
tailscale status
# Copier l'URL: https://[machine-name].tail[xxx].ts.net
```

4. **Configurer Vercel** (une seule fois):
```bash
vercel env add BACKEND_URL
# Entrer: https://[machine-name].tail[xxx].ts.net
```

---

## 📱 Accès Mobile

### Progressive Web App (PWA)

L'application est déjà une PWA. Sur smartphone:

1. **Ouvrir dans Chrome/Safari**
2. **Menu** → **Ajouter à l'écran d'accueil**
3. **L'icône apparaît** comme une app native

### Application native (optionnel)

Pour créer une vraie app mobile:

```bash
# Installer Capacitor
cd frontend
npm install @capacitor/core @capacitor/cli
npx cap init

# Ajouter les plateformes
npx cap add android
npx cap add ios

# Build
npm run build
npx cap sync

# Ouvrir dans Android Studio / Xcode
npx cap open android
npx cap open ios
```

---

## 🔒 Sécurité

### Checklist de sécurité

- [ ] Changer tous les mots de passe par défaut
- [ ] Activer HTTPS (Let's Encrypt gratuit)
- [ ] Configurer le pare-feu
- [ ] Sauvegardes automatiques quotidiennes
- [ ] Limiter les accès réseau
- [ ] Activer l'authentification à 2 facteurs
- [ ] Logs d'audit activés

### Script de sauvegarde automatique

**Windows** (`backup.bat`):
```batch
@echo off
set BACKUP_DIR=C:\Backups\Stock
set DATE=%date:~-4,4%%date:~-7,2%%date:~-10,2%

REM Créer le dossier de backup
mkdir %BACKUP_DIR%\%DATE%

REM Sauvegarder la base de données
mysqldump -u root -p stock_management > %BACKUP_DIR%\%DATE%\database.sql

REM Sauvegarder les fichiers
xcopy /E /I C:\stock %BACKUP_DIR%\%DATE%\files

echo Sauvegarde terminee: %BACKUP_DIR%\%DATE%
```

Ajouter dans le Planificateur de tâches Windows pour exécution quotidienne.

---

## 📊 Monitoring

### Installer un monitoring simple

```bash
# Installer PM2 (gestionnaire de processus)
npm install -g pm2

# Démarrer avec PM2
cd backend
pm2 start "bun run dev" --name stock-backend

cd ../frontend
pm2 start "npm run start" --name stock-frontend

# Monitoring
pm2 monit

# Logs
pm2 logs

# Redémarrage automatique au boot
pm2 startup
pm2 save
```

---

## 💰 Estimation des coûts

### Option 1: Local
- **Matériel**: PC existant ou mini-PC (~300€ one-time)
- **Électricité**: ~5€/mois
- **Total**: ~5€/mois après investissement initial

### Option 2: Cloud
- **Frontend**: Gratuit (Vercel)
- **Backend**: 10€/mois (Railway)
- **Database**: 15€/mois (PlanetScale)
- **Total**: ~25€/mois

### Option 3: Hybride
- **Frontend**: Gratuit (Vercel)
- **Backend + DB**: Local (5€/mois électricité)
- **Tailscale**: Gratuit (jusqu'à 100 appareils)
- **Total**: ~5€/mois

---

## 🎓 Formation Client

### Checklist de formation

- [ ] Connexion et navigation
- [ ] Gestion des articles
- [ ] Création de bons de livraison
- [ ] Gestion des paiements
- [ ] Rapports et statistiques
- [ ] Sauvegarde et restauration
- [ ] Résolution des problèmes courants

### Documentation utilisateur

Créer un manuel utilisateur avec captures d'écran pour chaque fonctionnalité.

---

## 📞 Support

### Niveaux de support

**Niveau 1**: Documentation et FAQ
**Niveau 2**: Support email (24-48h)
**Niveau 3**: Support téléphonique/TeamViewer
**Niveau 4**: Intervention sur site

### Contrat de maintenance

Proposer un contrat incluant:
- Mises à jour de sécurité
- Nouvelles fonctionnalités
- Support prioritaire
- Sauvegardes externalisées

---

## 🚀 Recommandation

Pour la plupart des PME:
1. **Démarrer avec Option 1** (local) pour tester
2. **Passer à Option 3** (hybride) si besoin d'accès distant
3. **Option 2** (cloud) uniquement si multi-sites avec beaucoup de mobilité

**Pourquoi?**
- Coûts maîtrisés
- Données sous contrôle
- Performance optimale
- Évolutif selon les besoins
