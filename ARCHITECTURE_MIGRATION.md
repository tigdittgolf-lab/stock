# 🏗️ Architecture de la Migration

## 📐 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    Interface Web (React)                     │
│              /admin/database-migration/page.tsx              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Routes API (Next.js)                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │ discover-mysql   │  │   migration      │  │   test    │ │
│  │  /route.ts       │  │   /route.ts      │  │ /route.ts │ │
│  └──────────────────┘  └──────────────────┘  └───────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Services de Migration                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CompleteMigrationService (true-migration-service)   │  │
│  │  • Orchestration de la migration                     │  │
│  │  • Gestion des étapes                                │  │
│  │  • Reporting de progression                          │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │  CompleteDiscoveryService                            │  │
│  │  • Découverte des schémas via RPC                    │  │
│  │  • Découverte des tables via RPC                     │  │
│  │  • Analyse de structure complète                     │  │
│  │  • Génération SQL                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Adaptateurs de Base                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   MySQL      │  │  PostgreSQL  │  │    Supabase      │  │
│  │   Adapter    │  │   Adapter    │  │     Adapter      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Bases de Données                          │
│  ┌──────────────┐                    ┌──────────────────┐  │
│  │    MySQL     │  ──────────────▶   │    Supabase      │  │
│  │   (Source)   │     Migration      │  (PostgreSQL)    │  │
│  │              │                    │    (Cible)       │  │
│  └──────────────┘                    └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Flux de Migration

### Phase 1: Initialisation
```
1. Interface Web
   └─▶ Utilisateur entre config MySQL
   └─▶ Utilisateur clique "Découvrir"

2. API /discover-mysql-databases
   └─▶ Connexion MySQL
   └─▶ SHOW DATABASES
   └─▶ Filtre tenant (YYYY_buXX)
   └─▶ Compte tables/enregistrements
   └─▶ Retourne liste

3. Interface Web
   └─▶ Affiche bases découvertes
   └─▶ Utilisateur sélectionne bases
   └─▶ Utilisateur clique "Migrer"
```

### Phase 2: Migration (9 étapes)

#### Étape 1: Découverte Complète
```javascript
CompleteDiscoveryService.discoverAllRealTables(tenantFilter)
  ├─▶ discoverSchemasViaRPC()
  │   └─▶ Supabase RPC: discover_tenant_schemas()
  │       └─▶ SELECT schema_name FROM information_schema.schemata
  │           WHERE schema_name LIKE '%_bu%'
  │
  └─▶ Pour chaque schéma:
      └─▶ discoverTablesViaRPC(schemaName)
          └─▶ Supabase RPC: discover_schema_tables(schema)
          │   └─▶ SELECT table_name FROM information_schema.tables
          │       WHERE table_schema = schema
          │
          └─▶ Pour chaque table:
              └─▶ Supabase RPC: discover_table_structure(schema, table)
                  ├─▶ Colonnes (information_schema.columns)
                  ├─▶ Contraintes (information_schema.table_constraints)
                  ├─▶ Comptage (SELECT COUNT(*))
                  └─▶ Échantillon (SELECT * LIMIT 2)
```

#### Étape 2: Validation
```javascript
validateCompleteDiscovery(schemas)
  └─▶ Pour chaque schéma:
      └─▶ Pour chaque table:
          ├─▶ Vérifier colonnes
          ├─▶ Vérifier contraintes
          └─▶ Logger structure
```

#### Étape 3: Nettoyage
```javascript
cleanupTarget(schemaNames)
  └─▶ Pour chaque schéma:
      └─▶ DROP SCHEMA IF EXISTS CASCADE (PostgreSQL)
      └─▶ DROP DATABASE IF EXISTS (MySQL)
```

#### Étape 4: Création Schémas
```javascript
createAllTargetSchemas(schemas)
  └─▶ Pour chaque schéma:
      └─▶ CREATE SCHEMA IF NOT EXISTS
```

#### Étape 5: Création Tables
```javascript
createAllRealTables(schemas)
  └─▶ Pour chaque schéma:
      └─▶ Vérifier schéma existe
      └─▶ Pour chaque table:
          ├─▶ Générer SQL CREATE TABLE
          │   ├─▶ Colonnes avec types
          │   ├─▶ Clés primaires
          │   ├─▶ Clés étrangères
          │   └─▶ Index
          │
          ├─▶ Exécuter CREATE TABLE
          └─▶ Vérifier table créée
```

#### Étape 6: Migration Données
```javascript
migrateAllRealData(schemas)
  └─▶ Pour chaque schéma:
      └─▶ Pour chaque table:
          ├─▶ Récupérer données source
          │   └─▶ RPC: get_all_table_data(schema, table)
          │       └─▶ SELECT * FROM schema.table
          │
          └─▶ Insérer données cible
              └─▶ INSERT INTO ... VALUES (...)
                  ON DUPLICATE KEY UPDATE (MySQL)
                  ON CONFLICT DO NOTHING (PostgreSQL)
```

#### Étape 7: Migration RPC
```javascript
migrateRPCFunctions()
  └─▶ Appel API /database/{type}/rpc-migration
      ├─▶ Créer fonctions RPC dans base locale
      └─▶ Tester fonctions créées
```

#### Étape 8: Vérification
```javascript
verifyCompleteMigration(schemas)
  └─▶ Pour chaque schéma:
      └─▶ Vérifier schéma existe
      └─▶ Pour chaque table:
          ├─▶ Vérifier table existe
          ├─▶ Compter enregistrements
          └─▶ Comparer source vs cible
```

