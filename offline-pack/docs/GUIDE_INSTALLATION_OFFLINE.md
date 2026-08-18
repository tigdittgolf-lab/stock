# 🛠️ Guide d'installation — StockApp en mode hors-ligne

> Ce guide s'adresse à **l'administrateur / développeur**. Il décrit comment
> assembler le pack offline depuis les sources, le tester, le livrer et le
> déployer chez le client final. L'application résultante fonctionne **100 %
> sans Internet**.

Pour le guide destiné à l'utilisateur final, voir
[`GUIDE_UTILISATION_OFFLINE.md`](./GUIDE_UTILISATION_OFFLINE.md).
Pour l'architecture technique, voir [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 1. Vue d'ensemble

### 1.1. Objectif

Embarquer dans **un seul dossier (ou un seul `.exe`)** tout ce qui est
nécessaire pour faire tourner StockApp sans Internet :

| Brique | Rôle | Outil |
|--------|------|-------|
| Base de données | Stocker articles, clients, BL, factures… | **MariaDB portable** |
| Backend | API métier (logique, calculs) | **Hono (Node/Bun)** |
| Frontend | Interface web | **Next.js** (build de production) |
| Lanceur | Orchestre tout au démarrage | **PowerShell** |

### 1.2. Trois modes d'exécution

| Mode | MySQL local | Backend local | Frontend local | URL d'accès |
|------|:-----------:|:-------------:|:--------------:|-------------|
| **Standalone** | ✅ | ✅ | ✅ | `http://localhost:3000` |
| **Serveur LAN** | ✅ | ✅ | ✅ | `http://<IP-serveur>:3000` |
| **Client LAN** | ❌ | ❌ | navigateur seul | `http://<IP-serveur>:3000` |

Le mode est choisi au **premier lancement** par l'utilisateur
(`setup-config.ps1`) et stocké dans `config.env`. Le **même build** sert les
trois modes — seule la configuration change.

---

## 2. Pré-requis machine de build

La machine qui **construit** le pack a besoin d'Internet (une fois) pour
récupérer les dépendances. Ensuite, **le pack livré au client n'a plus
besoin de rien**.

