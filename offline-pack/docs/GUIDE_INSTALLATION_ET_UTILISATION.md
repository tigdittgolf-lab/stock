# 📘 StockApp — Guide d'utilisation et d'installation

> **Document unifié** regroupant l'installation (côté administrateur /
> développeur) et l'utilisation quotidienne (côté utilisateur final).
> Mode **hors-ligne** (sans Internet) et **cloud**.

**Version :** 1.0 — Juin 2026

---

## 📑 Sommaire

**Partie I — Installation (administrateur / développeur)**
1. Pré-requis machine de build
2. Préparer les binaires portables
3. Construire le pack
4. Produire l'installeur Windows
5. Tester avant livraison
6. Configuration du pare-feu (mode serveur)

**Partie II — Utilisation quotidienne (utilisateur final)**
7. Démarrer l'application
8. Premier lancement : choisir son mode
9. Se connecter
10. Le tableau de bord
11. Les modules métier
12. Mode réseau (plusieurs PC)
13. Sauvegardes
14. Arrêter & bonnes pratiques

**Partie III — Annexes**
15. Variables d'environnement
16. Dépannage rapide
17. Récapitulatif

---

# PARTIE I — INSTALLATION

> Cette partie s'adresse à la personne qui **prépare et déploie**
> l'application. Le client final n'a rien à faire de son côté : tout est
> embarqué dans l'installeur.

## 1. Pré-requis machine de build

La machine qui **construit** l'installeur a besoin d'Internet (une fois)
pour récupérer les dépendances. Ensuite, **le pack livré au client n'a plus
besoin de rien**.

| Outil | Rôle | Lien |
|-------|------|------|
| **Node.js 20+** + npm | Compilation frontend/backend | https://nodejs.org/ |
| **Bun** (recommandé) | Runtime backend plus rapide | https://bun.sh/ |
| **Git** | Cloner le dépôt | https://git-scm.com/ |
| **Inno Setup 6** | Produire l'installeur `.exe` | https://jrsoftware.org/isdl.php |
| **PowerShell 5.1+** | Exécuter les scripts de build | (fourni avec Windows) |

> ⚠️ La machine cliente n'a **aucun** de ces pré-requis : tout est embarqué.

---

## 2. Préparer les binaires portables

Le dossier `offline-pack/bin/` doit contenir les exécutables **non
versionnés** (trop volumineux). À télécharger une fois :

### 2.1. MariaDB portable

1. Télécharger le **ZIP Windows (x64)** :
   https://mariadb.org/download/?tab=mariadb
2. Décompresser dans :
   ```
   offline-pack\bin\mariadb\bin\mysqld.exe   ← doit exister
   offline-pack\bin\mariadb\bin\mysql.exe
   offline-pack\bin\mariadb\bin\mysqldump.exe
   ```

### 2.2. Node.js portable

1. Télécharger **Windows Binary (.zip) 64-bit** :
   https://nodejs.org/en/download/
2. Décompresser dans :
   ```
   offline-pack\bin\node\node.exe            ← doit exister
   offline-pack\bin\node\npm.cmd
   ```

### 2.3. Bun (optionnel, plus rapide)

Télécharger `bun.exe` (Windows-x64) :
https://github.com/oven-sh/bun/releases → placer dans
`offline-pack\bin\bun\bun.exe`. Si absent, le lanceur bascule
automatiquement sur Node.

### 2.4. Icône (optionnel)

`offline-pack\bin\app.ico` : utilisée pour les raccourcis bureau et menu Démarrer.

---

## 3. Construire le pack

Depuis une console PowerShell :

```powershell
cd C:\netbean\St_Article_1\offline-pack\scripts
.\build-pack.ps1
```

**Paramètres utiles :**

| Paramètre | Effet |
|-----------|-------|
| `-RepoRoot C:\netbean\St_Article_1` | Dossier source |
| `-OutDir C:\StockApp` | Dossier de sortie (défaut) |
| `-SkipFrontendBuild` | Ne pas rebuilder le frontend |
| `-SkipBackendInstall` | Ne pas réinstaller les dépendances backend |

