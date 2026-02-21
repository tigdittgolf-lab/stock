# Guide Rapide - Fix Migration en 3 Minutes

## Le Problème
Migration échoue: `Could not find the function public.exec_sql`

## La Solution (3 étapes)

### 1️⃣ Ouvrir Supabase SQL Editor
https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql

### 2️⃣ Copier-Coller-Exécuter
1. Ouvrir le fichier `CREATE_DISCOVERY_RPC_FUNCTIONS.sql`
2. Copier TOUT le contenu (Ctrl+A, Ctrl+C)
3. Coller dans l'éditeur Supabase
4. Cliquer "Run" ou Ctrl+Enter
5. Attendre le message de succès

### 3️⃣ Tester la Migration
1. Aller sur http://localhost:3001/admin/database-migration
2. Cliquer "Tester les connexions" (les 2 doivent être ✅)
3. Sélectionner `2009_bu02` dans les tenants
4. Cliquer "Démarrer la migration"

## Résultat Attendu

```
✅ Découverte: 33 tables trouvées dans 2009_bu02
✅ Schéma: 2009_bu02 créé dans Supabase
✅ Tables: 33 tables créées dans Supabase
✅ Données: Migration des données en cours...
✅ Terminé: Migration réussie!
```

## Si Ça Échoue

### Test rapide dans Supabase SQL Editor:
```sql
SELECT exec_sql('SELECT 1');
```

Résultat attendu: `{"success": true}`

Si erreur: Réexécuter le fichier SQL complet

## Fichiers Importants

- `CREATE_DISCOVERY_RPC_FUNCTIONS.sql` - Le SQL à exécuter (MODIFIÉ)
- `FIX_EXEC_SQL_FUNCTION.md` - Guide détaillé
- `test-exec-sql-function.sql` - Tests de validation
- `MIGRATION_FIX_COMPLETE.md` - Documentation complète

## Qu'est-ce qui a été corrigé?

Ajout de la fonction `exec_sql()` qui manquait dans le fichier SQL. Cette fonction permet de créer dynamiquement les tables dans Supabase.

**Avant**: 5 fonctions (découverte uniquement)
**Après**: 6 fonctions (découverte + exécution SQL)

## Support

Logs à vérifier si problème:
- Terminal Next.js (serveur)
- Console navigateur (F12)
- Logs Supabase SQL Editor

C'est tout! 🚀
