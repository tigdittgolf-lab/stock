# 🚑 Guide de dépannage — StockApp en mode hors-ligne

> Solutions aux problèmes les plus fréquents en mode offline.
> Avant tout dépannage, **consultez les journaux** :
> `C:\StockApp\logs\stockapp.log`.

---

## 📋 Sommaire des symptômes

| Symptôme | Section |
|----------|:-------:|
| Rien ne se passe au double-clic sur `start.bat` | [1](#1-rien-ne-se-passe-au-double-clic) |
| « MariaDB n'a pas démarré dans les temps » | [2](#2-mariadb-na-pas-démarré) |
| « Le backend n'a pas démarré » | [3](#3-le-backend-na-pas-démarré) |
| « Le frontend n'a pas démarré » | [4](#4-le-frontend-na-pas-démarré) |
| Navigateur : « Impossible de se connecter » / page blanche | [5](#5-le-navigateur-naffiche-rien) |
| Les PC clients ne se connectent pas au serveur | [6](#6-les-pc-clients-ne-joignent-pas-le-serveur) |
| Écran de connexion : identifiants refusés | [7](#7-identifiants-admin-refusés) |
| Mot de passe admin oublié | [8](#8-mot-de-passe-admin-oublié) |
| « Port déjà utilisé » (3000 / 3005 / 3306) | [9](#9-port-déjà-utilisé) |
| Données lentes / bloquées (base gelée) | [10](#10-application-qui-gèle-ou-lente) |
| Restaurer une sauvegarde | [11](#11-restaurer-une-sauvegarde) |
| L'IP du serveur a changé | [12](#12-lip-du-serveur-a-changé) |
| Réinitialiser entièrement (remise à zéro) | [13](#13-remise-à-zéro-complète) |

---

## 1. Rien ne se passe au double-clic

**Causes possibles :**

- La fenêtre s'ouvre puis se ferme instantanément (erreur).
- Windows bloque l'exécution des scripts (politique d'exécution).

**Solutions :**

1. **Lancez depuis une console** pour voir l'erreur :
   ```cmd
   cd C:\StockApp
   start.bat
   ```
2. Si le message parle de **stratégie d'exécution** :
   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\StockApp\scripts\StockApp-Launcher.ps1
   ```
   *(le `.bat` le fait déjà, mais cela permet d'isoler).*
3. **Clic droit → Propriétés** sur `start.bat` → décocher « Bloquer » si
   l'option apparaît (fichier venu d'un autre PC / téléchargé).

---

## 2. MariaDB n'a pas démarré

**Message typique :**
```
[X] MariaDB n'a pas démarré dans les temps. Voir logs\stockapp.log
```

**Causes & solutions :**

| Cause | Vérification | Solution |
|-------|--------------|----------|
| Port 3306 déjà pris | `netstat -ano \| findstr :3306` | [§9](#9-port-déjà-utilisé) |
| `mysqld.exe` absent | `Test-Path C:\StockApp\bin\mariadb\bin\mysqld.exe` | Re-construire le pack (`build-pack.ps1`) |
| Datadir corrompu | Le datadir existe mais MariaDB refuse de démarrer | [§13](#13-remise-à-zéro-complète) (sauvegarder d'abord !) |
| Antivirus bloque mysqld | Voir alertes de l'antivirus | Ajouter une exclusion pour `C:\StockApp\bin\mariadb\` |

**Inspecter le log MySQL :**

```powershell
Get-Content C:\StockApp\logs\stockapp.log -Tail 50
```

Les erreurs MariaDB ressemblent à :
- `Can't open datafile` → datadir cassé.
- `Port 3306 is already in use` → conflit avec un autre MySQL installé.

---

## 3. Le backend n'a pas démarré

**Message typique :**
```
[X] Le backend n'a pas démarré. Voir logs\stockapp.log
```

**Causes & solutions :**

1. **Backend n'arrive pas à joindre MySQL** → MySQL a échoué avant (voir [§2](#2-mariadb-na-pas-démarré)).
2. **Port 3005 déjà pris** → [§9](#9-port-déjà-utilisé).
3. **Dépendances backend manquantes** → `backend\node_modules` absent.
   Re-construire le pack, ou installer manuellement :
   ```powershell
   cd C:\StockApp\backend
   C:\StockApp\bin\node\npm.cmd install --production
   ```
4. **Erreur de syntaxe dans `backend\.env`** → supprimer le fichier, il sera
   régénéré au prochain lancement.
5. **Tester le backend à la main :**

   ```powershell
   cd C:\StockApp\backend
   C:\StockApp\bin\bun\bun.exe run index.ts
   ```
   ou
   ```powershell
   C:\StockApp\bin\node\node.exe index.ts
   ```

---

## 4. Le frontend n'a pas démarré

**Message typique :**
```
[X] Le frontend n'a pas démarré. Voir logs\stockapp.log
```

**Causes & solutions :**

1. **Port 3000 déjà pris** → [§9](#9-port-déjà-utilisé).
2. **Build manquant** → `frontend\.next` absent. Le pack n'est pas complet.
   Sur la machine de build :
   ```powershell
   cd C:\netbean\St_Article_1\frontend
   npm install
   npm run build
   ```
   puis recopier `.next` et `node_modules` vers le client.
3. **`node_modules` manquant** → re-copier depuis le pack.

---

## 5. Le navigateur n'affiche rien

**Symptômes :** « `ERR_CONNECTION_REFUSED` », « Page inaccessible », page
blanche après chargement.

**Diagnostic :**

```powershell
# Sur le PC serveur/standalone :
curl http://localhost:3000          # frontend ?
curl http://localhost:3005/api      # backend ?
```

| Résultat | Diagnostic | Action |
|----------|------------|--------|
| Frontend KO | Next.js pas démarré | [§4](#4-le-frontend-na-pas-démarré) |
| Frontend OK, Backend KO | Backend en panne | [§3](#3-le-backend-na-pas-démarré) |
| Les deux OK mais page blanche | Erreur JS côté navigateur | Ouvrir la **console du navigateur** (F12) |

**Page blanche après login :** vérifier dans la console du navigateur
(F12 → onglet Console) qu'il n'y a pas une erreur de type
`Supabase URL not defined`. Cela signifie que des variables cloud sont
encore présentes — voir [§14](#14-lapplication-tente-de-joindre-le-cloud).

---

## 6. Les PC clients ne joignent pas le serveur

**Sur un PC client**, le navigateur affiche
`ERR_CONNECTION_REFUSED` / `ERR_CONNECTION_TIMED_OUT` sur
`http://<IP-serveur>:3000`.

**Checklist à effectuer sur le PC serveur :**

1. **L'application tourne-t-elle sur le serveur ?**
   ```powershell
   # Sur le serveur :
   curl http://localhost:3000
   ```
2. **Le serveur écoute-t-il sur le réseau ?**
   ```powershell
   netstat -ano | findstr :3000
   ```
   Doit afficher `0.0.0.0:3000` (et non `127.0.0.1:3000`).
3. **Le pare-feu autorise-t-il ?**
   ```powershell
   # Sur le serveur, en admin :
   C:\StockApp\scripts\install-firewall-rules.ps1
   ```
4. **Les 2 PC sont-ils sur le même réseau ?**
   ```cmd
   ping <IP-serveur>
   ```
   Sur le PC client. Si le ping échoue → problème réseau (Wi-Fi différent,
   VLAN, VPN…).
5. **L'IP saisie côté client est-elle correcte ?**
   ```powershell
   Get-Content C:\StockApp\config.env
   ```
   Vérifier `SERVER_HOST`. Si l'IP du serveur a changé, voir [§12](#12-lip-du-serveur-a-changé).

---

## 7. Identifiants admin refusés

**Symptôme :** connexion à `admin` / `admin123` refusée dès l'installation.

**Vérifications :**

1. La base d'authentification a-t-elle été initialisée ?
   Regarder si `C:\StockApp\data\.schema-initialized` existe.
2. Ré-insérer le compte admin :

   ```powershell
   & "C:\StockApp\bin\mariadb\bin\mysql.exe" `
       -h 127.0.0.1 -P 3306 -u root `
       -e "source C:\StockApp\database\seed-admin.sql"
   ```

3. Si vous avez changé le mot de passe et oublié la valeur, voir [§8](#8-mot-de-passe-admin-oublié).

> ℹ️ Le hash est **SHA-256** du mot de passe. Pas de sel, pas de bcrypt
> (voir `seed-admin.sql` et `auth-mysql.ts` côté backend).

---

## 8. Mot de passe admin oublié

**Procédure de réinitialisation :**

1. **Arrêtez** l'application (Ctrl+C).
2. **Relancez** `start.bat` puis faites **Ctrl-C immédiatement** dès que
   « Base de données prête » apparaît, pour garder MariaDB en marche
   tout en arrêtant backend + frontend. *(Alternative : laisser tourner
   tout et exécuter la commande suivante — MySQL accepte plusieurs
   connexions.)*
3. **Réinjectez un mot de passe connu.** Par exemple pour remettre
   `admin123` :

   ```powershell
   & "C:\StockApp\bin\mariadb\bin\mysql.exe" `
       -h 127.0.0.1 -P 3306 -u root stock_management_auth `
       -e "UPDATE users SET password_hash='240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' WHERE username='admin';"

   & "C:\StockApp\bin\mariadb\bin\mysql.exe" `
       -h 127.0.0.1 -P 3306 -u root 2025_bu01 `
       -e "UPDATE user_info SET pass_word='240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' WHERE username='admin';"
   ```

   > Le hash ci-dessus = SHA-256 de `admin123`.

4. Connectez-vous avec `admin` / `admin123`, puis **changez-le** dans
   l'application.

> 🔐 **Pour générer un autre hash** (PowerShell) :
> ```powershell
> $pwd = Read-Host "Mot de passe"
> -join ([System.Security.Cryptography.SHA256]::Create().ComputeHash(
>     [Text.Encoding]::UTF8.GetBytes($pwd)).ForEach{ $_.ToString('x2') })
> ```

---

## 9. Port déjà utilisé

**Message typique :** `bind: Address already in use` ou un service qui
échoue à démarrer.

**Identifier le coupable :**

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :3005
netstat -ano | findstr :3306
```

La dernière colonne donne le **PID**. Pour voir le programme :

```powershell
Get-Process -Id <PID>
```

**Solutions :**

- **Une ancienne instance StockApp tourne encore** → tuez-la :
  ```powershell
  Get-Process mysqld,node,bun -ErrorAction SilentlyContinue | Stop-Process -Force
  ```
  *(avec discernement — ne tuez pas un MySQL servant un autre logiciel !)*
- **Un autre logiciel occupe le port** (ex : un MySQL déjà installé) :
  - Soit arrêter ce logiciel,
  - Soit **changer le port** dans `config.env` :
    ```
    MYSQL_PORT=3307
    BACKEND_PORT=3006
    FRONTEND_PORT=3001
    ```
    *(pensez à adapter le pare-feu en mode serveur)*

---

## 10. Application qui gèle ou lente

**Causes possibles :**

- **Datadir MySQL énorme** → sauvegarder, purger les vieilles sauvegardes
  SQL dans `backups\`.
- **Antivirus qui scanne à chaud** → ajouter une exclusion pour
  `C:\StockApp\data\` et `C:\StockApp\bin\`.
- **Disque presque plein** → vérifier l'espace disque.
- **Beaucoup de connexions concurrentes** (LAN) → le `my.ini` généré fixe
  `max_connections=100`. L'augmenter si nécessaire :
  ```powershell
  # Éditer C:\StockApp\data\my.ini (régénéré à chaque démarrage,
  # donc modifier plutôt le template dans StockApp-Launcher.ps1).
  ```

**Vérifier la charge MySQL :**

```powershell
& "C:\StockApp\bin\mariadb\bin\mysql.exe" -h 127.0.0.1 -P 3306 -u root `
    -e "SHOW PROCESSLIST; SHOW STATUS LIKE 'Threads_connected';"
```

---

## 11. Restaurer une sauvegarde

> ⚠️ **Effectuez d'abord une sauvegarde de l'état actuel** avant de
> restaurer, au cas où.

**Procédure :**

1. **Ctrl+C** dans la console StockApp (arrêt propre).
2. Démarrez **uniquement MariaDB** — le plus simple :

   ```powershell
   & "C:\StockApp\bin\mariadb\bin\mysqld.exe" `
       --defaults-file="C:\StockApp\data\my.ini" --console
   ```
   *(laissez cette fenêtre ouverte pendant la restauration)*

3. Dans **une autre console**, chargez le dump :

   ```powershell
   & "C:\StockApp\bin\mariadb\bin\mysql.exe" `
       -h 127.0.0.1 -P 3306 -u root `
       < "D:\Sauvegardes\stockapp_2025_bu01_2026-06-18_2200.sql"
   ```

   > Si le dump contient `CREATE DATABASE`, il recréera les bases.
   > Sinon, ajoutez `-D 2025_bu01` (et un 2e appel pour
   > `stock_management_auth`).

4. **Ctrl+C** dans la fenêtre mysqld pour l'arrêter.
5. Relancez normalement : `.\start.bat`.

---

## 12. L'IP du serveur a changé

En mode LAN, les clients sont configurés avec une IP fixe. Si elle change
(par exemple changement de routeur, DHCP renouvelé), tous les clients
perdent la connexion.

**Solution durable : fixer l'IP**

- Demandez à votre administrateur réseau une **réservation DHCP** sur
  l'adresse MAC du PC serveur, ou
- Configurez une **IP statique** dans Windows
  (Paramètres → Réseau → IPv4).

**Solution immédiate : mettre à jour les clients**

Sur **chaque PC client**, éditez `C:\StockApp\config.env` :

```env
SERVER_HOST=192.168.1.60     # nouvelle IP
```

Relancez le client (`start.bat`).

---

## 13. Remise à zéro complète

> ⚠️ **Cette opération efface toutes les données métier** (articles, clients,
> factures…). À n'utiliser qu'en dernier recours. **Sauvegardez avant !**

```powershell
cd C:\StockApp

# 1. Arrêter l'application (Ctrl+C dans la console)

# 2. Supprimer les données + marqueurs
Remove-Item -Recurse -Force data\mysql
Remove-Item -Force data\.schema-initialized
Remove-Item -Force config.env        # pour repasser l'assistant
Remove-Item -Force backend\.env
Remove-Item -Force frontend\.env.local

# 3. Relancer : l'assistant réapparaît et la base est recréée vierge
.\start.bat
```

Vous repartez avec un compte `admin` / `admin123` et une base vide.

---

## 14. L'application tente de joindre le cloud

**Symptôme :** la console du navigateur (F12) montre des requêtes vers
`supabase.co` ou `ngrok-free.dev`, ou des erreurs
`NEXT_PUBLIC_SUPABASE_URL is not defined`.

**Cause :** des variables d'environnement « cloud » sont présentes.

**Vérifier :**

```powershell
Get-Content C:\StockApp\frontend\.env.local
Get-Content C:\StockApp\backend\.env
```

**Correction :**

- Supprimer toute ligne `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_*`,
  `NEXT_PUBLIC_API_URL` qui pointerait vers ngrok/Internet.
- Conserver uniquement les variables documentées dans
  `offline-pack\config\*.env.example`.
- Le plus simple : supprimer ces fichiers `.env`, ils sont régénérés
  correctement par `StockApp-Launcher.ps1 au prochain démarrage.

---

## 15. Demander de l'aide

Si rien ne fonctionne, rassemblez ces éléments avant de contacter le support :

1. **Version** de StockApp (visible dans Paramètres → À propos, ou date du
   dossier `C:\StockApp`).
2. **Mode** utilisé (standalone / serveur / client).
3. **Capture** de la console (fenêtre noire) au moment de l'erreur.
4. **Extrait** du journal :
   ```powershell
   Get-Content C:\StockApp\logs\stockapp.log -Tail 100
   ```
5. **Résultat** des commandes de diagnostic :
   ```powershell
   netstat -ano | findstr ":3000 :3005 :3306"
   ```

---

## 📚 Voir aussi

- [`GUIDE_UTILISATION_OFFLINE.md`](./GUIDE_UTILISATION_OFFLINE.md) — usage quotidien
- [`GUIDE_INSTALLATION_OFFLINE.md`](./GUIDE_INSTALLATION_OFFLINE.md) — installation & build
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — fonctionnement technique détaillé
