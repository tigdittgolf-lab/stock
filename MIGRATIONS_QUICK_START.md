# 🚀 Quick Start: Migrations Multi-Bases

## En 3 étapes

### 1️⃣ Créer une migration

Créez un fichier dans `backend/migrations/versions/`:

```sql
-- Fichier: 004_add_margin_column.sql

-- Migration: 004_add_margin_column
-- Description: Ajouter colonne marge
-- Date: 2025-02-09

ALTER TABLE bons_livraison 
ADD COLUMN IF NOT EXISTS marge DECIMAL(10,2) DEFAULT 0;
```

### 2️⃣ Appliquer à toutes les bases

**Option A: Interface Web (Recommandé)**
```
http://localhost:3000/admin/migrations
→ Cliquer sur "Appliquer les migrations"
```

**Option B: Ligne de commande**
```bash
cd backend
bun run migrations/apply-to-all-databases.ts
```

### 3️⃣ Vérifier

```bash
# Voir le statut
bun run migrations/apply-to-all-databases.ts --status
```

---

## Commandes utiles

```bash
# Appliquer à une base spécifique
bun run migrations/apply-to-all-databases.ts --database=2025_bu01

# Tester le système
bun run migrations/test-migrations.ts

# Voir le statut via API
curl http://localhost:3005/api/migrations/status
```

---

## Format des migrations

```sql
-- Migration: XXX_description
-- Description: Description détaillée
-- Date: YYYY-MM-DD

-- Votre SQL ici
ALTER TABLE table_name ADD COLUMN ...;
CREATE INDEX ...;
```

**Important:**
- Numérotation séquentielle (001, 002, 003...)
- Utiliser `IF NOT EXISTS` pour l'idempotence
- Tester sur une base avant d'appliquer à toutes

---

## Que fait le système?

1. ✅ Lit tous les fichiers `.sql` dans `versions/`
2. ✅ Trouve toutes les bases MySQL (format: `YYYY_buXX`)
3. ✅ Vérifie quelles migrations sont déjà appliquées
4. ✅ Applique les migrations manquantes
5. ✅ Enregistre dans la table `_migrations`
6. ✅ Rollback automatique en cas d'erreur

---

## Exemple complet

```bash
# 1. Créer la migration
cat > backend/migrations/versions/004_add_margin.sql << 'EOF'
-- Migration: 004_add_margin
-- Description: Ajouter colonne marge
-- Date: 2025-02-09

ALTER TABLE bons_livraison 
ADD COLUMN IF NOT EXISTS marge DECIMAL(10,2) DEFAULT 0;
EOF

# 2. Appliquer
cd backend
bun run migrations/apply-to-all-databases.ts

# 3. Vérifier
mysql -u root -p 2025_bu01 -e "DESCRIBE bons_livraison;"
```

---

## Résultat attendu

```
🚀 Gestionnaire de Migrations Multi-Bases
=========================================

📊 Bases de données trouvées: 4
   - 2024_bu01
   - 2024_bu02
   - 2025_bu01
   - 2025_bu02

📦 Migrations trouvées: 4
   - 004: add margin

🔄 Traitement de 2024_bu01...
   ✅ Appliquée (245ms)

🔄 Traitement de 2024_bu02...
   ✅ Appliquée (198ms)

...

🎉 Toutes les migrations ont été appliquées avec succès!
```

---

**Guide complet:** Voir `GUIDE_MIGRATIONS_MULTI_BASES.md`