- **Node.js 20+** et **npm** : https://nodejs.org/
- **Bun** (recommandé pour le backend) : https://bun.sh/
- **Git** (pour cloner le dépôt)
- **Inno Setup 6** (uniquement pour produire le `.exe` d'installation) :
  https://jrsoftware.org/isdl.php
- **PowerShell 5.1+** (fourni avec Windows 10/11)

> ⚠️ La machine cliente n'a **aucun** de ces pré-requis : tout est embarqué.

---

## 3. Préparer les binaires tiers

Le dossier `offline-pack/bin/` doit contenir les exécutables portables.
Ces binaires ne sont **pas dans le dépôt** (trop volumineux) ; il faut les
télécharger une fois, puis ils sont réutilisés à chaque build.

### 3.1. MariaDB portable

1. Téléchargez le **ZIP Windows (x64)** depuis
   https://mariadb.org/download/?tab=mariadb
2. Décompressez-le dans :
   ```
   offline-pack\bin\mariadb\bin\mysqld.exe   ← doit exister ici
   offline-pack\bin\mariadb\bin\mysql.exe
   offline-pack\bin\mariadb\bin\mysqldump.exe
   ```

> Vérification : le script `build-pack.ps1` teste la présence de
> `bin\mariadb\bin\mysqld.exe`.

### 3.2. Node.js portable

1. Téléchargez **Windows Binary (.zip)** 64-bit sur
   https://nodejs.org/en/download/
2. Décompressez-le dans :
   ```
   offline-pack\bin\node\node.exe   ← doit exister ici
   offline-pack\bin\node\npm.cmd
   offline-pack\bin\node\node_modules\npm\...
   ```

### 3.3. Bun (optionnel, plus rapide)

Téléchargez `bun.exe` (Windows-x64) depuis https://github.com/oven-sh/bun/releases
et placez-le dans :
```
offline-pack\bin\bun\bun.exe
```

Si Bun est absent, le lanceur bascule automatiquement sur Node.

### 3.4. Icône de l'application (optionnel)

Placez une icône à `offline-pack\bin\app.ico` : elle sera utilisée pour les
raccourcis bureau et menu Démarrer.

---

## 4. Construire le pack

Depuis une console PowerShell :

```powershell
cd C:\netbean\St_Article_1\offline-pack\scripts
.\build-pack.ps1
```

Paramètres utiles :

| Paramètre | Effet |
|-----------|-------|
| `-RepoRoot C:\netbean\St_Article_1` | Dossier source (défaut : ce chemin) |
| `-OutDir C:\StockApp` | Dossier de sortie (défaut) |
| `-SkipFrontendBuild` | Ne rebuilde pas le frontend Next.js (si déjà fait) |
| `-SkipBackendInstall` | Ne réinstalle pas les dépendances backend |

### Que fait `build-pack.ps1` ?

1. Crée la structure `bin/`, `data/`, `logs/`, `database/`, `scripts/`.
2. Copie le **backend** (hors `node_modules`), installe ses dépendances
   (Bun si dispo, sinon npm).
3. Copie le **frontend**, lance `npm install` puis `npm run build`.
4. Copie le **schéma SQL** (`schema-mysql.sql` + `seed-admin.sql`).
5. Copie les **scripts** de lancement (`StockApp-Launcher.ps1`, `setup-config.ps1`,
   `wait-for-port.ps1`, `install-firewall-rules.ps1`, `start.bat`).
6. Copie **MariaDB portable** et **Node portable** depuis `offline-pack\bin\`.
7. Génère un `.gitignore` (exclut `data/`, `logs/`, `config.env`, `.env*`).

### Vérifier que le pack est complet

```powershell
# Doivent exister :
Test-Path C:\StockApp\bin\mariadb\bin\mysqld.exe     # True
Test-Path C:\StockApp\bin\node\node.exe              # True
Test-Path C:\StockApp\frontend\.next                 # True (build)
Test-Path C:\StockApp\database\schema-mysql.sql      # True
Test-Path C:\StockApp\start.bat                      # True
```

Si un binaire manque, `build-pack.ps1` affiche un avertissement à la fin.

---

## 5. Tester le pack (avant livraison)

Sur **la même machine de build**, testez le démarrage :

```powershell
cd C:\StockApp
.\start.bat
```

1. Choisissez le mode **standalone** dans l'assistant.
2. Vérifiez que les 3 services démarrent (MariaDB, backend, frontend).
3. Le navigateur doit s'ouvrir sur `http://localhost:3000`.
4. Connectez-vous avec `admin` / `admin123`.
5. **Ctrl+C** dans la console pour arrêter proprement.

> ⚠️ **Nettoyez les données de test avant livraison.** Supprimez
> `C:\StockApp\data\mysql\` et `C:\StockApp\data\.schema-initialized` pour
> que le client démarre avec une base vierge.

---

## 6. Produire l'installeur `.exe`

### 6.1. Avec Inno Setup

```powershell
cd C:\netbean\St_Article_1\offline-pack\installer
iscc stockapp.iss
```

Le fichier `StockApp-Setup-1.0.0.exe` est généré dans
`offline-pack\installer\output\`.

### 6.2. Ce que fait l'installeur

- Copie tout `C:\StockApp` dans `C:\Program Files\StockApp`.
- Crée un raccourci **menu Démarrer** + (option) **bureau**.
- Exclut `logs\`, `data\mysql\`, `config.env` (le client repart à zéro).
- À la désinstallation, supprime `logs\` et `data\` (le client est prévenu).
- Lance l'application à la fin de l'installation.

### 6.3. Livraison alternative (sans installeur)

Vous pouvez aussi **zipper** le dossier `C:\StockApp` et le remettre au
client. Le client le décompresse et double-clique sur `start.bat`. Aucune
installation administrative n'est requise (sauf en mode serveur, pour le
pare-feu — voir §8).

---

## 7. Ports réseau utilisés

| Port | Service | À ouvrir sur le pare-feu ? |
|:----:|---------|:--------------------------:|
| **3000** | Frontend Next.js | ✅ en mode serveur (accès LAN) |
| **3005** | Backend Hono | ❌ non (le frontend local proxifie) |
| **3306** | MySQL/MariaDB | ❌ déconseillé (sauf cas avancé) |

En mode serveur, le frontend et le backend tournent **sur le même PC** ; le
frontend Next.js proxifie les appels `/api/*` vers le backend. Les PC
clients n'ont donc besoin **que du port 3000**.

---

## 8. Configuration du pare-feu (mode serveur uniquement)

Sur le **PC serveur**, ouvrez une console **en tant qu'administrateur** :

```powershell
cd C:\StockApp\scripts
.\install-firewall-rules.ps1
```

- Crée les règles entrantes `StockApp-Frontend` (3000) et `StockApp-Backend` (3005).
- Uniquement sur les profils **Privé** et **Domaine** (jamais Public).
- Pour ouvrir aussi MySQL (non recommandé) : `-IncludeMysql`.

> Si l'assistant `setup-config.ps1` a été exécuté en mode serveur, il
> rappelle de lancer ce script à la fin.

---

## 9. Variables d'environnement

Ces fichiers sont **générés automatiquement** par `StockApp-Launcher.ps1`
à partir de `config.env`. Vous n'avez normalement pas à les écrire à la
main, mais ils sont documentés dans `offline-pack\config\` pour référence.

### 9.1. Frontend (`frontend\.env.local`)

```env
NEXT_PUBLIC_OFFLINE_MODE=standalone   # standalone | server | client
NEXT_PUBLIC_API_URL=http://localhost:3005/api
NEXT_PUBLIC_BACKEND_PORT=3005
NEXT_PUBLIC_DB_TYPE=mysql             # toujours mysql en offline
NEXT_PUBLIC_TENANT=2025_bu01
PORT=3000
NODE_ENV=production
```

> 🔴 **NE PAS définir** `NEXT_PUBLIC_SUPABASE_URL` ni
> `NEXT_PUBLIC_SUPABASE_ANON_KEY` en mode offline, sinon l'app tente de
> contacter le cloud.

### 9.2. Backend (`backend\.env`)

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

> 🔴 **NE PAS définir** `SUPABASE_URL` ni `SUPABASE_SERVICE_ROLE_KEY`.

### 9.3. Comment le mode est détecté par le code

- `frontend\lib\offline-mode.ts` → `getOfflineMode()`, `isOffline()`,
  `getBackendBaseUrl()`, `getTenant()`, `getDatabaseType()`.
- `frontend\lib\backend-url.ts` → `getBackendUrl()` (routes API Next.js).
- `frontend\lib\api.ts` → `apiRequest()` injecte les en-têtes
  `X-Tenant` + `X-Database-Type: mysql` quand `isOffline()` est vrai.
- **Rétro-compatibilité** : si `NEXT_PUBLIC_OFFLINE_MODE` est absent, tout
  se comporte comme avant (mode cloud Supabase). Aucune régression.

---

## 10. Base de données

### 10.1. Schéma

`offline-pack\database\schema-mysql.sql` crée **deux bases** :

- `2025_bu01` (tenant métier) — 17 tables : `activite`, `famille_art`,
  `fournisseur`, `article`, `client`, `fact`, `detail_fact`, `bl`,
  `detail_bl`, `fprof`, `detail_fprof`, `fachat`, `fachat_detail`,
  `user_info`, `stock_table_parameter`, `payments`, `avoirs`.
- `stock_management_auth` — table `users` (SHA-256).

Le lanceur initialise le datadir (`--initialize-insecure`) au premier
démarrage, puis exécute le schéma + le seed **une seule fois** (marqueur
`data\.schema-initialized`).

### 10.2. Compte admin par défaut

`seed-admin.sql` crée `admin` / `admin123` (SHA-256) dans les deux bases.
L'utilisateur doit le changer dès la première connexion.

### 10.3. Modifier le tenant

Si vous livrez un client qui n'utilise pas `2025_bu01` :

1. Éditez `config.env` → `TENANT=...` (ou relancez `setup-config.ps1`).
2. Le schéma crée la base portant ce nom au prochain démarrage vierge.
3. Pensez à adapter le nom dans `schema-mysql.sql` si vous voulez pré-charger
   des données.

---

## 11. Sauvegardes et restauration

### 11.1. Sauvegarde

```powershell
# Manuelle
.\scripts\backup.ps1 -AppRoot C:\StockApp -OutputDir D:\Sauvegardes

# Planifiée (quotidienne, 22h00)
schtasks /Create /TN "StockApp Backup" `
  /TR "powershell.exe -File C:\StockApp\scripts\backup.ps1 -AppRoot C:\StockApp" `
  /SC DAILY /ST 22:00 /RL HIGHEST
```

Le dump contient les bases `<tenant>` + `stock_management_auth`
(routines, triggers, `--single-transaction`). Les dumps > 30 jours sont
purgés (`-KeepDays`).

### 11.2. Restauration

1. **Arrêtez** l'application (Ctrl+C dans la console).
2. Vérifiez que MariaDB est arrêté (sinon relancez `start.bat` puis
   Ctrl+C ne suffit pas toujours — tuez `mysqld.exe` via le gestionnaire
   des tâches si besoin).
3. Relancez `start.bat` **une fois** pour démarrer MariaDB seul, puis
   Ctrl+C pour arrêter le backend/frontend tout en laissant MySQL.
   *(Plus simple : voir `GUIDE_DEPANNAGE_OFFLINE.md` — procédure de
   restauration pas-à-pas.)*
4. Chargez le dump :

   ```powershell
   & "C:\StockApp\bin\mariadb\bin\mysql.exe" `
       -h 127.0.0.1 -P 3306 -u root `
       -e "source D:\Sauvegardes\stockapp_2025_bu01_2026-06-18_2200.sql"
   ```

5. Relancez normalement avec `start.bat`.

---

## 12. Mises à jour

Pour livrer une nouvelle version :

1. Sur la machine de build : `git pull`, puis relancez `build-pack.ps1`
   (et `iscc stockapp.iss` si vous redistribuez un `.exe`).
2. **Sauvegardez** la base du client avant toute manipulation.
3. Remplacez les dossiers `frontend\`, `backend\`, `scripts\`,
   `database\` chez le client (**sans toucher** à `data\`, `logs\`,
   `config.env`).
4. Si le schéma a évolué, préparez un script de migration SQL à appliquer
   avec `mysql.exe` (comme la restauration ci-dessus).

> 🔒 Les dossiers `data\`, `logs\` et `config.env` contiennent les
> **données du client**. Ne les écrasez jamais lors d'une mise à jour.

---

## 13. Checklist de livraison

- [ ] `bin\mariadb\bin\mysqld.exe` présent
- [ ] `bin\node\node.exe` présent
- [ ] `frontend\.next` présent (build de production)
- [ ] `backend\node_modules` présent
- [ ] `database\schema-mysql.sql` + `seed-admin.sql` présents
- [ ] `start.bat` + `scripts\` présents
- [ ] `data\` et `config.env` **absents** (vierge pour le client)
- [ ] Test de démarrage en standalone réussi sur la machine de build
- [ ] `.exe` Inno Setup généré (si livraison par installeur)
- [ ] Document de remise au client : URL d'accès, identifiants par défaut,
      instructions de sauvegarde

---

## 14. Annexes

- **Architecture détaillée** : [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Guide utilisateur final** : [`GUIDE_UTILISATION_OFFLINE.md`](./GUIDE_UTILISATION_OFFLINE.md)
- **Dépannage** : [`GUIDE_DEPANNAGE_OFFLINE.md`](./GUIDE_DEPANNAGE_OFFLINE.md)
- **Fichiers de config d'exemple** : `offline-pack\config\*.env.example`
