# Système de Migrations Multi-Bases

## Concept

Chaque Business Unit (BU) et année a sa propre base de données MySQL dédiée.
Ce système permet d'appliquer les changements de structure à toutes les bases automatiquement.

## Structure

```
migrations/
├── README.md (ce fichier)
├── versions/
│   ├── 001_initial_schema.sql
│   ├── 002_add_payments_table.sql
│   ├── 003_add_supplier_invoice_column.sql
│   └── ...
├── migration-manager.ts (gestionnaire de migrations)
└── apply-to-all-databases.ts (script d'application)
```

## Utilisation

### 1. Créer une nouvelle migration

```bash
# Créer un fichier dans migrations/versions/
# Format: XXX_description.sql
# Exemple: 004_add_margin_column.sql
```

### 2. Appliquer à toutes les bases

```bash
cd backend
bun run migrations/apply-to-all-databases.ts
```

### 3. Appliquer à une base spécifique

```bash
bun run migrations/apply-to-all-databases.ts --database=2025_bu01
```

## Format des migrations

Chaque fichier de migration doit contenir:

```sql
-- Migration: 004_add_margin_column
-- Description: Ajouter colonne marge dans bons_livraison
-- Date: 2025-02-09

-- UP (appliquer)
ALTER TABLE bons_livraison ADD COLUMN marge DECIMAL(10,2) DEFAULT 0;

-- DOWN (annuler) - optionnel
-- ALTER TABLE bons_livraison DROP COLUMN marge;
```

## Suivi des migrations

Une table `_migrations` est créée dans chaque base pour suivre les migrations appliquées:

```sql
CREATE TABLE IF NOT EXISTS _migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_version (version)
);
```

## Sécurité

- ✅ Vérification avant application (migration déjà appliquée?)
- ✅ Transaction pour chaque migration
- ✅ Rollback automatique en cas d'erreur
- ✅ Log détaillé de chaque opération
- ✅ Backup recommandé avant migration majeure
