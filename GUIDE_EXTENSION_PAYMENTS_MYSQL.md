# Guide d'extension de la table payments pour MySQL

## Problème
La syntaxe `ALTER TABLE payments DROP CHECK` ne fonctionne pas directement en MySQL car le nom de la contrainte est généré automatiquement.

## Solutions

### Solution 1: Modification de la contrainte (Recommandée)

**Fichier**: `EXTEND_PAYMENTS_FOR_PURCHASES_MYSQL.sql`

#### Étapes:

1. **Trouver le nom de la contrainte**:
```sql
SELECT CONSTRAINT_NAME 
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'payments' 
  AND CONSTRAINT_TYPE = 'CHECK' 
  AND CONSTRAINT_NAME LIKE '%document_type%';
```

2. **Supprimer la contrainte** (remplacer `payments_chk_1` par le nom trouvé):
```sql
ALTER TABLE payments DROP CHECK payments_chk_1;
```

3. **Ajouter la nouvelle contrainte**:
```sql
ALTER TABLE payments ADD CONSTRAINT chk_document_type 
CHECK (document_type IN (
    'delivery_note',
    'invoice',
    'purchase_delivery_note',
    'purchase_invoice'
));
```

### Solution 2: Recréer la table (Alternative)

**Fichier**: `EXTEND_PAYMENTS_ALTERNATIVE_MYSQL.sql`

⚠️ **ATTENTION**: Cette méthode supprime et recrée la table. Sauvegardez vos données!

#### Étapes:

1. Sauvegarder les données
2. Supprimer l'ancienne table
3. Recréer avec la nouvelle contrainte
4. Restaurer les données

### Solution 3: Sans contrainte CHECK (Plus simple)

Si les contraintes CHECK posent problème, vous pouvez simplement les ignorer et gérer la validation côté application:

```sql
-- Supprimer toutes les contraintes CHECK
ALTER TABLE payments DROP CHECK payments_chk_1;
ALTER TABLE payments DROP CHECK payments_chk_2;

-- L'application gérera la validation des types de documents
```

## Vérification

Après l'extension, testez avec:

```sql
-- Test insertion BL achat
INSERT INTO payments (tenant_id, document_type, document_id, payment_date, amount)
VALUES ('2009_bu02', 'purchase_delivery_note', 1, CURDATE(), 100.00);

-- Test insertion facture achat
INSERT INTO payments (tenant_id, document_type, document_id, payment_date, amount)
VALUES ('2009_bu02', 'purchase_invoice', 1, CURDATE(), 200.00);

-- Vérifier
SELECT * FROM payments WHERE document_type LIKE 'purchase%';

-- Nettoyer les tests
DELETE FROM payments WHERE document_type LIKE 'purchase%' AND amount IN (100, 200);
```

## Recommandation

Pour MySQL, je recommande la **Solution 1** car elle préserve l'intégrité des données et la structure de la table.

Si vous rencontrez des difficultés, utilisez la **Solution 3** (sans contrainte CHECK) - l'application validera les types de documents.
