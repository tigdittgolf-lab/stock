# Guide de Synchronisation des Fonctions et Procédures

## 📋 Vue d'ensemble

Ce système automatise la synchronisation des fonctions et procédures PostgreSQL depuis la base de données source `2025_bu01` vers toutes les autres bases de données de l'application.

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

## 🚀 Utilisation

### Option 1 : Via Supabase API (Recommandé pour Supabase)

```bash
# Installation des dépendances
npm install @supabase/supabase-js dotenv

# Configuration
cp .env.example .env
# Éditer .env avec vos credentials Supabase

# Exécution
node sync-database-objects.js
```

### Option 2 : Via PostgreSQL Direct (Plus fiable)

```bash
# Installation des dépendances
npm install pg dotenv

# Configuration
cp .env.example .env
# Éditer .env avec vos credentials PostgreSQL

# Exécution
node sync-database-objects-pg.js
```

## 📊 Ce que fait le script

1. **Connexion** : Se connecte à la base de données
2. **Découverte** : Identifie automatiquement tous les schémas tenant (ex: 2024_bu01, 2024_bu02, etc.)
3. **Extraction** : Extrait les définitions complètes depuis `2025_bu01`
4. **Adaptation** : Adapte les définitions pour chaque schéma cible
5. **Déploiement** : Déploie les fonctions/procédures vers tous les schémas
6. **Sauvegarde** : Génère un fichier SQL avec toutes les définitions
7. **Rapport** : Crée un rapport détaillé des opérations

## 📁 Fichiers générés

### `database-sync-YYYY-MM-DD-HHMMSS.sql`
Contient toutes les définitions SQL :
- Définitions originales du schéma source
- Définitions adaptées pour chaque schéma cible
- Peut être utilisé pour déploiement manuel ou rollback

### `database-sync-YYYY-MM-DD-HHMMSS-report.txt`
Rapport détaillé incluant :
- Statistiques globales
- Liste des erreurs (si présentes)
- Taux de réussite

## 🔧 Configuration avancée

### Ajouter de nouveaux objets à synchroniser

Éditez le fichier `sync-database-objects-pg.js` :

```javascript
const OBJECTS_TO_SYNC = {
  functions: [
    'authenticate_user',
    'votre_nouvelle_fonction'  // Ajoutez ici
  ],
  procedures: [
    'create_user',
    'votre_nouvelle_procedure'  // Ajoutez ici
  ]
};
```

### Changer le schéma source

```javascript
const SOURCE_SCHEMA = '2025_bu01';  // Modifiez ici
```

### Exclure certains schémas cibles

Modifiez la requête dans `getAllTenantSchemas()` :

```javascript
const query = `
  SELECT schema_name 
  FROM information_schema.schemata 
  WHERE schema_name LIKE '%_bu%'
    AND schema_name != $1
    AND schema_name NOT IN ('2020_bu01', '2021_bu01')  -- Exclusions
  ORDER BY schema_name;
`;
```

## ⚠️ Précautions

1. **Backup** : Toujours faire un backup avant de synchroniser
2. **Test** : Tester d'abord sur un environnement de développement
3. **Vérification** : Vérifier les fichiers SQL générés avant déploiement manuel
4. **Dépendances** : S'assurer que les tables/types référencés existent dans tous les schémas

## 🔍 Vérification post-synchronisation

### Vérifier qu'une fonction existe dans tous les schémas

```sql
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'authenticate_user'
  AND n.nspname LIKE '%_bu%'
ORDER BY n.nspname;
```

### Tester une fonction dans un schéma spécifique

```sql
-- Test dans 2024_bu01
SELECT "2024_bu01".authenticate_user('username', 'password');

-- Test dans 2024_bu02
SELECT "2024_bu02".authenticate_user('username', 'password');
```

## 🐛 Dépannage

### Erreur : "function does not exist"
- Vérifier que la fonction existe dans le schéma source
- Vérifier l'orthographe du nom de la fonction

### Erreur : "relation does not exist"
- Les tables référencées n'existent pas dans le schéma cible
- Créer d'abord les tables nécessaires

### Erreur de connexion
- Vérifier les credentials dans `.env`
- Vérifier que la base de données est accessible
- Pour Supabase : vérifier que le service role key est correct

## 📝 Exemple de sortie

```
╔════════════════════════════════════════════════════════╗
║  Synchronisation des Fonctions et Procédures          ║
║  Source: 2025_bu01                                     ║
╚════════════════════════════════════════════════════════╝

🔌 Connexion à la base de données...
✅ Connecté

🔍 Recherche de tous les schémas tenant...

📊 3 schéma(s) cible(s) trouvé(s):
   - 2024_bu01
   - 2024_bu02
   - 2024_bu03

═══════════════════════════════════════════════════════

📥 EXTRACTION DES DÉFINITIONS

📥 Extraction de authenticate_user...
📥 Extraction de create_user...
📥 Extraction de delete_bl_details...
...

💾 Définitions sauvegardées dans: database-sync-2026-02-09-143022.sql

═══════════════════════════════════════════════════════

🚀 DÉPLOIEMENT VERS LES SCHÉMAS CIBLES

📦 Déploiement de authenticate_user:
  ✅ Déployé vers 2024_bu01
  ✅ Déployé vers 2024_bu02
  ✅ Déployé vers 2024_bu03

...

📄 Rapport sauvegardé dans: database-sync-2026-02-09-143022-report.txt

═══════════════════════════════════════════════════════

📊 RÉSUMÉ DE LA SYNCHRONISATION

   Total d'opérations: 24
   ✅ Réussies: 24
   ❌ Échouées: 0
   ⏭️  Ignorées: 0
   📈 Taux de réussite: 100.0%

═══════════════════════════════════════════════════════
```

## 🔄 Automatisation

### Créer un script npm

Ajoutez dans `package.json` :

```json
{
  "scripts": {
    "sync-db": "node sync-database-objects-pg.js",
    "sync-db-supabase": "node sync-database-objects.js"
  }
}
```

Puis exécutez :
```bash
npm run sync-db
```

### Planifier avec cron (Linux/Mac)

```bash
# Tous les jours à 2h du matin
0 2 * * * cd /chemin/vers/projet && node sync-database-objects-pg.js >> sync.log 2>&1
```

### Planifier avec Task Scheduler (Windows)

1. Ouvrir Task Scheduler
2. Créer une tâche de base
3. Déclencheur : Quotidien à 2h
4. Action : Démarrer un programme
5. Programme : `node`
6. Arguments : `C:\chemin\vers\sync-database-objects-pg.js`

## 📞 Support

En cas de problème :
1. Vérifier les logs générés
2. Consulter le fichier de rapport
3. Vérifier le fichier SQL généré
4. Tester manuellement les requêtes SQL