**Ce que fait le script :**

1. Crée la structure `bin/`, `data/`, `logs/`, `database/`, `scripts/`.
2. Copie le **backend** + installe ses dépendances (Bun, sinon npm).
3. Copie le **frontend**, lance `npm install` + `npm run build`.
4. Copie le **schéma SQL** (`schema-mysql.sql` + `seed-admin.sql`).
5. Copie les **scripts** de lancement.
6. Copie **MariaDB portable** et **Node portable** depuis `offline-pack\bin\`.
7. Génère un `.gitignore` (exclut données runtime).

---

## 4. Produire l'installeur Windows

```powershell
cd C:\netbean\St_Article_1\offline-pack\installer
iscc stockapp.iss
```

➡️ Génère `offline-pack\installer\output\StockApp-Setup-1.0.0.exe`.

**Ce que fait l'installeur :**

- Copie tout dans `C:\Program Files\StockApp`.
- Crée un raccourci **menu Démarrer** + (option) **bureau**.
- Exclut `logs\`, `data\mysql\`, `config.env` (le client repart à zéro).
- À la désinstallation : supprime `logs\` et `data\` (client prévenu).
- Lance l'application à la fin de l'installation.

> 💡 **Alternative sans installeur** : zipper `C:\StockApp` et le remettre
> tel quel. Le client le décompresse et double-clique sur `start.bat`.
> Aucune installation administrative n'est requise (sauf pare-feu en mode serveur).

---

## 5. Tester avant livraison

Sur la machine de build :

```powershell
cd C:\StockApp
.\start.bat
```

1. Choisir le mode **standalone** dans l'assistant.
2. Vérifier que les **3 services** démarrent (MariaDB, backend, frontend).
3. Le navigateur doit s'ouvrir sur `http://localhost:3000`.
4. Se connecter avec `admin` / `admin123`.
5. **Ctrl+C** dans la console pour arrêter proprement.

> ⚠️ **Avant livraison** : supprimez `C:\StockApp\data\mysql\` et
> `C:\StockApp\data\.schema-initialized` pour que le client démarre avec
> une base **vierge**.

### Checklist de livraison

- [ ] `bin\mariadb\bin\mysqld.exe` présent
- [ ] `bin\node\node.exe` présent
- [ ] `frontend\.next` présent (build de production)
- [ ] `backend\node_modules` présent
- [ ] `database\schema-mysql.sql` + `seed-admin.sql` présents
- [ ] `start.bat` + `scripts\` présents
- [ ] `data\` et `config.env` **absents** (vierge pour le client)
- [ ] Test de démarrage en standalone réussi
- [ ] `.exe` Inno Setup généré (si livraison par installeur)

---

## 6. Configuration du pare-feu (mode serveur uniquement)

Sur le **PC serveur**, ouvrir une console **en tant qu'administrateur** :

```powershell
cd C:\StockApp\scripts
.\install-firewall-rules.ps1
```

- Crée les règles entrantes **3000** (frontend) et **3005** (backend).
- Profils **Privé** et **Domaine** uniquement (jamais Public).

**Ports utilisés :**

| Port | Service | À ouvrir sur le pare-feu ? |
|:----:|---------|:--------------------------:|
| **3000** | Frontend Next.js | ✅ en mode serveur |
| **3005** | Backend Hono | ❌ non (proxifié par le frontend) |
| **3306** | MySQL/MariaDB | ❌ déconseillé |

---

# PARTIE II — UTILISATION QUOTIDIENNE

> Cette partie s'adresse à **l'utilisateur final**.

## 7. Démarrer l'application

1. Double-cliquez sur l'icône **StockApp** (bureau ou menu Démarrer),
   ou sur **`start.bat`** dans `C:\StockApp`.
2. Une **fenêtre noire** (console) s'ouvre : **ne la fermez pas**.
3. Au premier lancement, un **assistant** s'affiche (voir §8).

### Séquence de démarrage normale

```
>>> Démarrage de la base de données (MariaDB)
    [OK] Base de données prête
>>> Démarrage du backend (port 3005)
    [OK] Backend prêt
