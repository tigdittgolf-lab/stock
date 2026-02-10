# 📁 Fichiers de Synchronisation - Vue d'ensemble

## 🎯 Fichiers créés

Voici tous les fichiers créés pour le système de synchronisation automatique des bases de données.

---

## 📜 Scripts principaux

### `sync-database-objects-pg.js` ⭐
**Script principal de synchronisation via PostgreSQL direct**
- Extrait les définitions depuis `2025_bu01`
- Déploie vers toutes les autres bases
- Génère fichiers SQL et rapports
- **Recommandé** : Plus fiable et rapide

### `sync-database-objects.js`
**Script de synchronisation via Supabase API**
- Alternative utilisant l'API Supabase
- Utile si connexion directe PostgreSQL impossible

### `verify-sync.js`
**Script de vérification**
- Vérifie que tous les objets existent dans tous les schémas
- Affiche une matrice de présence
- Génère un résumé détaillé

### `test-connection.js`
**Script de test de configuration**
- Teste la connexion à la base
- Vérifie les credentials
- Liste les schémas disponibles
- **À exécuter en premier** avant toute synchronisation

### `rollback-sync.js`
**Script de rollback (⚠️ destructif)**
- Supprime les fonctions/procédures des schémas cibles
- Demande confirmation avant exécution
- Utile en cas de problème

---

## 📚 Documentation

### `QUICK_START.md` ⭐
**Guide de démarrage rapide (3 étapes)**
- Installation
- Configuration
- Exécution
- **Commencez par ici !**

### `README_SYNC.md`
**Documentation principale**
- Vue d'ensemble complète
- Exemples d'utilisation
- Personnalisation
- Dépannage

### `GUIDE_SYNCHRONISATION_BDD.md`
**Documentation détaillée**
- Configuration avancée
- Automatisation (cron, Task Scheduler)
- Vérifications post-synchronisation
- Exemples SQL

### `FICHIERS_SYNCHRONISATION.md` (ce fichier)
**Index de tous les fichiers créés**

---

## 🔧 Configuration

### `.env.example`
**Modèle de configuration**
- Variables d'environnement nécessaires
- Exemples de valeurs
- À copier vers `.env` et personnaliser

### `package.json` (modifié)
**Configuration npm**
- Scripts npm ajoutés
- Dépendances nécessaires
- Type: module (ES6)

---

## 🪟 Scripts Windows

### `sync-databases.ps1`
**Script PowerShell pour Windows**
- Interface conviviale
- Vérification des prérequis
- Gestion des erreurs
- Affichage coloré

**Usage:**
```powershell
.\sync-databases.ps1           # Synchroniser
.\sync-databases.ps1 -Verify   # Vérifier
.\sync-databases.ps1 -Help     # Aide
```

---

## 📊 Fichiers générés (automatiquement)

Ces fichiers sont créés automatiquement lors de l'exécution :

### `database-sync-YYYY-MM-DD-HHMMSS.sql`
- Toutes les définitions SQL
- Définitions originales + adaptées
- Utilisable pour déploiement manuel
- Sert de backup

### `database-sync-YYYY-MM-DD-HHMMSS-report.txt`
- Rapport détaillé de la synchronisation
- Statistiques
- Liste des erreurs (si présentes)
- Taux de réussite

---

## 🗂️ Structure des fichiers

```
projet/
├── 📜 Scripts de synchronisation
│   ├── sync-database-objects-pg.js      ⭐ Principal
│   ├── sync-database-objects.js         Alternative Supabase
│   ├── verify-sync.js                   Vérification
│   ├── test-connection.js               Test config
│   └── rollback-sync.js                 Rollback
│
├── 📚 Documentation
│   ├── QUICK_START.md                   ⭐ Commencez ici
│   ├── README_SYNC.md                   Doc principale
│   ├── GUIDE_SYNCHRONISATION_BDD.md     Doc détaillée
│   └── FICHIERS_SYNCHRONISATION.md      Ce fichier
│
├── 🔧 Configuration
│   ├── .env.example                     Modèle config
│   ├── .env                             Config (à créer)
│   └── package.json                     Config npm
│
├── 🪟 Scripts Windows
│   └── sync-databases.ps1               PowerShell
│
└── 📊 Fichiers générés (auto)
    ├── database-sync-*.sql              Backups SQL
    └── database-sync-*-report.txt       Rapports
```

