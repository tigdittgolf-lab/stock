# 📖 Guide d'utilisation — StockApp en mode hors-ligne

> Ce guide s'adresse à **l'utilisateur final**. Il explique comment lancer et
> utiliser l'application **sans aucune connexion Internet**.

---

## 1. C'est quoi le « mode offline » ?

StockApp peut fonctionner de deux façons :

| Mode | Description | Internet requis ? |
|------|-------------|:-----------------:|
| ☁️ **Cloud** | Les données sont stockées sur un serveur distant (Supabase). | ✅ Oui |
| 📦 **Offline** | Les données sont stockées **entièrement sur vos ordinateurs**. | ❌ Non |

En mode offline, **rien ne sort de votre réseau**. Tout reste sur vos PC.

Il existe **3 façons** d'utiliser le mode offline, selon votre matériel :

```
┌─────────────────────────────────────────────────────────────┐
│  MODE 1 — STANDALONE (1 seul PC)                            │
│  Tout est sur le même ordinateur : base de données,         │
│  calculs, et navigateur. Convient à un petit commerce.      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MODE 2 — SERVEUR LAN (1 PC serveur + plusieurs clients)    │
│  Un PC « serveur » centralise les données. Les autres PC    │
│  du réseau (les « clients ») s'y connectent pour travailler.│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MODE 3 — CLIENT LAN (un PC qui se connecte au serveur)     │
│  Ce PC n'a besoin que d'un navigateur. Il se connecte au    │
│  PC serveur du réseau.                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Premier lancement

### 2.1. Démarrer l'application

1. Localisez l'icône **StockApp** sur le bureau, ou le fichier
   **`start.bat`** dans le dossier d'installation (`C:\StockApp` par défaut).
2. **Double-cliquez** dessus.
3. Une fenêtre noire (console) s'ouvre : **ne la fermez pas**, c'est normal.

> 💡 Au tout premier lancement, une **fenêtre d'assistant** vous demandera
> de choisir votre mode d'utilisation (voir §2.2).

### 2.2. Choisir le mode d'utilisation

L'assistant affiche :

```
Comment allez-vous utiliser l'application ?
  [1] Ce PC uniquement (mode standalone)
  [2] Ce PC SERT de serveur pour le réseau (LAN)
  [3] Ce PC est un CLIENT (se connecter à un serveur existant)

Votre choix (1/2/3) [défaut: 1]
```

- **Tapez 1** si vous avez **un seul PC** → mode standalone.
- **Tapez 2** si **ce PC** va servir de serveur pour d'autres postes → mode serveur.
- **Tapez 3** si **ce PC** doit se connecter à un serveur déjà en place → mode client.

### 2.3. En mode client : saisir l'IP du serveur

Si vous avez choisi **3 (client)**, l'assistant demande :

```
Adresse IP du PC serveur (ex: 192.168.1.50)
```

Saisissez l'**adresse IP** du PC serveur (elle vous a été communiquée par
la personne qui a installé le serveur). Exemple : `192.168.1.50`.

> 📌 **Comment trouver l'IP du serveur ?**
> Sur le PC serveur, ouvrez une invite de commande et tapez `ipconfig`.
> Recherchez la ligne « **Adresse IPv4** » (ex: `192.168.1.50`).

### 2.4. Validation

L'assistant affiche un récapitulatif :

```
-----------------------------------------------------------
Configuration générée :
  Mode           : standalone
  MySQL host     : 127.0.0.1:3306
  Backend port   : 3005
  Frontend port  : 3000
  Type de base   : mysql
  Tenant         : 2025_bu01