>>> Démarrage du frontend (port 3000)
    [OK] Frontend prêt
```

Le navigateur **s'ouvre tout seul** sur la bonne adresse.

> ⚠️ **Ne pas fermer la fenêtre noire** pendant l'utilisation :
> - en **standalone/serveur** : l'application s'arrête pour tout le monde ;
> - en **client** : seul votre affichage se ferme.

### Arrêter proprement

Dans la fenêtre noire : **Ctrl + C**, puis répondre **O**.

> Ne fermez **jamais** la fenêtre avec le X rouge en cours de travail :
> cela peut laisser la base de données instable. Utilisez toujours Ctrl+C.

---

## 8. Premier lancement : choisir son mode

L'assistant demande :

```
Comment allez-vous utiliser l'application ?
  [1] Ce PC uniquement (mode standalone)
  [2] Ce PC SERT de serveur pour le réseau (LAN)
  [3] Ce PC est un CLIENT (se connecter à un serveur existant)

Votre choix (1/2/3) [défaut: 1]
```

| Choix | Quand ? | Ce qui démarre |
|:-----:|---------|----------------|
| **1 — Standalone** | Un seul PC | Base + backend + frontend sur ce PC |
| **2 — Serveur LAN** | Ce PC centralise les données pour d'autres | Idem + accessible au LAN |
| **3 — Client LAN** | Un serveur existe déjà sur le réseau | Seul le navigateur |

### En mode client : saisir l'IP du serveur

```
Adresse IP du PC serveur (ex: 192.168.1.50)
```

Saisir l'**IP** communiquée par l'administrateur (ex: `192.168.1.50`).

> 📌 **Trouver l'IP du serveur** : sur le PC serveur, ouvrir une console
> et taper `ipconfig`. Chercher « **Adresse IPv4** ».

### Validation

L'assistant affiche un récapitulatif → taper **O** (ou Entrée) pour valider.

### Tableau des modes

| Mode | MySQL local | Backend local | Frontend | URL d'accès |
|------|:-----------:|:-------------:|:--------:|-------------|
| **Standalone** | ✅ | ✅ | ✅ | `http://localhost:3000` |
| **Serveur LAN** | ✅ | ✅ | ✅ | `http://<IP-serveur>:3000` |
| **Client LAN** | ❌ | ❌ | navigateur seul | `http://<IP-serveur>:3000` |

---

## 9. Se connecter

**Identifiants par défaut :**

```
Utilisateur : admin
Mot de passe : admin123
```

### 🔐 Changer le mot de passe (OBLIGATOIRE)

Dès la première connexion :

1. Aller dans **Paramètres → Utilisateurs** (ou **Mon profil**).
2. Modifier le mot de passe du compte `admin`.
3. **Le noter en lieu sûr** — en mode offline, il n'y a pas de
   récupération automatique par e-mail.

---

## 10. Le tableau de bord

Page d'accueil après connexion. Il présente :

- **Chiffre d'affaires**, stock global, **valorisation**.
- Indicateurs mis à jour en temps réel, avec **ligne de totaux dynamique**
  (prix unitaire, prix de vente, stock, valorisation) tenant compte des filtres.
- Sélecteur de **business unit** (multi-tenant) et d'**exercice**.
- Indicateur de **base de données** connectée (MySQL local ou Supabase cloud).
- **Thème clair / sombre**.

---

## 11. Les modules métier

StockApp est organisé en **9 modules** accessibles depuis le menu :

### 📊 Tableau de bord
Indicateurs clés et synthèse de l'activité.

### 📦 Articles & Stock
- **Catalogue produits** : désignation, famille, fournisseur, prix d'achat,
  **marge**, TVA, prix de vente, seuil d'alerte.
- **Familles** d'articles.
- **Stock** (physique + en BL), alertes de seuil.
- **Étiquettes** produits imprimables.

### 👥 Clients
- Fiches clients (raison sociale, adresse, contact, téléphone, e-mail).
- **Chiffre d'affaires** et **historique des paiements** par client.
- **Encours** et **échéancier**.