---

## 🚀 Workflow recommandé

### Première utilisation

1. **Lire** `QUICK_START.md`
2. **Installer** : `npm install`
3. **Configurer** : `cp .env.example .env` puis éditer
4. **Tester** : `npm run test-connection`
5. **Synchroniser** : `npm run sync-db`
6. **Vérifier** : `npm run verify-sync`

### Utilisation quotidienne

```bash
# Synchronisation simple
npm run sync-db

# Avec vérification
npm run sync-db && npm run verify-sync
```

### En cas de problème

1. **Tester** : `npm run test-connection`
2. **Consulter** les fichiers de rapport générés
3. **Lire** `GUIDE_SYNCHRONISATION_BDD.md` section Dépannage
4. **Rollback** si nécessaire : `npm run rollback`

---

## 📝 Scripts npm disponibles

| Script | Fichier exécuté | Description |
|--------|----------------|-------------|
| `npm run test-connection` | `test-connection.js` | Tester la config |
| `npm run sync-db` | `sync-database-objects-pg.js` | Synchroniser (PG) |
| `npm run sync-db-supabase` | `sync-database-objects.js` | Synchroniser (Supabase) |
| `npm run verify-sync` | `verify-sync.js` | Vérifier |
| `npm run rollback` | `rollback-sync.js` | Rollback ⚠️ |
| `npm run help` | - | Afficher l'aide |

---

## 🎯 Objets synchronisés

### Fonctions
- `authenticate_user`

### Procédures
- `create_user`
- `delete_bl_details`
- `delete_user`
- `insert_bl_detail`
- `update_bl`
- `update_bl_json`
- `update_user`

**Pour ajouter d'autres objets** : Éditez `sync-database-objects-pg.js`

---

## 🔄 Personnalisation

### Ajouter des objets à synchroniser

Éditez `sync-database-objects-pg.js` :

```javascript
const OBJECTS_TO_SYNC = {
  functions: [
    'authenticate_user',
    'votre_fonction'  // ← Ajoutez ici
  ],
  procedures: [
    'create_user',
    'votre_procedure'  // ← Ajoutez ici
  ]
};
```

### Changer le schéma source

```javascript
const SOURCE_SCHEMA = '2025_bu01';  // ← Modifiez ici
```

### Exclure des schémas cibles

Modifiez la fonction `getAllTenantSchemas()` dans le script

---

## 📦 Dépendances npm

```json
{
  "@supabase/supabase-js": "^2.90.1",  // Pour version Supabase
  "pg": "^8.11.3",                      // Pour version PostgreSQL
  "dotenv": "^16.3.1"                   // Variables d'environnement
}
```

---

## 🆘 Support

### Ordre de consultation

1. **`QUICK_START.md`** - Démarrage rapide
2. **`README_SYNC.md`** - Documentation principale
3. **`GUIDE_SYNCHRONISATION_BDD.md`** - Guide détaillé
4. **Fichiers de rapport générés** - Logs d'exécution

### Problèmes courants

Consultez la section "Problèmes courants" dans :
- `QUICK_START.md` (solutions rapides)
- `README_SYNC.md` (solutions détaillées)
- `GUIDE_SYNCHRONISATION_BDD.md` (dépannage avancé)

---

## ✅ Checklist de déploiement

- [ ] Tous les fichiers sont présents
- [ ] `npm install` exécuté
- [ ] `.env` créé et configuré
- [ ] `npm run test-connection` réussi
- [ ] `npm run sync-db` réussi
- [ ] `npm run verify-sync` confirme la synchro
- [ ] Fichiers SQL et rapports générés
- [ ] Tests manuels effectués sur les bases

---

## 🎉 Prêt à utiliser !

Tout est en place pour synchroniser automatiquement vos bases de données.

**Prochaine étape** : Consultez `QUICK_START.md` pour commencer !
