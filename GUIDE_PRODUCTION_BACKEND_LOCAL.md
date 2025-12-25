# Guide: Utiliser l'Application Web avec Backend Local

## 🎯 OBJECTIF
Permettre aux clients d'utiliser l'application web hébergée sur Vercel tout en se connectant à leurs bases de données locales.

## 🏗️ ARCHITECTURE

```
Application Web (Vercel) → Tunnel Public → Backend Local → Bases de Données Locales
```

## 📋 ÉTAPES POUR LE CLIENT

### 1. Prérequis
- Backend local installé et fonctionnel
- Bases de données locales (MySQL, PostgreSQL) configurées
- Accès internet pour créer un tunnel

### 2. Installation du Tunnel (Choisir une option)

#### Option A: ngrok (Recommandé)
```bash
# Installer ngrok
npm install -g ngrok
# ou télécharger depuis https://ngrok.com/

# Créer un compte gratuit sur ngrok.com
# Configurer le token d'authentification
ngrok config add-authtoken YOUR_TOKEN
```

#### Option B: Cloudflare Tunnel
```bash
# Télécharger cloudflared
# Depuis https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
```

### 3. Démarrage du Système

#### Étape 1: Démarrer le Backend Local
```bash
cd backend
npm install
npm run dev
# Le backend démarre sur http://localhost:3005
```

#### Étape 2: Créer le Tunnel Public
```bash
# Avec ngrok
ngrok http 3005

# Avec cloudflare
cloudflared tunnel --url http://localhost:3005
```

#### Étape 3: Noter l'URL Publique
Le tunnel génère une URL publique, par exemple :
- ngrok: `https://abc123.ngrok.io`
- cloudflare: `https://abc123.trycloudflare.com`

### 4. Configuration dans l'Application Web

1. **Ouvrir l'application** : https://votre-app.vercel.app
2. **Aller dans Configuration** : Cliquer sur l'icône ⚙️ "Configurer Backend"
3. **Saisir l'URL du tunnel** : Coller l'URL publique (ex: https://abc123.ngrok.io)
4. **Tester la connexion** : Cliquer sur "🔍 Tester"
5. **Sauvegarder** : Cliquer sur "💾 Sauvegarder"

### 5. Utilisation Normale

Une fois configuré, l'application fonctionne normalement :
- ✅ Switch entre bases de données (MySQL, PostgreSQL, Supabase)
- ✅ Gestion complète des données
- ✅ Génération de documents PDF
- ✅ Toutes les fonctionnalités disponibles

## 🔧 SCRIPT AUTOMATISÉ

Créer un fichier `start-production.bat` :

```batch
@echo off
echo 🚀 Démarrage du système pour production...

echo 📡 Démarrage du backend...
start /B npm run dev

echo ⏳ Attente du démarrage du backend...
timeout /t 5

echo 🌐 Création du tunnel ngrok...
echo 📋 Copiez l'URL https://xxx.ngrok.io dans l'application web
ngrok http 3005
```

## ⚠️ CONSIDÉRATIONS IMPORTANTES

### Sécurité
- ✅ **Tunnel temporaire** : Se ferme quand vous l'arrêtez
- ✅ **Contrôle total** : Vous gérez l'accès à vos données
- ✅ **Pas de stockage externe** : Données restent sur votre machine

### Limitations
- 🔄 **URL change** : L'URL ngrok gratuite change à chaque redémarrage
- 🌐 **Internet requis** : Tunnel nécessite une connexion internet
- ⚡ **Latence** : Légère latence supplémentaire via le tunnel

### Solutions aux Limitations
- **URL fixe** : Compte ngrok payant pour URL permanente
- **Tunnel local** : Utiliser en développement sans tunnel
- **Backend cloud** : Déployer le backend sur un service cloud

## 🆘 DÉPANNAGE

### Backend Non Accessible
1. Vérifier que le backend tourne sur le port 3005
2. Tester localement : http://localhost:3005/api/health
3. Vérifier que le tunnel pointe vers le bon port

### Tunnel Non Fonctionnel
1. Redémarrer ngrok/cloudflare
2. Vérifier la connexion internet
3. Essayer un autre service de tunnel

### Switch de Base Non Fonctionnel
1. Vérifier la configuration de l'URL dans l'app
2. Tester la connexion backend
3. Vérifier les logs du backend

## 📞 SUPPORT

En cas de problème :
1. Vérifier les logs du backend
2. Tester la connexion étape par étape
3. Contacter le support avec les détails de l'erreur

## ✅ RÉSUMÉ

Cette solution permet :
- 🌐 **Application web moderne** hébergée sur Vercel
- 🏠 **Données locales sécurisées** sur votre machine
- 🔄 **Flexibilité totale** : switch entre toutes vos bases
- 🛡️ **Sécurité maximale** : contrôle total de l'accès

L'application web devient un client léger qui se connecte à votre infrastructure locale via un tunnel sécurisé temporaire.