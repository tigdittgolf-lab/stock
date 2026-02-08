# 🚀 Guide d'installation Supabase - Système de paiements

## Votre configuration Supabase

**URL du projet** : https://szgodrjglbpzkrksnroi.supabase.co

---

## 📋 Étape 1 : Ouvrir l'éditeur SQL Supabase

### Option A : Via le Dashboard Web (Recommandé)

1. **Ouvrir Supabase Dashboard**
   - Allez sur : https://supabase.com/dashboard
   - Connectez-vous avec votre compte

2. **Sélectionner votre projet**
   - Cherchez le projet avec l'URL : `szgodrjglbpzkrksnroi.supabase.co`
   - Cliquez dessus pour l'ouvrir

3. **Ouvrir l'éditeur SQL**
   - Dans le menu de gauche, cliquez sur **"SQL Editor"** (icône 📝)
   - Ou allez directement sur : https://supabase.com/dashboard/project/szgodrjglbpzkrksnroi/sql

4. **Créer une nouvelle requête**
   - Cliquez sur **"New query"** en haut à droite
   - Ou utilisez le bouton **"+"**

---

## 📝 Étape 2 : Copier et exécuter le script SQL

### Copier le script

Le script se trouve dans : `backend/migrations/create_payments_table_supabase.sql`

**Contenu du script :**

```sql
-- Migration: Create payments table for Supabase (PostgreSQL)
-- Feature: client-payment-tracking

-- Drop table if exists (for clean reinstall)
DROP TABLE IF EXISTS payments CASCADE;

-- Create payments table
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    document_type VARCHAR(20) NOT NULL,
    document_id BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    
    -- Constraints
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_document_type CHECK (document_type IN ('delivery_note', 'invoice'))
);

-- Create indexes for performance
CREATE INDEX idx_payments_tenant_document ON payments(tenant_id, document_type, document_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Enable Row Level Security (RLS) for multi-tenant isolation
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
CREATE POLICY tenant_isolation_policy ON payments
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', TRUE));

-- Grant permissions
GRANT ALL ON payments TO authenticated;
GRANT ALL ON payments TO service_role;
GRANT USAGE, SELECT ON SEQUENCE payments_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE payments_id_seq TO service_role;

-- Verification query
SELECT 
    'Table created successfully!' as status,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'payments';
```

### Exécuter le script

1. **Coller le script** dans l'éditeur SQL de Supabase
2. **Cliquer sur "Run"** (ou appuyer sur `Ctrl+Enter` / `Cmd+Enter`)
3. **Vérifier le résultat** :
   - Vous devriez voir : `"Table created successfully!"` avec `column_count: 12`
   - Si vous voyez des erreurs, lisez la section "Dépannage" ci-dessous

---

## ✅ Étape 3 : Vérifier que la table est créée

### Via l'interface Supabase

1. **Aller dans "Table Editor"**
   - Menu de gauche → **"Table Editor"** (icône 📊)
   - Ou : https://supabase.com/dashboard/project/szgodrjglbpzkrksnroi/editor

2. **Chercher la table "payments"**
   - Vous devriez voir la table `payments` dans la liste
   - Cliquez dessus pour voir sa structure

3. **Vérifier les colonnes**
   - Vous devriez voir 12 colonnes :
     - `id` (bigint, primary key)
     - `tenant_id` (varchar)
     - `document_type` (varchar)
     - `document_id` (bigint)
     - `payment_date` (date)
     - `amount` (numeric)
     - `payment_method` (varchar)
     - `notes` (text)
     - `created_at` (timestamp)
     - `created_by` (bigint)
     - `updated_at` (timestamp)
     - `updated_by` (bigint)

### Via une requête SQL

Exécutez cette requête dans l'éditeur SQL :

```sql
-- Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;
```

---

## 🧪 Étape 4 : Tester avec des données

### Insérer un paiement de test

```sql
-- Insérer un paiement de test
INSERT INTO payments (
    tenant_id,
    document_type,
    document_id,
    payment_date,
    amount,
    payment_method,
    notes
) VALUES (
    '2025_bu01',
    'delivery_note',
    1,
    CURRENT_DATE,
    5000.00,
    'cash',
    'Test payment'
);

-- Vérifier l'insertion
SELECT * FROM payments;
```

### Tester les contraintes

