# 📦 Guide d'Installation Professionnel - Application de Gestion de Stock

## 🎯 OBJECTIF

Installer l'application de gestion de stock sur le PC/Laptop du client avec accès depuis n'importe où via Internet.

## 📋 PRÉREQUIS TECHNIQUES

### Matériel requis
- PC ou Laptop Windows 10/11
- Minimum 4 GB RAM
- 10 GB d'espace disque libre
- Connexion Internet stable

### Logiciels à installer
1. **WAMP Server** (Apache + MySQL + PHP)
2. **Node.js** (version LTS)
3. **Tailscale** (pour l'accès distant)
4. **Git** (optionnel, pour les mises à jour)

## 🚀 INSTALLATION ÉTAPE PAR ÉTAPE

### ÉTAPE 1 : Installation de WAMP Server

**Durée estimée : 10 minutes**

1. Télécharger WAMP depuis : https://www.wampserver.com/en/
2. Exécuter l'installateur
3. Choisir le répertoire d'installation (par défaut : `C:\wamp64`)
4. Laisser les options par défaut
5. Démarrer WAMP (icône verte dans la barre des tâches)

**Vérification** :
- Ouvrir http://localhost dans le navigateur
- Vous devriez voir la page d'accueil de WAMP

### ÉTAPE 2 : Installation de Node.js

**Durée estimée : 5 minutes**

1. Télécharger Node.js LTS depuis : https://nodejs.org
2. Exécuter l'installateur
3. Accepter les options par défaut
4. Redémarrer le PC après l'installation

**Vérification** :
```powershell
node --version
npm --version
```

### ÉTAPE 3 : Installation de Tailscale

**Durée estimée : 5 minutes**

1. Télécharger Tailscale depuis : https://tailscale.com/download/windows
2. Exécuter l'installateur
3. Se connecter avec un compte Google/Microsoft/GitHub
4. Accepter les autorisations réseau

**Vérification** :
```powershell
tailscale status
```

### ÉTAPE 4 : Configuration de la base de données

**Durée estimée : 5 minutes**

1. Ouvrir phpMyAdmin : http://localhost/phpmyadmin
2. Créer une nouvelle base de données : `stock_management`
3. Importer le fichier SQL fourni : `database-setup.sql`

**Vérification** :
- La base `stock_management` doit apparaître dans phpMyAdmin
- Les tables doivent être créées

### ÉTAPE 5 : Installation de l'application

**Durée estimée : 10 minutes**

1. Copier le dossier `stock-app` sur le PC du client
2. Ouvrir PowerShell en tant qu'administrateur
3. Naviguer vers le dossier :
```powershell
cd C:\stock-app
```

4. Installer les dépendances :
```powershell
npm install
```

5. Configurer les variables d'environnement :
```powershell
copy .env.example .env.local
```

6. Éditer `.env.local` avec les informations du client

### ÉTAPE 6 : Configuration de Tailscale Funnel

**Durée estimée : 5 minutes**

1. Démarrer le serveur proxy :
```powershell
.\start-mysql-proxy.ps1
```

2. Dans un autre terminal, activer Tailscale Funnel :
```powershell
tailscale funnel 3307
```

3. Obtenir l'URL publique :
```powershell
tailscale status
```

4. Noter l'URL (ex: `https://pc-client.tailnet-xxxx.ts.net`)

### ÉTAPE 7 : Démarrage de l'application

**Durée estimée : 5 minutes**

1. Démarrer le backend :
```powershell
.\start-backend.ps1
```

2. Démarrer le frontend :
```powershell
.\start-frontend.ps1
```

3. Ouvrir le navigateur : http://localhost:3000

**Vérification** :
- L'application doit s'afficher
- Vous pouvez vous connecter
- Les données s'affichent correctement

### ÉTAPE 8 : Configuration de l'accès distant (Production)

**Durée estimée : 10 minutes**

1. Configurer Vercel avec l'URL Tailscale
2. Déployer l'application
3. Tester l'accès depuis Internet

## 📝 TEMPS TOTAL D'INSTALLATION

**Temps estimé : 55 minutes**

- Installation logiciels : 20 minutes
- Configuration base de données : 5 minutes
- Installation application : 10 minutes
- Configuration Tailscale : 5 minutes
- Démarrage et tests : 15 minutes

## 🔧 MAINTENANCE

### Démarrage quotidien

Le client doit simplement :
1. Démarrer WAMP (icône verte)
2. Exécuter `start-all.ps1`

### Arrêt

1. Exécuter `stop-all.ps1`
2. Arrêter WAMP

### Mises à jour

1. Exécuter `update-app.ps1`
2. Redémarrer l'application

## 🆘 SUPPORT

En cas de problème :
1. Vérifier les logs : `logs\error.log`
2. Redémarrer l'application : `restart-all.ps1`
3. Contacter le support technique

## 📞 CONTACT SUPPORT

- Email : support@votre-entreprise.com
- Téléphone : +213 XXX XXX XXX
- WhatsApp : +213 XXX XXX XXX