-----------------------------------------------------------
Confirmer et enregistrer ? (O/n)
```

Tapez **O** (ou appuyez directement sur **Entrée**) pour valider.

---

## 3. Lancement normal (après configuration)

Une fois configuré, à chaque lancement :

1. Double-cliquez sur **StockApp** (ou `start.bat`).
2. La console affiche la séquence de démarrage :
   ```
   >>> Démarrage de la base de données (MariaDB)
       [OK] Base de données prête
   >>> Démarrage du backend (port 3005)
       [OK] Backend prêt
   >>> Démarrage du frontend (port 3000)
       [OK] Frontend prêt
   ```
3. Le **navigateur s'ouvre tout seul** sur la bonne adresse.
4. Vous pouvez commencer à travailler.

### ⚠️ Important : ne pas fermer la fenêtre noire

La fenêtre de console (noire) **doit rester ouverte** pendant toute la durée
d'utilisation. Si vous la fermez :
- En **standalone/serveur** : l'application s'arrête pour **tout le monde**.
- En **client** : seule votre affichage se ferme (les autres continuent).

### 🛑 Arrêter proprement

Pour fermer l'application :
- Allez dans la fenêtre noire et appuyez sur **Ctrl + C**.
- Répondez **O** si Windows demande « Terminer le traitement par lots ? ».

> Ne fermez **jamais** la fenêtre avec le X rouge en cours de travail :
> cela peut laisser la base de données dans un état instable. Utilisez
> toujours **Ctrl + C**.

---

## 4. Se connecter

Au premier accès, utilisez les **identifiants par défaut** :

```
Utilisateur : admin
Mot de passe : admin123
```

### 🔐 Changer le mot de passe (OBLIGATOIRE)

Dès votre première connexion :

1. Allez dans **Paramètres → Utilisateurs** (ou **Mon profil**).
2. Modifiez le mot de passe du compte `admin`.
3. **Notez-le en lieu sûr** — il n'y a pas de récupération automatique
   en mode offline (pas d'e-mail ni d'Internet).

---

## 5. Mode réseau (plusieurs PC)

### 5.1. Préparer le PC serveur

1. Sur le PC serveur : installez StockApp et choisissez le mode **[2] Serveur**.
2. Notez l'**IP LAN** affichée par l'assistant (ex: `192.168.1.50`).
3. Transmettez cette IP aux utilisateurs des PC clients.

### 5.2. Configurer un PC client

Sur chaque PC client :

1. Installez StockApp (ou copiez le dossier).
2. Au premier lancement, choisissez le mode **[3] Client**.
3. Saisissez l'IP du serveur (ex: `192.168.1.50`).
4. Le navigateur s'ouvre sur `http://192.168.1.50:3000`.

### 5.3. Règles à respecter en réseau

| Règle | Pourquoi |
|-------|----------|
| 🔌 **Le PC serveur doit rester allumé** | Les clients ne peuvent plus travailler s'il est éteint. |
| 🌐 **Tous les PC sur le même réseau local** | Le LAN (Wi-Fi ou câble) doit être partagé. |
| 🔒 **Fixer l'IP du serveur** | Si l'IP change, tous les clients perdent la connexion. Demandez à votre administrateur réseau une **réservation DHCP** ou une **IP fixe**. |
| 💾 **Sauvegarder régulièrement** | Voir §6. |

---

## 6. Sauvegardes

Vos données sont précieuses. En mode offline, **personne d'autre que vous**
ne les protège.

### 6.1. Sauvegarde manuelle

Sur le PC serveur (ou en standalone), ouvrez une console en tant
qu'administrateur et lancez :

```powershell
powershell.exe -File "C:\StockApp\scripts\backup.ps1" -OutputDir "D:\Mes Sauvegardes"
```

Un fichier horodaté est créé, par exemple :
`stockapp_2025_bu01_2026-06-18_2200.sql`.

### 6.2. Sauvegarde automatique (recommandé)

Programmez une sauvegarde quotidienne à 22h00 via le **Planificateur de
tâches Windows** :

```powershell
schtasks /Create /TN "StockApp Backup" `
  /TR "powershell.exe -File C:\StockApp\scripts\backup.ps1 -AppRoot C:\StockApp" `
  /SC DAILY /ST 22:00 /RL HIGHEST
```

Les sauvegardes de plus de **30 jours** sont supprimées automatiquement
(paramètre `-KeepDays` de `backup.ps1`).

### 6.3. Bonnes pratiques

- ✅ **Copiez les sauvegardes sur un disque externe** ou une clé USB
  régulièrement (au moins une fois par semaine).
- ✅ **Testez la restauration** de temps en temps (voir le guide d'installation).
- ✅ Avant toute **mise à jour** ou modification importante, faites une
  sauvegarde manuelle.

---

## 7. Que faire en cas de problème ?

Consultez le **`GUIDE_DEPANNAGE_OFFLINE.md`** pour :

- L'application ne démarre pas
- Le navigateur affiche « Page inaccessible »
- Les PC clients ne se connectent pas au serveur
- Mot de passe admin oublié
- Restauration d'une sauvegarde

---

## 8. Récapitulatif rapide

| Action | Comment |
|--------|---------|
| Démarrer | Double-clic sur **StockApp** (ou `start.bat`) |
| Arrêter | **Ctrl + C** dans la fenêtre noire |
| URL d'accès | Standalone/serveur : `http://localhost:3000` — Client : `http://<IP-serveur>:3000` |
| Identifiants par défaut | `admin` / `admin123` (**à changer**) |
| Sauvegarder | `scripts\backup.ps1` (manuel ou planifié) |
| Aide / dépannage | `GUIDE_DEPANNAGE_OFFLINE.md` |
| Documentation technique | `ARCHITECTURE.md` et `GUIDE_INSTALLATION_OFFLINE.md` |