#### Étape 9: Finalisation
```javascript
reportProgress('Terminé', 9, 9, 'Migration terminée!', true)
  └─▶ Retourner résumé
      ├─▶ Nombre de schémas
      ├─▶ Nombre de tables
      ├─▶ Nombre d'enregistrements
      └─▶ Logs complets
```

## 🔌 Adaptateurs

### Interface DatabaseAdapter
```typescript
interface DatabaseAdapter {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  testConnection(): Promise<boolean>;
  query(sql: string, params?: any[], database?: string): Promise<QueryResult>;
  executeRPC(functionName: string, params: any): Promise<QueryResult>;
  createSchema(schemaName: string): Promise<boolean>;
  listSchemas(): Promise<string[]>;
  listTables(schemaName: string): Promise<string[]>;
}
```

### SupabaseAdapter
```typescript
class SupabaseAdapter implements DatabaseAdapter {
  private client: SupabaseClient;
  
  // Utilise les fonctions RPC Supabase
  async executeRPC(functionName, params) {
    return this.client.rpc(functionName, params);
  }
  
  // Convertit les requêtes SQL en appels Supabase
  async query(sql, params) {
    // Parse SQL et utilise client.from().select()
  }
}
```

### MySQLAdapter
```typescript
class MySQLAdapter implements DatabaseAdapter {
  private connection: mysql.Connection;
  
  // Exécute SQL directement
  async query(sql, params, database) {
    if (database) {
      await this.connection.query(`USE \`${database}\``);
    }
    return this.connection.query(sql, params);
  }
  
  // Simule RPC avec SQL
  async executeRPC(functionName, params) {
    // Convertit appel RPC en SQL équivalent
  }
}
```

### PostgreSQLAdapter
```typescript
class PostgreSQLAdapter implements DatabaseAdapter {
  private client: pg.Client;
  
  // Exécute SQL avec paramètres $1, $2, etc.
  async query(sql, params) {
    return this.client.query(sql, params);
  }
  
  // Appelle vraies fonctions PostgreSQL
  async executeRPC(functionName, params) {
    return this.client.query(
      `SELECT ${functionName}($1, $2)`,
      Object.values(params)
    );
  }
}
```

## 📊 Structures de Données

### CompleteSchema
```typescript
interface CompleteSchema {
  schemaName: string;
  tables: CompleteTable[];
}
```

### CompleteTable
```typescript
interface CompleteTable {
  tableName: string;
  columns: CompleteColumn[];
  constraints: CompleteConstraint[];
  recordCount: number;
  sampleData?: any[];
}
```

### CompleteColumn
```typescript
interface CompleteColumn {
  columnName: string;
  dataType: string;
  characterMaximumLength: number | null;
  isNullable: string;
  columnDefault: string | null;
  ordinalPosition: number;
}
```

### CompleteConstraint
```typescript
interface CompleteConstraint {
  constraintName: string;
  constraintType: string;
  columnName: string;
}
```

## 🔐 Sécurité

### Validation des entrées
- ✅ Validation des configurations
- ✅ Test des connexions avant migration
- ✅ Échappement des noms de schémas/tables
- ✅ Paramètres préparés pour les requêtes

### Gestion des erreurs
- ✅ Try-catch à tous les niveaux
- ✅ Logs détaillés des erreurs
- ✅ Rollback partiel si possible
- ✅ Messages d'erreur clairs

### Permissions
- ✅ Vérification des permissions MySQL
- ✅ Vérification des permissions Supabase
- ✅ Service role key pour Supabase (admin)

## ⚡ Performances

### Optimisations actuelles
- ✅ Batch inserts (100 enregistrements)
- ✅ Connexions persistantes
- ✅ Requêtes préparées
- ✅ Index créés automatiquement

### Optimisations futures possibles
- 🔄 Parallélisation des tables
- 🔄 Streaming pour grandes tables
- 🔄 Compression des données
- 🔄 Cache des métadonnées

## 📈 Monitoring

### Logs disponibles
- ✅ Progression en temps réel
- ✅ Logs par étape
- ✅ Compteurs (tables, enregistrements)
- ✅ Temps d'exécution
- ✅ Erreurs détaillées

### Métriques
- Tables créées / total
- Enregistrements migrés / total
- Temps par étape
- Taux de réussite

## 🧪 Tests

### Tests manuels
1. Test connexion source
2. Test connexion cible
3. Test découverte
4. Test migration complète
5. Test vérification

### Tests automatisés (à implémenter)
- Unit tests pour chaque service
- Integration tests pour adaptateurs
- E2E tests pour migration complète

## 📚 Dépendances

### Frontend
- Next.js 14
- React 18
- TypeScript 5

### Backend
- mysql2 (client MySQL)
- @supabase/supabase-js (client Supabase)
- pg (client PostgreSQL)

### Fonctions RPC Supabase
- plpgsql (langage procédural PostgreSQL)
- information_schema (métadonnées)

## 🎯 Points clés

1. **Découverte via RPC**: Utilise les fonctions RPC Supabase pour découvrir la structure
2. **Adaptateurs**: Abstraction pour supporter plusieurs types de bases
3. **Migration complète**: Schémas + Tables + Données + RPC
4. **Vérification**: Validation à chaque étape
5. **Logs détaillés**: Traçabilité complète du processus
