# 🎯 PLAN DE MIGRATION MYSQL - SYSTÈME DE PAIEMENTS

**Date:** 10 février 2026  
**Statut:** ✅ Table créée, 🔧 APIs à adapter

---

## ✅ CE QUI EST FAIT

### 1. Base de données MySQL
- ✅ MySQL (WAMP) en cours d'exécution sur port 3307
- ✅ Base de données `stock_management` existe
- ✅ Table `payments` créée avec succès
- ✅ Structure validée:
  ```sql
  - id (BIGINT, AUTO_INCREMENT, PRIMARY KEY)
  - tenant_id (VARCHAR(50), NOT NULL)
  - document_type (VARCHAR(20), NOT NULL)
  - document_id (BIGINT, NOT NULL)
  - payment_date (DATE, NOT NULL)
  - amount (DECIMAL(15,2), NOT NULL)
  - payment_method (VARCHAR(50))
  - notes (TEXT)
  - created_at (TIMESTAMP)
  - created_by (BIGINT)
  - updated_at (TIMESTAMP)
  - updated_by (BIGINT)
  ```
- ✅ Indexes créés pour performance
- ✅ Contraintes de validation en place

### 2. Application Frontend
- ✅ Système multi-base de données configuré
- ✅ Adaptateur MySQL existant (`MySQLAdapter`)
- ✅ Système de paiements fonctionnel avec Supabase

---

## 🔧 CE QU'IL RESTE À FAIRE

### Étape 1: Adapter les APIs de paiements pour MySQL

#### A. Modifier `/api/payments/route.ts`
**Fichier:** `frontend/app/api/payments/route.ts`

**Changements nécessaires:**
1. Remplacer l'import Supabase par une connexion MySQL dynamique
2. Utiliser le `database-manager` pour détecter la base active
3. Adapter les requêtes SQL pour MySQL

**Code à modifier:**
```typescript
// AVANT (Supabase uniquement)
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(...);

// APRÈS (Multi-base de données)
import { databaseManager } from '@/lib/database/database-manager';
const adapter = databaseManager.getCurrentAdapter();
```

#### B. Modifier `/api/payments/balance/route.ts`
**Fichier:** `frontend/app/api/payments/balance/route.ts`

**Fonction:** Calculer le solde d'un document (montant total - montants payés)

**Requête SQL MySQL:**
```sql
SELECT 
  COALESCE(SUM(amount), 0) as total_paid
FROM payments
WHERE tenant_id = ? 
  AND document_type = ? 
  AND document_id = ?
```

#### C. Modifier `/api/payments/outstanding/route.ts`
**Fichier:** `frontend/app/api/payments/outstanding/route.ts`

**Fonction:** Lister tous les documents impayés ou partiellement payés

**Requête SQL MySQL complexe:**
```sql
-- Récupérer les BLs avec leurs paiements
SELECT 
  bl.nfact as document_id,
  'delivery_note' as document_type,
  bl.date_bl as document_date,
  bl.nclient,
  client.nom as client_name,
  bl.total_ttc as total_amount,
  COALESCE(SUM(p.amount), 0) as paid_amount,
  (bl.total_ttc - COALESCE(SUM(p.amount), 0)) as balance
FROM bl
LEFT JOIN payments p ON p.document_id = bl.nfact 
  AND p.document_type = 'delivery_note'
  AND p.tenant_id = ?
LEFT JOIN client ON client.nclient = bl.nclient
WHERE bl.total_ttc > COALESCE(SUM(p.amount), 0)
GROUP BY bl.nfact
ORDER BY bl.date_bl DESC
```

#### D. Modifier `/api/payments/[id]/route.ts`
**Fichier:** `frontend/app/api/payments/[id]/route.ts`

**Fonctions:** PUT (modifier), DELETE (supprimer)

**Requêtes SQL MySQL:**
```sql
-- UPDATE
UPDATE payments 
SET payment_date = ?, 
    amount = ?, 
    payment_method = ?, 
    notes = ?,
    updated_at = NOW()
WHERE id = ? AND tenant_id = ?

-- DELETE
DELETE FROM payments 
WHERE id = ? AND tenant_id = ?
```

---

### Étape 2: Créer une API MySQL générique

#### Créer `/api/database/mysql/route.ts`
**Fichier:** `frontend/app/api/database/mysql/route.ts`

