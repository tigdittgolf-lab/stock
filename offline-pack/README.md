# 📦 Offline Pack — Mode hors-ligne pour StockApp

Ce dossier contient tout le nécessaire pour faire fonctionner l'application
**100 % en local, sans aucune connexion Internet**.

## 🎯 Objectif

Permettre à un client d'utiliser l'application :

- ✅ **Standalone** : un seul PC (tout en `localhost`)
- ✅ **Réseau LAN** : un PC « serveur » + plusieurs PC « clients » sur le
  même réseau local

Les deux modes utilisent **exactement le même code** — seule la
configuration change. Le mode offline est **opt-in** : si la variable
`NEXT_PUBLIC_OFFLINE_MODE` n'est pas définie, l'application reste en mode
cloud (Supabase) — aucune régression.

---

## 📚 Documentation

| Document | Public | Contenu |
|----------|--------|---------|
| 📊 **[`docs/PRESENTATION_ACTIONNAIRES.md`](docs/PRESENTATION_ACTIONNAIRES.md)** | Direction / actionnaires | Vue métier, valeur, bénéfices, architecture |
| 📘 **[`docs/GUIDE_INSTALLATION_ET_UTILISATION.md`](docs/GUIDE_INSTALLATION_ET_UTILISATION.md)** | Admin **et** utilisateur | Document unifié : installation + usage quotidien |
| 📖 **[`docs/GUIDE_UTILISATION_OFFLINE.md`](docs/GUIDE_UTILISATION_OFFLINE.md)** | Utilisateur final | Lancer, se connecter, mode réseau, sauvegardes |
| 🛠️ **[`docs/GUIDE_INSTALLATION_OFFLINE.md`](docs/GUIDE_INSTALLATION_OFFLINE.md)** | Admin / dev | Préparer binaires, construire le pack, livrer, mettre à jour |
| 🚑 **[`docs/GUIDE_DEPANNAGE_OFFLINE.md`](docs/GUIDE_DEPANNAGE_OFFLINE.md)** | Tous | FAQ, erreurs courantes, restauration, remise à zéro |
| 🏗️ **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** | Dev | Schémas, flux de données, décisions techniques |

### 📄 Versions PDF (prêtes à imprimer / diffuser)

Les documents ci-dessus existent aussi en **PDF A4 multi-pages**, dans
[`docs/pdf/`](docs/pdf/). Ils reprennent une charte graphique unique
(bleu nuit / vert émeraude / or) et sont régénérables à volonté :

| PDF | Source HTML |
|-----|-------------|
| `PRESENTATION_ACTIONNAIRES.pdf` | `presentation-stockapp.html` |
| `GUIDE_INSTALLATION_ET_UTILISATION.pdf` | `guide-installation-utilisation.html` |
| `GUIDE_DEPANNAGE_OFFLINE.pdf` | `guide-depannage.html` |

```cmd
REM Pré-requis : Playwright installé globalement (npm i -g playwright)
cd offline-pack\docs\pdf

REM Régénérer un seul PDF
render-pdf.cmd guide-depannage.html GUIDE_DEPANNAGE_OFFLINE.pdf

REM Ou régénérer les 3 PDFs d'un coup (+ vérification anti-débordement A4)
render-pdf.cmd --all
```

> Le wrapper `render-pdf.cmd` fixe automatiquement `NODE_PATH` vers le
> `node_modules` global pour que Node résolve Playwright — vous n'avez
> rien à configurer.

> **Vous ne savez pas par où commencer ?**
> - Vous **présentez** la plateforme → `PRESENTATION_ACTIONNAIRES.md`
> - Vous voulez **un seul guide complet** → `GUIDE_INSTALLATION_ET_UTILISATION.md`
> - Vous êtes **utilisateur** → `GUIDE_UTILISATION_OFFLINE.md`
> - Vous **installez/déployez** → `GUIDE_INSTALLATION_OFFLINE.md`
> - **Ça bloque** → `GUIDE_DEPANNAGE_OFFLINE.md`

---

## 📁 Structure

```
offline-pack/
├── README.md                          ← Ce fichier (index de la doc)
├── docs/
│   ├── GUIDE_UTILISATION_OFFLINE.md   ← Guide utilisateur final
│   ├── GUIDE_INSTALLATION_OFFLINE.md  ← Guide admin / développeur
│   ├── GUIDE_DEPANNAGE_OFFLINE.md     ← FAQ & résolution de problèmes
│   └── ARCHITECTURE.md                ← Architecture technique
├── config/
│   ├── frontend.offline.env.example   ← Modèle .env frontend offline
│   └── backend.offline.env.example    ← Modèle .env backend offline
├── database/
│   ├── schema-mysql.sql               ← Schéma MySQL complet (17 tables + auth)
│   └── seed-admin.sql                 ← Utilisateur admin par défaut (admin / admin123)
├── scripts/
│   ├── StockApp-Launcher.ps1          ← Lanceur principal (orchestre tout)
│   ├── start.bat                      ← Point d'entrée double-clic (appelle PowerShell)
│   ├── setup-config.ps1               ← Assistant de configuration (standalone/serveur/client)
│   ├── install-firewall-rules.ps1     ← Ouvre les ports pare-feu Windows (mode serveur)
│   ├── wait-for-port.ps1              ← Attend qu'un port soit disponible
│   ├── backup.ps1                     ← Sauvegarde MySQL horodatée + purge
│   └── build-pack.ps1                 ← Build l'installeur final (frontend + backend + MySQL)
├── installer/
│   └── stockapp.iss                   ← Script Inno Setup pour produire l'installeur .exe
└── bin/                               ← (non versionné) binaires portables
    ├── mariadb/                       ← MariaDB portable (.zip décompressé)
    ├── node/                          ← Node.js portable (.zip)
    └── bun/                           ← Bun (optionnel, plus rapide)
```

