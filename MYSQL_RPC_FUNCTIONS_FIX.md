# Correction - Fonctions RPC Manquantes pour MySQL

## Problème

Lors de l'utilisation de MySQL, plusieurs erreurs RPC apparaissaient :

```
RPC function get_all_users not implemented for mysql
RPC function get_all_business_units not implemented for mysql
RPC function list_available_tenants not implemented for mysql
```

Ces fonctions sont nécessaires pour :
- Lister tous les utilisateurs (page admin)
- Lister toutes les business units (page admin)
- Lister les tenants disponibles (création d'utilisateur manager)

## Cause

Le système `databaseService.ts` utilise des fonctions RPC (Remote Procedure Call) qui existent nativement dans Supabase, mais doivent être converties en requêtes SQL pour MySQL et PostgreSQL.

Les trois fonctions manquaient dans le switch case de conversion RPC → SQL.

## Solution Appliquée

### Fichier: `backend/src/services/databaseService.ts`

#### 1. Ajout dans le Switch Case (ligne ~1245)

```typescript
// Fonctions pour l'administration
case 'get_all_users':
  return this.getAllUsers(dbType);
case 'get_all_business_units':
  return this.getAllBusinessUnits(dbType);
case 'list_available_tenants':
  return this.listAvailableTenants(dbType);
```

#### 2. Implémentation de `getAllUsers`

```typescript
private async getAllUsers(dbType: 'mysql' | 'postgresql'): Promise<any> {
  // MySQL: SELECT depuis stock_management_auth.users
  // PostgreSQL: SELECT depuis public.users
  // Parse business_units JSON pour chaque utilisateur
  // Retourne: liste complète des utilisateurs
}
```

**Requête MySQL:**
```sql
SELECT id, username, email, full_name, role, business_units, 
       created_at, last_login, active
FROM stock_management_auth.users 
ORDER BY created_at DESC
```

**Requête PostgreSQL:**
```sql
SELECT id, username, email, full_name, role, business_units, 
       created_at, last_login, is_active as active
FROM public.users 
ORDER BY created_at DESC
```

#### 3. Implémentation de `getAllBusinessUnits`

```typescript
private async getAllBusinessUnits(dbType: 'mysql' | 'postgresql'): Promise<any> {
  // Liste toutes les bases de données au format YYYY_buXX
  // Extrait business_unit et year
  // Retourne: liste des BU avec année
}
```

**Requête MySQL:**
```sql
SELECT DISTINCT 
  SUBSTRING_INDEX(SCHEMA_NAME, '_', -1) as business_unit,
  CAST(SUBSTRING_INDEX(SCHEMA_NAME, '_', 1) AS UNSIGNED) as year,
  SCHEMA_NAME as schema_name
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME REGEXP '^[0-9]{4}_bu[0-9]{2}$'
ORDER BY year DESC, business_unit
```

**Requête PostgreSQL:**
```sql
SELECT DISTINCT 
  split_part(schema_name, '_', 2) as business_unit,
  CAST(split_part(schema_name, '_', 1) AS INTEGER) as year,
  schema_name
FROM information_schema.schemata 
WHERE schema_name ~ '^[0-9]{4}_bu[0-9]{2}$'
ORDER BY year DESC, business_unit
```

#### 4. Implémentation de `listAvailableTenants`

```typescript
private async listAvailableTenants(dbType: 'mysql' | 'postgresql'): Promise<any> {
  // Identique à getAllBusinessUnits mais avec format de sortie différent
  // Retourne: { business_unit, year, schema }
}
```

**Requête MySQL:**
```sql
SELECT 
  SUBSTRING_INDEX(SCHEMA_NAME, '_', -1) as business_unit,
  CAST(SUBSTRING_INDEX(SCHEMA_NAME, '_', 1) AS UNSIGNED) as year,
  SCHEMA_NAME as schema
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME REGEXP '^[0-9]{4}_bu[0-9]{2}$'
ORDER BY year DESC, business_unit
```

## Fonctionnalités Ajoutées

### 1. getAllUsers
- ✅ Liste tous les utilisateurs du système
- ✅ Parse automatiquement le JSON `business_units`
- ✅ Tri par date de création (plus récent en premier)
- ✅ Support MySQL et PostgreSQL

### 2. getAllBusinessUnits
- ✅ Liste toutes les business units disponibles
- ✅ Extrait automatiquement l'année et le code BU
- ✅ Filtre uniquement les schémas au format `YYYY_buXX`
- ✅ Tri par année décroissante puis par BU

### 3. listAvailableTenants
- ✅ Identique à getAllBusinessUnits
- ✅ Format de sortie adapté pour le frontend
- ✅ Utilisé pour la sélection de BU lors de la création d'utilisateur

## Différences MySQL vs PostgreSQL

| Aspect | MySQL | PostgreSQL |
|--------|-------|------------|
| **Table users** | `stock_management_auth.users` | `public.users` |
| **Champ actif** | `active` (TINYINT) | `is_active` (BOOLEAN) |
| **Extraction string** | `SUBSTRING_INDEX()` | `split_part()` |
| **Regex** | `REGEXP '^pattern$'` | `~ '^pattern$'` |
| **Cast** | `CAST(... AS UNSIGNED)` | `CAST(... AS INTEGER)` |

## Test

### 1. Tester getAllUsers

```bash
curl -X POST http://localhost:8787/api/admin/users \
  -H "Content-Type: application/json" \
  -H "X-Tenant: 2025_bu01"
```

Réponse attendue :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "Administrateur",
      "role": "admin",
      "business_units": ["bu01", "bu02"],
      "created_at": "2025-01-15T10:00:00.000Z",
      "active": 1
    }
  ]
}
```

### 2. Tester getAllBusinessUnits

```bash
curl http://localhost:8787/api/admin/business-units \
  -H "X-Tenant: 2025_bu01"
```

Réponse attendue :
```json
{
  "success": true,
  "data": [
    {
      "business_unit": "bu02",
      "year": 2025,
      "schema_name": "2025_bu02"
    },
    {
      "business_unit": "bu01",
      "year": 2025,
      "schema_name": "2025_bu01"
    }
  ]
}
```

### 3. Tester listAvailableTenants

```bash
curl http://localhost:8787/api/database/tenants/list
```

Réponse attendue :
```json
{
  "success": true,
  "data": [
    {
      "business_unit": "bu02",
      "year": 2025,
      "schema": "2025_bu02"
    },
    {
      "business_unit": "bu01",
      "year": 2025,
      "schema": "2025_bu01"
    }
  ],
  "source": "mysql"
}
```

## Impact

### Pages Affectées
- ✅ `/users` - Création d'utilisateur manager (liste des BU)
- ✅ `/admin` - Gestion des utilisateurs (liste complète)
- ✅ `/admin` - Gestion des business units

### Fonctionnalités Débloquées
- ✅ Création d'utilisateurs managers avec BU
- ✅ Affichage de tous les utilisateurs en admin
- ✅ Gestion des business units
- ✅ Sélection de BU dans les formulaires

## Fichiers Modifiés

- ✅ `backend/src/services/databaseService.ts`
  - Ajout de 3 cas dans le switch RPC
  - Ajout de 3 fonctions privées
  - ~170 lignes de code ajoutées

## Bénéfices

1. **Compatibilité MySQL** : Les fonctions RPC fonctionnent maintenant avec MySQL
2. **Parité Supabase** : Même comportement qu'avec Supabase
3. **Support PostgreSQL** : Fonctionne aussi avec PostgreSQL
4. **Robustesse** : Gestion d'erreurs complète
5. **Performance** : Requêtes optimisées avec index sur SCHEMA_NAME