**Fonction:** Exécuter des requêtes SQL MySQL depuis le frontend

**Code de base:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request: NextRequest) {
  try {
    const { config, sql, params } = await request.json();
    
    // Créer la connexion MySQL
    const connection = await mysql.createConnection({
      host: config.host || 'localhost',
      port: config.port || 3307,
      user: config.user || 'root',
      password: config.password || '',
      database: config.database || 'stock_management'
    });
    
    // Exécuter la requête
    const [rows] = await connection.execute(sql, params || []);
    
    await connection.end();
    
    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

---

### Étape 3: Tester le système avec MySQL

#### A. Configurer l'application pour utiliser MySQL
1. Ouvrir l'application: `http://localhost:3000`
2. Aller dans **Paramètres** > **Configuration Base de Données**
3. Sélectionner **MySQL Local**
4. Configurer:
   ```
   Host: localhost
   Port: 3307
   Database: stock_management
   User: root
   Password: (vide)
   ```
5. Cliquer sur **Tester la connexion**
6. Cliquer sur **Activer cette base**

#### B. Tester les paiements
1. Aller sur un bon de livraison
2. Cliquer sur **"💰 Enregistrer un paiement"**
3. Remplir le formulaire
4. Vérifier que le paiement est enregistré dans MySQL

#### C. Vérifier dans MySQL
```sql
-- Voir tous les paiements
SELECT * FROM stock_management.payments;

-- Voir les paiements d'un document
SELECT * FROM stock_management.payments 
WHERE document_type = 'delivery_note' 
  AND document_id = 1;

-- Calculer le solde d'un document
SELECT 
  SUM(amount) as total_paid
FROM stock_management.payments
WHERE document_type = 'delivery_note' 
  AND document_id = 1
  AND tenant_id = '2025_bu01';
```

---

### Étape 4: Migrer les données existantes (optionnel)

Si vous avez des paiements dans Supabase à migrer vers MySQL:

```sql
-- Script de migration (à exécuter après export depuis Supabase)
INSERT INTO stock_management.payments 
  (tenant_id, document_type, document_id, payment_date, amount, payment_method, notes, created_at)
VALUES
  ('2025_bu01', 'delivery_note', 1, '2026-02-08', 5000.00, 'Espèces', 'Premier paiement', NOW()),
  ('2025_bu01', 'delivery_note', 2, '2026-02-09', 10000.00, 'Chèque', 'Paiement complet', NOW());
```

---

## 📊 RÉSUMÉ DES FICHIERS À MODIFIER

| Fichier | Action | Priorité |
|---------|--------|----------|
| `frontend/app/api/payments/route.ts` | Adapter pour MySQL | 🔴 Haute |
| `frontend/app/api/payments/balance/route.ts` | Adapter pour MySQL | 🔴 Haute |
| `frontend/app/api/payments/outstanding/route.ts` | Adapter pour MySQL | 🔴 Haute |
| `frontend/app/api/payments/[id]/route.ts` | Adapter pour MySQL | 🟡 Moyenne |
| `frontend/app/api/database/mysql/route.ts` | Créer (si n'existe pas) | 🔴 Haute |

---

## 🎯 PROCHAINE ACTION IMMÉDIATE

**Voulez-vous que je:**

1. ✅ **Modifier les APIs de paiements** pour supporter MySQL (recommandé)
2. 📝 **Créer un script de test** pour vérifier que tout fonctionne
3. 🔄 **Migrer les données** existantes de Supabase vers MySQL
4. 📚 **Créer une documentation** complète du système

**Répondez avec le numéro de votre choix, et je procède immédiatement!**

---

## 💡 NOTES IMPORTANTES

### Configuration actuelle
- **MySQL:** localhost:3307 (WAMP)
- **Base:** stock_management
- **Table:** payments ✅
- **User:** root (sans mot de passe)

### Avantages de MySQL local
- ✅ Pas de dépendance internet
- ✅ Contrôle total des données
- ✅ Performance optimale
- ✅ Pas de coûts cloud

### Points d'attention
- ⚠️ Sauvegardes régulières nécessaires
- ⚠️ Sécuriser l'accès MySQL (ajouter mot de passe root)
- ⚠️ Configurer les backups automatiques

---

**Prêt à continuer? Dites-moi quelle étape vous voulez que je fasse!** 🚀