---

## 🚀 Démarrage rapide

### Côté développeur (construire le pack)

```powershell
# 1. Préparer les binaires (une seule fois) — voir GUIDE_INSTALLATION_OFFLINE.md §3
#    offline-pack\bin\mariadb\, offline-pack\bin\node\

# 2. Construire le pack complet (compile backend + build frontend)
cd C:\netbean\St_Article_1\offline-pack\scripts
.\build-pack.ps1

# 3. Produire l'installeur .exe avec Inno Setup
#    (nécessite Inno Setup 6 installé : https://jrsoftware.org/isdl.php)
iscc ..\installer\stockapp.iss
```

### Côté client final (utiliser l'application)

1. Installer **StockApp** (via `StockApp-Setup-x.y.z.exe`) ou dézipper le
   dossier livré dans `C:\StockApp`.
2. Double-cliquer sur **StockApp** (ou `start.bat`).
3. Au premier lancement, l'assistant demande le mode d'utilisation :
   - **[1] Standalone** → tout démarre sur ce PC.
   - **[2] Serveur LAN** → MySQL + backend démarrent, prêts à servir les autres PC.
   - **[3] Client LAN** → on saisit l'IP du serveur, seul le navigateur s'ouvre.
4. Le navigateur s'ouvre sur `http://localhost:3000` (ou l'IP du serveur).
5. Se connecter avec **admin / admin123** (**à changer immédiatement**).

➡️ **Détails complets** : `docs/GUIDE_UTILISATION_OFFLINE.md`

---

## ⚙️ Modes de configuration

| Mode | MySQL local | Backend local | Frontend local | URL d'accès |
|------|:-----------:|:-------------:|:--------------:|-------------|
| **Standalone** | ✅ | ✅ | ✅ | `http://localhost:3000` |
| **Serveur LAN** | ✅ | ✅ | ✅ | `http://<IP-serveur>:3000` |
| **Client LAN** | ❌ | ❌ | navigateur seul | `http://<IP-serveur>:3000` |

Ports utilisés : **3000** (frontend), **3005** (backend), **3306** (MySQL).
En mode LAN, seuls les ports **3000** (et éventuellement 3005) sont à
ouvrir sur le pare-feu du PC serveur.

---

## 🔐 Sécurité du réseau LAN

- Les ports **3000** et **3005** sont ouverts automatiquement sur le PC
  serveur via `install-firewall-rules.ps1` (profils **Privé** et
  **Domaine** uniquement, jamais Public).
- Il est recommandé de **fixer l'adresse IP** du PC serveur (réservation
  DHCP ou IP statique) pour qu'elle ne change pas au redémarrage.
- Le trafic reste **strictement local** (LAN) — aucune donnée ne sort
  sur Internet.

---

## 💾 Sauvegardes

```powershell
# Sauvegarde manuelle
.\scripts\backup.ps1 -AppRoot C:\StockApp -OutputDir D:\Sauvegardes

# Sauvegarde planifiée (tous les jours à 22h00)
schtasks /Create /TN "StockApp Backup" `
  /TR "powershell.exe -File C:\StockApp\scripts\backup.ps1 -AppRoot C:\StockApp" `
  /SC DAILY /ST 22:00 /RL HIGHEST
```

Le dump contient les bases `<tenant>` + `stock_management_auth`
(routines, triggers). Les sauvegardes de plus de 30 jours sont purgées
automatiquement (paramètre `-KeepDays`).

➡️ **Restauration** : `docs/GUIDE_DEPANNAGE_OFFLINE.md` §11

---

## 📋 Pré-requis

### Côté client final

**Aucun.** L'installeur embarque tout :
- MariaDB / MySQL portable (pas d'installation admin séparée)
- Le runtime Node.js et Bun (ou compilés dans les binaires)
- Le frontend Next.js pré-buildé
- Le backend Hono pré-compilé

### Côté machine de build (une fois, pour construire le pack)

Voir `docs/GUIDE_INSTALLATION_OFFLINE.md` §2 :
- Node.js 20+ et npm
- Bun (recommandé)
- Inno Setup 6 (pour l'installeur `.exe`)
- Git

---

## 📖 Documentation complémentaire

- **`docs/ARCHITECTURE.md`** — schémas, flux de données, décisions techniques
  (pourquoi MySQL, comment le mode offline est détecté côté frontend, etc.)
- **`docs/GUIDE_INSTALLATION_OFFLINE.md`** — build, test, livraison, mises à jour
- **`docs/GUIDE_UTILISATION_OFFLINE.md`** — usage quotidien pour l'utilisateur final
- **`docs/GUIDE_DEPANNAGE_OFFLINE.md`** — résolution des problèmes courants
