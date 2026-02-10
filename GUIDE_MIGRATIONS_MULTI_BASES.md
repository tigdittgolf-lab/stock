# 🔄 Guide Complet: Système de Migrations Multi-Bases

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Installation](#installation)
3. [Utilisation](#utilisation)
4. [Exemples pratiques](#exemples-pratiques)
5. [Interface d'administration](#interface-dadministration)
6. [Bonnes pratiques](#bonnes-pratiques)
7. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

### Problème résolu

Dans votre système, chaque Business Unit (BU) et année a sa propre base de données MySQL:
- `2024_bu01`, `2024_bu02`, `2025_bu01`, `2025_bu02`, etc.

Quand vous modifiez la structure d'une base (ajouter une colonne, créer un index, etc.), vous devez appliquer le même changement à **toutes les autres bases**.

### Solution

Un système de migrations automatique qui:
- ✅ Applique les changements à toutes les bases en une seule commande
- ✅ Suit quelles migrations ont été appliquées à chaque base
- ✅ Évite d'appliquer deux fois la même migration
- ✅ Permet de revenir en arrière en cas d'erreur (rollback)
- ✅ Fournit une interface web pour gérer les migrations

---

## 🚀 Installation

### 1. Structure des fichiers

```
backend/
├── migrations/
│   ├── README.md
│   ├── migration-manager.ts       # Gestionnaire principal
│   ├── apply-to-all-databases.ts  # Script CLI
│   ├── test-migrations.ts         # Tests
│   ├── versions/                  # Fichiers de migration
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_payments_support.sql
│   │   └── 003_add_supplier_invoice_number.sql
│   └── routes/
│       └── migrations.ts          # API routes

frontend/
└── app/
    ├── api/admin/migrations/
    │   └── route.ts               # API frontend
    └── admin/migrations/
        └── page.tsx               # Interface web
```

### 2. Configuration

Assurez-vous que votre `.env` contient:

```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=votre_mot_de_passe
MYSQL_PORT=3306
```

### 3. Intégrer les routes dans le backend

Dans `backend/index.ts`, ajoutez:

```typescript
import migrationsRoutes from './routes/migrations';

// ... autres imports

app.route('/api/migrations', migrationsRoutes);
```

---

## 📖 Utilisation

### Méthode 1: Interface Web (Recommandé)

1. Accédez à: `http://localhost:3000/admin/migrations`
2. Visualisez le statut de toutes les bases
3. Cliquez sur "Appliquer les migrations"

### Méthode 2: Ligne de commande

```bash
cd backend

# Voir le statut
bun run migrations/apply-to-all-databases.ts --status

# Appliquer à toutes les bases
bun run migrations/apply-to-all-databases.ts

# Appliquer à une base spécifique
bun run migrations/apply-to-all-databases.ts --database=2025_bu01

# Tester le système
bun run migrations/test-migrations.ts
```

### Méthode 3: API REST

```bash
# Obtenir le statut
curl http://localhost:3005/api/migrations/status

# Appliquer les migrations
curl -X POST http://localhost:3005/api/migrations/apply \
  -H "Content-Type: application/json" \
  -d '{"database": "2025_bu01"}'

# Simulation (dry run)
curl -X POST http://localhost:3005/api/migrations/apply \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

---

## 💡 Exemples pratiques

### Exemple 1: Ajouter une colonne

**Fichier:** `backend/migrations/versions/004_add_margin_column.sql`

```sql
-- Migration: 004_add_margin_column
-- Description: Ajouter colonne marge dans bons_livraison
-- Date: 2025-02-09

-- Ajouter la colonne marge
ALTER TABLE bons_livraison 
ADD COLUMN IF NOT EXISTS marge DECIMAL(10,2) DEFAULT 0 
COMMENT 'Marge bénéficiaire';

-- Créer un index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_marge ON bons_livraison(marge);
```

**Application:**

```bash
cd backend
bun run migrations/apply-to-all-databases.ts
```

**Résultat:**
```
🚀 Gestionnaire de Migrations Multi-Bases
=========================================

📊 Bases de données trouvées: 4
   - 2024_bu01
   - 2024_bu02
   - 2025_bu01
   - 2025_bu02

📦 Migrations trouvées: 4
   - 001: initial schema
   - 002: add payments support
   - 003: add supplier invoice number
   - 004: add margin column

🔄 Traitement de 2024_bu01...
   ⏳ Migration 004...
   ✅ Appliquée (245ms)

🔄 Traitement de 2024_bu02...
   ⏳ Migration 004...
   ✅ Appliquée (198ms)

...

🎉 Toutes les migrations ont été appliquées avec succès!
```

### Exemple 2: Créer une nouvelle table

**Fichier:** `backend/migrations/versions/005_create_audit_log.sql`

```sql
-- Migration: 005_create_audit_log
-- Description: Créer table de logs d'audit
-- Date: 2025-02-09

CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_table (table_name),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Exemple 3: Modifier une colonne existante

**Fichier:** `backend/migrations/versions/006_modify_client_phone.sql`

```sql
-- Migration: 006_modify_client_phone
-- Description: Augmenter taille colonne téléphone client
-- Date: 2025-02-09

-- Modifier la colonne pour accepter des numéros plus longs
ALTER TABLE clients 
MODIFY COLUMN telephone VARCHAR(20);

-- Ajouter une colonne pour le téléphone secondaire
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS telephone2 VARCHAR(20) NULL 
COMMENT 'Téléphone secondaire';
```

---

## 🖥️ Interface d'administration

### Accès

URL: `http://localhost:3000/admin/migrations`

### Fonctionnalités

1. **Résumé global**
   - Nombre total de bases de données
   - Nombre de migrations en attente

2. **Sélection de la cible**
   - Toutes les bases
   - Une base spécifique

3. **Actions disponibles**
   - 🔄 Actualiser: Recharger le statut
   - 🧪 Simuler: Voir ce qui serait fait sans appliquer
   - ✅ Appliquer: Exécuter les migrations

4. **Vue détaillée par base**
   - Nombre de migrations appliquées
   - Liste des migrations en attente
   - Statut visuel (vert = OK, jaune = en attente)

### Captures d'écran (conceptuel)

```
┌─────────────────────────────────────────────────┐
│ 🔄 Gestion des Migrations                      │
│ Synchronisation des structures de bases        │
│                                    [← Retour]   │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📊 Résumé Global                               │
│ ┌──────────┐  ┌──────────┐                    │
│ │    4     │  │    12    │                    │
│ │  Bases   │  │ En attente│                   │
│ └──────────┘  └──────────┘                    │
│                                                 │
│ ⚙️ Actions                                     │
│ Base cible: [Toutes ▼]                        │
│ [🔄 Actualiser] [🧪 Simuler] [✅ Appliquer]   │
│                                                 │
│ 📁 2024_bu01        ✅ 3 appliquées ⏳ 1 attente│
│ 📁 2024_bu02        ✅ 3 appliquées ⏳ 1 attente│
│ 📁 2025_bu01        ✅ 4 appliquées            │
│ 📁 2025_bu02        ✅ 4 appliquées            │
└─────────────────────────────────────────────────┘
```

---

## ✅ Bonnes pratiques

### 1. Nommage des migrations

Format: `XXX_description.sql`

- `XXX`: Numéro séquentiel (001, 002, 003...)
- `description`: Description courte en snake_case

Exemples:
- ✅ `004_add_margin_column.sql`
- ✅ `005_create_audit_log.sql`
- ❌ `add_column.sql` (pas de numéro)
- ❌ `4_add margin.sql` (espaces, pas de zéro)

### 2. Contenu des migrations

```sql
-- Toujours inclure:
-- Migration: XXX_description
-- Description: Description détaillée
-- Date: YYYY-MM-DD

-- Utiliser IF NOT EXISTS pour l'idempotence
ALTER TABLE table_name 
ADD COLUMN IF NOT EXISTS column_name TYPE;

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column_name);

-- Ajouter des commentaires
COMMENT 'Description de la colonne';
```

### 3. Tests avant application

```bash
# 1. Tester sur une base de développement
bun run migrations/apply-to-all-databases.ts --database=2025_bu01

# 2. Vérifier le résultat
mysql -u root -p 2025_bu01 -e "DESCRIBE table_name;"

# 3. Si OK, appliquer à toutes
bun run migrations/apply-to-all-databases.ts
```

### 4. Backup avant migration majeure

```bash
# Backup automatique de toutes les bases
for db in $(mysql -u root -p -e "SHOW DATABASES" | grep "^[0-9]\{4\}_bu"); do
  mysqldump -u root -p $db > backup_${db}_$(date +%Y%m%d).sql
done
```

### 5. Ordre des migrations

- Les migrations sont appliquées dans l'ordre numérique
- Ne jamais modifier une migration déjà appliquée
- Créer une nouvelle migration pour corriger

---

## 🔧 Dépannage

### Problème: Migration échoue sur une base

**Symptôme:**
```
❌ 2024_bu01 - Migration 004: Table 'bons_livraison' doesn't exist
```

**Solution:**
```bash
# Vérifier la structure de la base
mysql -u root -p 2024_bu01 -e "SHOW TABLES;"

# Appliquer manuellement si nécessaire
mysql -u root -p 2024_bu01 < migrations/versions/004_add_margin_column.sql

# Marquer comme appliquée
mysql -u root -p 2024_bu01 -e "INSERT INTO _migrations (version, description) VALUES ('004', 'add margin column');"
```

### Problème: Migration déjà appliquée mais marquée comme en attente

**Solution:**
```bash
# Vérifier le statut
mysql -u root -p 2024_bu01 -e "SELECT * FROM _migrations;"

# Marquer manuellement
mysql -u root -p 2024_bu01 -e "INSERT INTO _migrations (version, description) VALUES ('004', 'add margin column');"
```

### Problème: Erreur de connexion MySQL

**Vérifier:**
```bash
# Test de connexion
mysql -u root -p -e "SELECT 1;"

# Vérifier les variables d'environnement
echo $MYSQL_HOST
echo $MYSQL_USER
```

### Problème: Rollback nécessaire

**Solution:**
```sql
-- Créer une migration inverse
-- Fichier: 005_rollback_004.sql

-- Migration: 005_rollback_004
-- Description: Annuler ajout colonne marge
-- Date: 2025-02-09

ALTER TABLE bons_livraison DROP COLUMN IF EXISTS marge;
DROP INDEX IF EXISTS idx_marge ON bons_livraison;
```

---

## 📊 Suivi et monitoring

### Table _migrations

Chaque base contient une table `_migrations`:

```sql
SELECT * FROM _migrations ORDER BY applied_at DESC;
```

Résultat:
```
+----+---------+---------------------------+---------------------+-------------+
| id | version | description               | applied_at          | duration_ms |
+----+---------+---------------------------+---------------------+-------------+
|  4 | 004     | add margin column         | 2025-02-09 10:30:00 |         245 |
|  3 | 003     | add supplier invoice num  | 2025-02-08 15:20:00 |         198 |
|  2 | 002     | add payments support      | 2025-02-07 09:15:00 |         512 |
|  1 | 001     | initial schema            | 2025-02-06 14:00:00 |          89 |
+----+---------+---------------------------+---------------------+-------------+
```

### Logs

Les logs sont affichés en temps réel:
- ✅ Succès
- ⏭️  Ignorée (déjà appliquée)
- ❌ Erreur

---

## 🎓 Workflow recommandé

### Développement d'une nouvelle fonctionnalité

1. **Développer localement**
   ```bash
   # Créer la migration
   nano backend/migrations/versions/004_add_feature.sql
   
   # Tester sur une base de dev
   bun run migrations/apply-to-all-databases.ts --database=2025_bu01
   ```

2. **Vérifier**
   ```bash
   # Vérifier la structure
   mysql -u root -p 2025_bu01 -e "DESCRIBE table_name;"
   
   # Tester l'application
   cd frontend && npm run dev
   ```

3. **Commit**
   ```bash
   git add backend/migrations/versions/004_add_feature.sql
   git commit -m "feat: Add feature migration"
   git push
   ```

4. **Déployer en production**
   ```bash
   # Sur le serveur de production
   cd backend
   bun run migrations/apply-to-all-databases.ts
   ```

5. **Vérifier en production**
   - Accéder à l'interface web
   - Vérifier que toutes les bases sont à jour

---

## 📚 Ressources

- [Documentation MySQL ALTER TABLE](https://dev.mysql.com/doc/refman/8.0/en/alter-table.html)
- [Best Practices for Database Migrations](https://www.prisma.io/dataguide/types/relational/migration-strategies)
- [Idempotent Migrations](https://en.wikipedia.org/wiki/Idempotence)

---

## 🆘 Support

En cas de problème:
1. Vérifier les logs: `bun run migrations/test-migrations.ts`
2. Consulter la section Dépannage ci-dessus
3. Vérifier la structure de la base manuellement
4. Créer une migration de correction si nécessaire

---

**Dernière mise à jour:** 2025-02-09
**Version:** 1.0.0
