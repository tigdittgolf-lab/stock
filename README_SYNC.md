# 🔄 Synchronisation Automatique des Bases de Données

Système automatisé pour synchroniser les fonctions et procédures PostgreSQL depuis `2025_bu01` vers toutes les autres bases de données.

## 🚀 Démarrage Rapide

### 1. Installation

```bash
npm install
```

### 2. Configuration

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos credentials
notepad .env  # Windows
```

Remplissez les informations de connexion :
```env
DB_HOST=db.votre-projet.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=votre-mot-de-passe
```

### 3. Test de connexion

Avant de synchroniser, testez votre configuration :

```bash
npm run test-connection
```

Ce script va :
- ✅ Vérifier vos credentials
- ✅ Tester la connexion à la base
- ✅ Lister tous les schémas disponibles
- ✅ Vérifier que le schéma source existe

### 4. Exécution

#### Windows (PowerShell)
```powershell
# Synchroniser
.\sync-databases.ps1

# Vérifier
.\sync-databases.ps1 -Verify

# Aide
.\sync-databases.ps1 -Help
```

#### Linux/Mac ou via npm
```bash
# Synchroniser
npm run sync-db

# Vérifier
npm run verify-sync
```

## 📦 Ce qui est synchronisé

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

## 📊 Résultat

Le script va :
1. ✅ Détecter automatiquement toutes les bases de données (2024_bu01, 2024_bu02, etc.)
2. ✅ Extraire les définitions depuis `2025_bu01`
3. ✅ Déployer vers toutes les autres bases
4. ✅ Générer un fichier SQL de backup
5. ✅ Créer un rapport détaillé

### Fichiers générés

- `database-sync-YYYY-MM-DD-HHMMSS.sql` - Toutes les définitions SQL
- `database-sync-YYYY-MM-DD-HHMMSS-report.txt` - Rapport détaillé

## 🔍 Vérification

Après synchronisation, vérifiez que tout est OK :

```bash
npm run verify-sync
```

Ou manuellement en SQL :
```sql
-- Lister toutes les fonctions dans tous les schémas
SELECT 
  n.nspname as schema_name,
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('authenticate_user', 'create_user', 'delete_bl_details')
  AND n.nspname LIKE '%_bu%'
ORDER BY n.nspname, p.proname;
```

## 📝 Scripts disponibles

```bash
npm run test-connection   # Tester la connexion et la configuration
npm run sync-db          # Synchroniser (PostgreSQL direct)
npm run sync-db-supabase # Synchroniser (via Supabase API)
npm run verify-sync      # Vérifier la synchronisation
npm run rollback         # Annuler une synchronisation (ATTENTION!)
npm run help             # Afficher l'aide
```

## 🔧 Personnalisation

### Ajouter de nouveaux objets

Éditez `sync-database-objects-pg.js` :

```javascript
const OBJECTS_TO_SYNC = {
  functions: [
    'authenticate_user',
    'ma_nouvelle_fonction'  // ← Ajoutez ici
  ],
  procedures: [
    'create_user',
    'ma_nouvelle_procedure'  // ← Ajoutez ici
  ]
};
```

### Changer le schéma source

```javascript
const SOURCE_SCHEMA = '2025_bu01';  // ← Modifiez ici
```

## ⚠️ Important

- 🔒 Toujours faire un backup avant de synchroniser
- 🧪 Tester d'abord sur un environnement de développement
- 📄 Vérifier les fichiers SQL générés
- ✅ Exécuter `verify-sync` après chaque synchronisation

## 📚 Documentation complète

Consultez `GUIDE_SYNCHRONISATION_BDD.md` pour :
- Configuration avancée
- Dépannage
- Automatisation (cron, Task Scheduler)
- Exemples détaillés

## 🆘 Problèmes courants

### "Cannot find module 'pg'"
```bash
npm install
```

### "Missing .env file"
```bash
cp .env.example .env
# Puis éditez .env
```

### "Connection refused"
- Vérifiez vos credentials dans `.env`
- Vérifiez que la base de données est accessible
- Pour Supabase : utilisez l'URL de connexion directe (db.xxx.supabase.co)

## 📞 Support

En cas de problème :
1. Consultez les logs générés
2. Vérifiez le fichier de rapport
3. Testez manuellement les requêtes SQL
4. Consultez `GUIDE_SYNCHRONISATION_BDD.md`
