# Fix: Normalisation de la Structure des BL d'Achat pour MySQL/PostgreSQL

## Problème Identifié

L'application doit fonctionner avec 3 bases de données différentes:
- **Supabase** (cloud)
- **MySQL** (local)
- **PostgreSQL** (local)

Après les corrections pour les routes API, les BL de vente et d'achat fonctionnaient avec Supabase, mais pas avec MySQL/PostgreSQL.

### Erreur Observée avec MySQL

```
🚨 CRITICAL: No valid ID found for BL: {}
```

Le frontend validait les BL en cherchant les champs `bl.nbl`, `bl.id`, ou `bl.nfact`, mais MySQL retournait uniquement `nbl_achat` sans les alias `nbl` et `id`.

## Cause Racine

Les requêtes SQL pour MySQL/PostgreSQL dans `getPurchaseBLList()` et `getPurchaseBLById()` ne retournaient pas les mêmes champs que Supabase:

**Avant (MySQL):**
```sql
SELECT 
  b.Nbl as nbl_achat,  -- ❌ Pas de 'nbl' ni 'id'
  b.Nfournisseur as nfournisseur,
  ...
```

**Frontend attendait:**
```typescript
let validId = bl.nbl || bl.id || bl.nfact;  // ❌ Tous undefined pour MySQL
```

## Solution Appliquée

Ajout des alias `nbl` et `id` dans les requêtes MySQL/PostgreSQL pour normaliser la structure:

**Après (MySQL):**
```sql
SELECT 
  b.Nbl as nbl_achat,  -- Conservé pour compatibilité
  b.Nbl as nbl,        -- ✅ Ajouté pour frontend
  b.Nbl as id,         -- ✅ Ajouté pour frontend
  b.Nfournisseur as nfournisseur,
  ...
```

**Après (PostgreSQL):**
```sql
SELECT 
  b.nbl as nbl_achat,  -- Conservé pour compatibilité
  b.nbl as nbl,        -- ✅ Ajouté pour frontend
  b.nbl as id,         -- ✅ Ajouté pour frontend
  b.nfournisseur,
  ...
```

## Fichiers Modifiés

- `backend/src/services/databaseService.ts`
  - `getPurchaseBLList()` - Ligne ~1856-1857 (MySQL) et ~1869-1870 (PostgreSQL)
  - `getPurchaseBLById()` - Ligne ~1922-1924 (MySQL) et ~1952-1954 (PostgreSQL)

## Commits

- `a83eb3c`: fix: Normalize purchase BL data structure for MySQL/PostgreSQL to match frontend expectations
- `d9e78f1`: fix: Add nbl/id aliases to getPurchaseBLById for MySQL/PostgreSQL

## Résultat

✅ Les BL d'achat fonctionnent maintenant avec les 3 bases de données
✅ Structure de données cohérente entre Supabase, MySQL et PostgreSQL
✅ Le frontend peut valider les IDs correctement avec `bl.nbl || bl.id || bl.nfact`

## Principe Appliqué

**Normalisation Multi-Base**: Toutes les requêtes doivent retourner une structure de données identique, indépendamment de la base de données utilisée. Le `databaseRouter` doit être transparent pour le frontend.
