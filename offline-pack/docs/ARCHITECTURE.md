# 🏗️ Architecture du Mode Offline

## 1. Vue d'ensemble

L'application peut fonctionner dans **trois modes** réseau, déterminés par un
fichier de configuration généré à la première utilisation.

```
┌─────────────────────────────────────────────────────────────────┐
│  MODE STANDALONE (1 PC)                                          │
│                                                                  │
│  Navigateur ─► localhost:3000 (Next.js)                          │
│                       │                                          │
│                       ▼                                          │
│                 localhost:3005 (Backend Hono)                    │
│                       │                                          │
│                       ▼                                          │
│                 localhost:3306 (MySQL)                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  MODE RÉSEAU LAN (plusieurs PC)                                  │
│                                                                  │
│  PC SERVEUR (ex: 192.168.1.50)                                   │
│  ┌──────────────────────────────────────┐                        │
│  │ MySQL :3306  ← Backend :3005 ← :3000 │                        │
│  └────────────────────┬─────────────────┘                        │
│                       │ réseau LAN                               │
│         ┌─────────────┼──────────────┐                           │
│         ▼             ▼              ▼                           │
│   PC Client 2   PC Client 3    PC Client 4                       │
│   (navigateur   (navigateur    (navigateur                       │
│    uniquement)   uniquement)    uniquement)                      │
│   → http://192.168.1.50:3000                                     │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Décision technique : pourquoi MySQL ?

| Critère | MySQL/MariaDB | SQLite | PostgreSQL local |
|---------|:---:|:---:|:---:|
| **Multi-postes (LAN)** | ✅ serveur TCP | ❌ fichier local | ✅ mais lourd |
| **Portabilité Windows** | ✅ MariaDB portable | ✅ embarqué | ⚠️ install complexe |
| **Réutilise le code existant** | ✅ `auth-mysql.ts`, `databaseService.ts` | ⚠️ refonte SQL | ✅ déjà supporté |
| **Performance** | ✅ | ✅ (1 user) | ✅ |

→ **Choix : MariaDB portable** car :
1. Le backend supporte **déjà MySQL** (`databaseService.ts` cas `mysql`).
2. MariaDB existe en version **portable** (pas d'install admin requise).
3. Permet le **partage LAN** (serveur TCP sur le port 3306).

## 3. Flux d'une requête en mode offline

```
1. Utilisateur clique sur "Liste des articles"
       │
2. Frontend (Next.js :3000)
   │   apiRequest('articles') depuis lib/api.ts
   │   → injecte headers X-Database-Type=mysql + X-Tenant
   ▼
3. Route API Next.js (/api/articles/route.ts)
   │   → en mode offline, appelle le backend local directement
   ▼
4. Backend Hono (:3005)
   │   databaseMiddleware lit X-Database-Type=mysql
   │   → databaseService.switchDatabase(mysql config)
   ▼
5. MySQL local (:3306)
   │   SELECT * FROM article WHERE ...
   ▼
6. Réponse remonte : MySQL → Backend → Frontend → Navigateur
```

## 4. Détection du mode offline côté frontend

Un nouveau module `frontend/lib/offline-mode.ts` expose :

```ts
getOfflineMode()      // → 'standalone' | 'server' | 'client' | null
isOffline()           // → true si le pack local est actif
getBackendUrl()       // → 'http://localhost:3005' ou 'http://192.168.1.50:3005'
getDatabaseType()     // → 'mysql' (toujours en offline)
```

Ces fonctions lisent `window.__STOCKAPP_OFFLINE__` injecté par le lanceur
(via variable d'environnement `NEXT_PUBLIC_OFFLINE_MODE`).

## 5. Isolation entre Cloud et Local

- Le mode **offline** est **opt-in** : si `NEXT_PUBLIC_OFFLINE_MODE` n'est pas
  défini, l'application se comporte **exactement comme avant** (Supabase Cloud).
- Aucune modification rétro-compatible n'est cassée.
- Le même build peut servir les deux usages (cloud + offline).

## 6. Persistence et sauvegarde

- Les données MySQL sont stockées dans `C:\StockApp\data\mysql\`.
- Un script de **sauvegarde automatique** (`backup.bat`) peut être planifié
  pour exporter un dump quotidien vers un dossier de l'utilisateur.

## 7. Limitations actuelles (à connaître)

- Pas de **synchronisation** entre une base cloud et une base locale
  (chaque installation est indépendante). Une synchro serait un projet séparé.
- Le mode LAN requiert que le PC serveur reste **allumé** tant que les
  clients travaillent.
- Les PDF générés côté client (jsPDF) restent fonctionnels hors-ligne ✅.
