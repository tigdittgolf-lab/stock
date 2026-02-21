# FIX: Ajout de la fonction exec_sql manquante

## Problème identifié

La migration échoue avec l'erreur:
```
Could not find the function public.exec_sql(params, sql_query) in the schema cache
```

**Cause**: Le fichier `CREATE_DISCOVERY_RPC_FUNCTIONS.sql` contenait 5 fonctions de découverte mais pas la fonction `exec_sql()` nécessaire pour créer les tables.

## Solution appliquée

✅ Ajout de la fonction `exec_sql()` au début du fichier SQL:

```sql
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT, params TEXT[] DEFAULT '{}')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  EXECUTE sql_query;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$;
```

## Étapes pour appliquer le fix

### 1. Ouvrir l'éditeur SQL Supabase
Aller sur: https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql

### 2. Copier le contenu du fichier
Ouvrir `CREATE_DISCOVERY_RPC_FUNCTIONS.sql` et copier TOUT le contenu

### 3. Coller et exécuter dans Supabase
- Coller le SQL dans l'éditeur
- Cliquer sur "Run" ou Ctrl+Enter
- Vérifier qu'il n'y a pas d'erreurs

### 4. Vérifier les fonctions créées
Vous devriez voir 6 fonctions créées:
- ✅ `exec_sql` (NOUVELLE - pour exécuter SQL dynamique)
- ✅ `discover_tenant_schemas` (découverte schémas)
- ✅ `discover_schema_tables` (découverte tables)
- ✅ `discover_table_structure` (structure table)
- ✅ `get_all_table_data` (récupération données)
- ✅ `create_schema_if_not_exists` (création schéma)

### 5. Tester la fonction exec_sql
Exécuter ce test dans l'éditeur SQL:
```sql
SELECT exec_sql('SELECT 1');
```

Résultat attendu:
```json
{"success": true}
```

### 6. Relancer la migration
- Retourner sur http://localhost:3001/admin/database-migration
- Cliquer sur "Tester les connexions" pour vérifier
- Sélectionner `2009_bu02` dans les tenants
- Cliquer sur "Démarrer la migration"

## Résultat attendu

La migration devrait maintenant:
1. ✅ Se connecter à MySQL
2. ✅ Se connecter à Supabase
3. ✅ Découvrir les 33 tables de 2009_bu02
4. ✅ Créer le schéma 2009_bu02 dans Supabase
5. ✅ Créer les 33 tables dans Supabase (DEVRAIT FONCTIONNER MAINTENANT)
6. ✅ Migrer les données

## Diagnostic si ça échoue encore

Si la création de tables échoue toujours, vérifier:

1. **Permissions Supabase**:
   ```sql
   -- Vérifier que la fonction existe
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'exec_sql';
   ```

2. **Test direct de création de table**:
   ```sql
   SELECT exec_sql('CREATE TABLE IF NOT EXISTS "2009_bu02".test_table (id INT)');
   ```

3. **Logs de la migration**:
   - Regarder la console du navigateur (F12)
   - Regarder les logs du serveur Next.js
   - Chercher les messages détaillés de création de tables

## Notes importantes

- La fonction `exec_sql` utilise `SECURITY DEFINER` pour avoir les permissions nécessaires
- Elle retourne un JSON avec `success: true/false` et `error` en cas d'échec
- Elle est CRITIQUE pour la migration car elle permet de créer dynamiquement les tables