### 🏭 Fournisseurs
- Fiches fournisseurs.
- **Dettes** fournisseurs et **factures d'achat**.

### 🛒 Commerce
- **Bons de livraison (BL)** : créer, modifier, détailler, imprimer en PDF.
- **Factures** : émission, suivi, lien avec les BL.
- **Proforma** : devis.
- **Retours / Avoirs**.

### 🛍️ Achats
- **Bons de livraison fournisseurs**.
- **Factures d'achat**.
- **Statistiques** d'achat.

### 💶 Finances & Paiements
- **Encaissements** (ajout, historique, échéancier).
- **Impayés** et **retard de paiement**.
- **Avoirs** déduits du solde.
- **États récapitulatifs** des paiements (montant net).
- **Dettes** fournisseurs.

### 📑 Fiscal
- **État G50** et paramètres fiscaux.

### ⚙️ Paramètres & Administration
- **Utilisateurs** (création, profils ADMIN/USER).
- **Business units** (multi-tenant).
- **Paramètres société & fiscaux**.

### 📱 Mobile
- Interfaces allégées **mobile** (BL, factures) pour tablette/smartphone.

### 🖨️ Impression PDF
- BL, facture, proforma au format PDF professionnel (montant en lettres,
  coordonnées société).

---

## 12. Mode réseau (plusieurs PC)

### 12.1. Préparer le PC serveur

1. Installer StockApp et choisir le mode **[2] Serveur**.
2. Noter l'**IP LAN** affichée par l'assistant (ex: `192.168.1.50`).
3. Transmettre cette IP aux utilisateurs des PC clients.
4. Ouvrir les ports du pare-feu (voir §6).

### 12.2. Configurer un PC client

Sur chaque PC client :

1. Installer StockApp (ou copier le dossier).
2. Au premier lancement, choisir **[3] Client**.
3. Saisir l'IP du serveur (ex: `192.168.1.50`).
4. Le navigateur s'ouvre sur `http://192.168.1.50:3000`.

### 12.3. Règles à respecter en réseau

| Règle | Pourquoi |
|-------|----------|
| 🔌 **Le PC serveur doit rester allumé** | Les clients ne peuvent plus travailler s'il est éteint. |
| 🌐 **Tous les PC sur le même réseau** | LAN (Wi-Fi ou câble) partagé. |
| 🔒 **Fixer l'IP du serveur** | Demander une **réservation DHCP** ou **IP fixe**. |
| 💾 **Sauvegarder régulièrement** | Voir §13. |

---

## 13. Sauvegardes

En mode offline, **personne d'autre que vous** ne protège vos données.

### 13.1. Sauvegarde manuelle

Sur le PC serveur (ou standalone), console administrateur :

```powershell
powershell.exe -File "C:\StockApp\scripts\backup.ps1" -OutputDir "D:\Mes Sauvegardes"
```

Crée un fichier horodaté : `stockapp_2025_bu01_2026-06-18_2200.sql`.

### 13.2. Sauvegarde automatique (recommandé)

Planifier une sauvegarde quotidienne à 22h00 via le **Planificateur de
tâches Windows** :

```powershell
schtasks /Create /TN "StockApp Backup" `
  /TR "powershell.exe -File C:\StockApp\scripts\backup.ps1 -AppRoot C:\StockApp" `
  /SC DAILY /ST 22:00 /RL HIGHEST
```

Les sauvegardes de plus de **30 jours** sont supprimées automatiquement.

### 13.3. Bonnes pratiques

- ✅ **Copier les sauvegardes sur un disque externe / clé USB** (au moins 1×/semaine).
- ✅ **Tester la restauration** de temps en temps.
- ✅ **Sauvegarder avant** toute mise à jour ou modification importante.

---

## 14. Arrêter & bonnes pratiques

### Arrêter proprement

**Ctrl + C** dans la fenêtre noire → répondre **O**.

### Bonnes pratiques quotidiennes

- ✅ Ne jamais éteindre le PC serveur en coupant le courant : toujours Ctrl+C puis attendre.
- ✅ Sauvegarder chaque jour.
- ✅ Changer les mots de passe par défaut.
- ✅ Garder le PC serveur sur une IP fixe (en LAN).
- ✅ Noter l'emplacement des sauvegardes et les testez.

