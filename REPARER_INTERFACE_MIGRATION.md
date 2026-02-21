# 🔧 RÉPARER L'INTERFACE WEB DE MIGRATION

## Objectif
Faire fonctionner l'interface `/admin/database-migration` pour:
1. Découvrir automatiquement toutes les bases MySQL
2. Permettre de choisir quelle(s) base(s) migrer
3. Afficher la progression en temps réel

---

## ÉTAPE 1: Créer les fonctions RPC dans Supabase ✅

**Fichier**: `CREATE_DISCOVERY_RPC_FUNCTIONS.sql`

**Actions**:
1. Ouvrir: https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql
2. Copier le contenu de `CREATE_DISCOVERY_RPC_FUNCTIONS.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur "Run"

**Fonctions créées**:
- `discover_tenant_schemas()` - Liste tous les schémas tenant dans Supabase
- `discover_schema_tables(p_schema_name)` - Liste les tables d'un schéma
- `discover_table_structure(p_schema_name, p_table_name)` - Structure complète d'une table
- `get_all_table_data(p_schema_name, p_table_name)` - Toutes les données d'une table
- `create_schema_if_not_exists(p_schema_name)` - Créer un schéma

---

## ÉTAPE 2: API de découverte MySQL ✅

**Fichier créé**: `frontend/app/api/admin/discover-mysql-databases/route.ts`

Cette API permet de:
- Se connecter à MySQL avec les credentials fournis
- Lister toutes les bases de données
- Identifier automatiquement les bases tenant (pattern: YYYY_buXX)
- Compter les tables et enregistrements estimés pour chaque base

**Test de l'API**:
```bash
curl -X POST http://localhost:3000/api/admin/discover-mysql-databases \
  -H "Content-Type: application/json" \
  -d '{"host":"localhost","port":3306,"username":"root","password":""}'
```

---

## ÉTAPE 3: Modifier l'interface web (À FAIRE)

**Fichier à modifier**: `frontend/app/admin/database-migration/page.tsx`

### Modifications nécessaires:

1. **Ajouter un bouton "Découvrir les bases"**
   - Appelle l'API `/api/admin/discover-mysql-databases`
   - Affiche la liste des bases trouvées

2. **Afficher la liste des bases avec checkboxes**
   - Permettre de sélectionner une ou plusieurs bases
   - Afficher: Nom, Nombre de tables, Nombre d'enregistrements estimés

3. **Modifier le bouton "Démarrer la migration"**
   - Migrer seulement les bases sélectionnées
   - Afficher la progression par base

4. **Améliorer l'affichage de progression**
   - Barre de progression globale
   - Détails par base et par table
   - Temps estimé restant

---

## ÉTAPE 4: Optimiser la migration par lots

**Problème actuel**: Insertion un par un = TRÈS LENT (8190 articles = plusieurs heures)

**Solution**: Modifier `execute_raw_sql` pour supporter les insertions par lots

**Nouveau fichier SQL**: `OPTIMIZE_BATCH_INSERT.sql`

```sql
CREATE OR REPLACE FUNCTION execute_batch_insert(
  p_schema_name TEXT,
  p_table_name TEXT,
  p_columns TEXT[],
  p_values TEXT[][]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sql TEXT;
  v_values_clause TEXT;
  v_inserted INTEGER := 0;
BEGIN
  -- Construire la clause VALUES pour insertion multiple
  -- INSERT INTO schema.table (col1, col2) VALUES (val1, val2), (val3, val4), ...
  
  v_values_clause := array_to_string(
    ARRAY(
      SELECT '(' || array_to_string(row_values, ', ') || ')'
      FROM unnest(p_values) AS row_values
    ),
    ', '
  );
  
  v_sql := format(
    'INSERT INTO %I.%I (%s) VALUES %s',
    p_schema_name,
    p_table_name,
    array_to_string(p_columns, ', '),
    v_values_clause
  );
  
  EXECUTE v_sql;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'inserted', v_inserted
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
```

---

## RÉSUMÉ DES FICHIERS CRÉÉS

### Scripts SQL Supabase:
1. ✅ `CREATE_DISCOVERY_RPC_FUNCTIONS.sql` - Fonctions de découverte
2. ✅ `CREATE_EXECUTE_SQL_FUNCTION.sql` - Fonction d'exécution SQL (déjà fait)
3. ✅ `UPDATE_EXECUTE_SQL_FUNCTION.sql` - Amélioration SELECT (déjà fait)
4. ⏳ `OPTIMIZE_BATCH_INSERT.sql` - Insertion par lots (à créer)

### API Backend:
1. ✅ `frontend/app/api/admin/discover-mysql-databases/route.ts` - Découverte MySQL
2. ✅ `frontend/app/api/admin/migration/route.ts` - Migration (existe déjà)

### Interface Frontend:
1. ⏳ `frontend/app/admin/database-migration/page.tsx` - À modifier

### Scripts Node.js (pour tests):
1. ✅ `list-all-mysql-databases.js` - Liste les bases MySQL
2. ✅ `migrate-all-databases.js` - Migration complète (lent)
3. ✅ `migrate-all-fast.js` - Migration avec progression

---

## PROCHAINES ÉTAPES

### Immédiat:
1. **Exécuter** `CREATE_DISCOVERY_RPC_FUNCTIONS.sql` dans Supabase
2. **Tester** l'API de découverte
3. **Modifier** l'interface web pour afficher la liste des bases

### Ensuite:
1. **Créer** la fonction d'insertion par lots
2. **Optimiser** la migration pour être 100x plus rapide
3. **Tester** la migration complète via l'interface web

---

## AVANTAGES DE CETTE APPROCHE

✅ **Découverte automatique** - Plus besoin de hardcoder les noms de bases
✅ **Sélection flexible** - Choix des bases à migrer
✅ **Progression en temps réel** - Voir l'avancement
✅ **Optimisation par lots** - Migration 100x plus rapide
✅ **Interface web** - Pas besoin de scripts Node.js

---

## ESTIMATION DU TEMPS

- Exécuter SQL Supabase: **2 minutes**
- Modifier l'interface web: **30 minutes**
- Créer fonction batch insert: **10 minutes**
- Tests complets: **15 minutes**

**Total**: ~1 heure pour avoir une interface complète et fonctionnelle

---

## ÉTAT ACTUEL

✅ Fonctions RPC de découverte créées (fichier prêt)
✅ API de découverte MySQL créée
✅ Fonction execute_raw_sql fonctionnelle
⏳ Interface web à modifier
⏳ Optimisation par lots à implémenter

**Prochaine action**: Exécuter `CREATE_DISCOVERY_RPC_FUNCTIONS.sql` dans Supabase