```sql
-- Test 1: Montant négatif (devrait échouer)
INSERT INTO payments (tenant_id, document_type, document_id, payment_date, amount)
VALUES ('2025_bu01', 'delivery_note', 1, CURRENT_DATE, -100);
-- ❌ Erreur attendue: "violates check constraint chk_amount_positive"

-- Test 2: Type de document invalide (devrait échouer)
INSERT INTO payments (tenant_id, document_type, document_id, payment_date, amount)
VALUES ('2025_bu01', 'invalid_type', 1, CURRENT_DATE, 100);
-- ❌ Erreur attendue: "violates check constraint chk_document_type"

-- Test 3: Paiement valide (devrait réussir)
INSERT INTO payments (tenant_id, document_type, document_id, payment_date, amount)
VALUES ('2025_bu01', 'invoice', 2, CURRENT_DATE, 1000);
-- ✅ Devrait réussir
```

### Nettoyer les données de test

```sql
-- Supprimer les données de test
DELETE FROM payments WHERE notes = 'Test payment';
```

---

## 🔧 Étape 5 : Configurer les RLS (Row Level Security)

### Option 1 : Désactiver RLS pour les tests (Non recommandé en production)

```sql
-- Désactiver temporairement RLS pour les tests
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
```

### Option 2 : Configurer RLS correctement (Recommandé)

Si vous utilisez l'authentification Supabase, ajustez la politique RLS :

```sql
-- Supprimer la politique par défaut
DROP POLICY IF EXISTS tenant_isolation_policy ON payments;

-- Créer une politique basée sur l'utilisateur authentifié
CREATE POLICY user_tenant_policy ON payments
    FOR ALL
    USING (
        tenant_id = (
            SELECT raw_user_meta_data->>'tenant_id' 
            FROM auth.users 
            WHERE id = auth.uid()
        )
    );
```

### Option 3 : Utiliser le service_role (Pour l'API backend)

Dans votre code backend, utilisez la clé `service_role` qui bypass RLS :

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // ← Utilise service_role
);
```

---

## 🐛 Dépannage

### Erreur : "permission denied for table payments"

**Solution :** Exécutez les commandes GRANT :

```sql
GRANT ALL ON payments TO authenticated;
GRANT ALL ON payments TO service_role;
GRANT USAGE, SELECT ON SEQUENCE payments_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE payments_id_seq TO service_role;
```

### Erreur : "relation payments already exists"

**Solution :** La table existe déjà. Pour la recréer :

```sql
DROP TABLE IF EXISTS payments CASCADE;
-- Puis réexécutez le script complet
```

### Erreur : "RLS policy blocks access"

**Solution :** Désactivez temporairement RLS ou configurez-le correctement :

```sql
-- Option 1: Désactiver RLS
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Option 2: Créer une politique permissive pour les tests
DROP POLICY IF EXISTS tenant_isolation_policy ON payments;
CREATE POLICY allow_all_for_service_role ON payments
    FOR ALL
    TO service_role
    USING (true);
```

### La table n'apparaît pas dans Table Editor

**Solution :** 
1. Rafraîchissez la page (F5)
2. Vérifiez que vous êtes dans le bon projet
3. Exécutez cette requête pour confirmer :
   ```sql
   SELECT tablename FROM pg_tables WHERE tablename = 'payments';
   ```

---

## 📊 Étape 6 : Vérifier les index

```sql
-- Lister tous les index de la table payments
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'payments';
```

Vous devriez voir :
- `payments_pkey` (primary key sur id)
- `idx_payments_tenant_document`
- `idx_payments_payment_date`
- `idx_payments_tenant_id`

---

## 🎉 Étape 7 : Configuration terminée !

Une fois la table créée et testée, vous pouvez :

1. **Configurer le backend** pour utiliser Supabase
2. **Intégrer les composants frontend**
3. **Tester le système complet**

Suivez le guide : `INTEGRATION_GUIDE_STEP_BY_STEP.md`

---

## 📚 Ressources Supabase

- **Dashboard** : https://supabase.com/dashboard/project/szgodrjglbpzkrksnroi
- **SQL Editor** : https://supabase.com/dashboard/project/szgodrjglbpzkrksnroi/sql
- **Table Editor** : https://supabase.com/dashboard/project/szgodrjglbpzkrksnroi/editor
- **Documentation Supabase** : https://supabase.com/docs

---

## ✅ Checklist

- [ ] Script SQL copié dans l'éditeur Supabase
- [ ] Script exécuté avec succès
- [ ] Table `payments` visible dans Table Editor
- [ ] 12 colonnes présentes
- [ ] 4 index créés
- [ ] Trigger `updated_at` fonctionnel
- [ ] Paiement de test inséré et supprimé
- [ ] RLS configuré selon vos besoins

**Tout est prêt ? Passez à l'intégration avec `INTEGRATION_GUIDE_STEP_BY_STEP.md` !** 🚀