---

# PARTIE III — ANNEXES

## 15. Variables d'environnement

Ces fichiers sont **générés automatiquement** par le lanceur. Documentés
dans `offline-pack\config\` pour référence.

### Frontend (`frontend\.env.local`)

```env
NEXT_PUBLIC_OFFLINE_MODE=standalone   # standalone | server | client
NEXT_PUBLIC_API_URL=http://localhost:3005/api
NEXT_PUBLIC_BACKEND_PORT=3005
NEXT_PUBLIC_DB_TYPE=mysql             # toujours mysql en offline
NEXT_PUBLIC_TENANT=2025_bu01
PORT=3000
NODE_ENV=production
```

### Backend (`backend\.env`)

```env
PORT=3005
NODE_ENV=production
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=2025_bu01
MYSQL_USER=root
MYSQL_PASSWORD=
AUTH_MYSQL_DATABASE=stock_management_auth
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

> 🔴 En mode offline, **ne pas définir** les variables `SUPABASE_*` /
> `NEXT_PUBLIC_SUPABASE_*`, sinon l'app tente de contacter le cloud.

---

## 16. Dépannage rapide

| Problème | Solution rapide |
|----------|-----------------|
| Rien ne se passe au double-clic | Lancer depuis une console pour voir l'erreur : `cd C:\StockApp && start.bat` |
| « MariaDB n'a pas démarré » | Port 3306 pris ? `netstat -ano \| findstr :3306` |
| « Le backend n'a pas démarré » | MySQL a-t-il démarré avant ? Voir les logs `logs\stockapp.log` |
| Navigateur « page inaccessible » | Vérifier `curl http://localhost:3000` sur le serveur |
| Clients LAN injoignables | Pare-feu ? IP serveur correcte ? `ping <IP>` depuis le client |
| Identifiants refusés | Réinjecter `seed-admin.sql` via `mysql.exe` |
| Mot de passe oublié | Voir `GUIDE_DEPANNAGE_OFFLINE.md` §8 (reset SQL) |
| Port déjà utilisé | `netstat -ano \| findstr :3000` puis tuer le PID |

> 📖 **Dépannage détaillé** : `docs/GUIDE_DEPANNAGE_OFFLINE.md` (14 sections par symptôme).

---

## 17. Récapitulatif

| Action | Comment |
|--------|---------|
| **Construire le pack** | `offline-pack\scripts\build-pack.ps1` |
| **Générer l'installeur** | `iscc offline-pack\installer\stockapp.iss` |
| **Démarrer** | Double-clic sur **StockApp** (ou `start.bat`) |
| **Arrêter** | **Ctrl + C** dans la fenêtre noire |
| **URL d'accès** | Standalone/serveur : `http://localhost:3000` — Client : `http://<IP-serveur>:3000` |
| **Identifiants par défaut** | `admin` / `admin123` (**à changer**) |
| **Sauvegarder** | `scripts\backup.ps1` (manuel ou planifié) |
| **Logs** | `C:\StockApp\logs\stockapp.log` |
| **Aide / dépannage** | `docs/GUIDE_DEPANNAGE_OFFLINE.md` |
| **Architecture** | `docs/ARCHITECTURE.md` |
| **Présentation métier** | `docs/PRESENTATION_ACTIONNAIRES.md` |

---

## 📚 Documentation associée

| Document | Public | Contenu |
|----------|--------|---------|
| **PRESENTATION_ACTIONNAIRES.md** | Direction / actionnaires | Vue métier, valeur, bénéfices |
| **GUIDE_UTILISATION_OFFLINE.md** | Utilisateur final | Usage quotidien détaillé |
| **GUIDE_INSTALLATION_OFFLINE.md** | Admin / dev | Installation & build approfondis |
| **GUIDE_DEPANNAGE_OFFLINE.md** | Tous | FAQ et résolution de problèmes |
| **ARCHITECTURE.md** | Dev | Architecture technique détaillée |
