# 🚀 Guide d'intégration Supabase - Système de paiements

Ce guide explique comment intégrer le système de paiements avec Supabase.

## 📋 Prérequis

- Compte Supabase actif
- Projet Supabase créé
- Clés API Supabase (URL + Service Role Key)

---

## ✅ ÉTAPE 1 : Exécuter la migration Supabase

### Option A : Via l'interface Supabase (Recommandé)

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur "SQL Editor" dans le menu de gauche
4. Cliquez sur "New Query"
5. Copiez tout le contenu de `backend/migrations/create_payments_table_supabase.sql`
6. Collez-le dans l'éditeur
7. Cliquez sur "Run" (ou Ctrl+Enter)

### Option B : Via la CLI Supabase

```bash
# Installer la CLI Supabase si pas déjà fait
npm install -g supabase

# Se connecter
supabase login

# Lier votre projet
supabase link --project-ref your-project-ref

# Exécuter la migration
supabase db push backend/migrations/create_payments_table_supabase.sql
```

### Vérification

Après l'exécution, vous devriez voir :
- ✅ Table `payments` créée
- ✅ 7 fonctions RPC créées
- ✅ Indexes créés
- ✅ Trigger `updated_at` créé
- ✅ Permissions accordées

---

## ✅ ÉTAPE 2 : Créer un adapter Supabase pour le frontend

Créez le fichier `frontend/lib/supabase-payment-adapter.ts` :

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Adapter pour les paiements
export const paymentAdapter = {
    // Créer un paiement
    async createPayment(data: {
        tenantId: string;
        documentType: 'delivery_note' | 'invoice';
        documentId: number;
        paymentDate: string;
        amount: number;
        paymentMethod?: string;
        notes?: string;
    }) {
        const { data: result, error } = await supabase.rpc('create_payment', {
            p_tenant_id: data.tenantId,
            p_document_type: data.documentType,
            p_document_id: data.documentId,
            p_payment_date: data.paymentDate,
            p_amount: data.amount,
            p_payment_method: data.paymentMethod,
            p_notes: data.notes
        });

        if (error) throw error;
        return result;
    },

    // Récupérer les paiements d'un document
    async getPaymentsByDocument(
        tenantId: string,
        documentType: 'delivery_note' | 'invoice',
        documentId: number
    ) {
        const { data: result, error } = await supabase.rpc('get_payments_by_document', {
            p_tenant_id: tenantId,
            p_document_type: documentType,
            p_document_id: documentId
        });

        if (error) throw error;
        return result;
    },

    // Récupérer un paiement par ID
    async getPaymentById(paymentId: number, tenantId: string) {
        const { data: result, error } = await supabase.rpc('get_payment_by_id', {
            p_payment_id: paymentId,
            p_tenant_id: tenantId
        });

        if (error) throw error;
        return result;
    },

    // Mettre à jour un paiement
    async updatePayment(
        paymentId: number,
        tenantId: string,
        updates: {
            paymentDate?: string;
            amount?: number;
            paymentMethod?: string;
            notes?: string;
        }
    ) {
        const { data: result, error } = await supabase.rpc('update_payment', {
            p_payment_id: paymentId,
            p_tenant_id: tenantId,
            p_payment_date: updates.paymentDate,
            p_amount: updates.amount,
            p_payment_method: updates.paymentMethod,
            p_notes: updates.notes
        });

        if (error) throw error;
        return result;
    },

    // Supprimer un paiement
    async deletePayment(paymentId: number, tenantId: string) {
        const { data: result, error } = await supabase.rpc('delete_payment', {
            p_payment_id: paymentId,
            p_tenant_id: tenantId
        });

        if (error) throw error;
        return result;
    },

    // Calculer le solde d'un document
    async getDocumentBalance(
        tenantId: string,
        documentType: 'delivery_note' | 'invoice',
        documentId: number
    ) {
        const { data: result, error } = await supabase.rpc('get_document_balance', {
            p_tenant_id: tenantId,
            p_document_type: documentType,
            p_document_id: documentId
        });

        if (error) throw error;
        return result;
    },

    // Récupérer les soldes impayés
    async getOutstandingBalances(
        tenantId: string,
        filters?: {
            documentType?: 'delivery_note' | 'invoice';
            clientId?: number;
        },
        sorting?: {
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        }
    ) {
        const { data: result, error } = await supabase.rpc('get_outstanding_balances', {
            p_tenant_id: tenantId,
            p_document_type: filters?.documentType,
            p_client_id: filters?.clientId,
            p_sort_by: sorting?.sortBy || 'balance',
            p_sort_order: sorting?.sortOrder || 'desc'
        });

        if (error) throw error;
        return result;
    }
};
```

---

## ✅ ÉTAPE 3 : Modifier les composants pour utiliser Supabase

### Option A : Modifier les composants existants

Dans chaque composant (`PaymentForm.tsx`, `PaymentHistory.tsx`, etc.), remplacez les appels `fetch('/api/payments/...')` par des appels à `paymentAdapter`.

**Exemple dans PaymentForm.tsx :**

```typescript
// Avant
const response = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ... })
});

// Après
import { paymentAdapter } from '@/lib/supabase-payment-adapter';

const result = await paymentAdapter.createPayment({
    tenantId: tenant?.id,
    documentType,
    documentId,
    paymentDate,
    amount: parseFloat(amount),
    paymentMethod,
    notes
});
```

### Option B : Créer des routes API Next.js qui utilisent Supabase

Gardez les composants tels quels et créez des routes API qui appellent Supabase :

**`frontend/app/api/payments/route.ts` :**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { paymentAdapter } from '@/lib/supabase-payment-adapter';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const tenantId = request.headers.get('X-Tenant') || '2025_bu01';
        
        const result = await paymentAdapter.createPayment({
            tenantId,
            ...body
        });
        
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = request.headers.get('X-Tenant') || '2025_bu01';
        const documentType = searchParams.get('documentType') as any;
        const documentId = parseInt(searchParams.get('documentId') || '0');
        
        const result = await paymentAdapter.getPaymentsByDocument(
            tenantId,
            documentType,
            documentId
        );
        
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
```

**Avantage de l'Option B :** Vous n'avez pas besoin de modifier les composants existants !

---

## ✅ ÉTAPE 4 : Configurer les variables d'environnement

Ajoutez dans votre `.env.local` :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## ✅ ÉTAPE 5 : Tester avec Supabase

### Test 1 : Vérifier la table

Dans Supabase SQL Editor :

```sql
SELECT * FROM payments LIMIT 10;
```

### Test 2 : Tester une fonction RPC

Dans Supabase SQL Editor :

```sql
SELECT create_payment(
    '2025_bu01',           -- tenant_id
    'delivery_note',       -- document_type
    1,                     -- document_id
    CURRENT_DATE,          -- payment_date
    5000.00,              -- amount
    'cash',               -- payment_method
    'Test payment'        -- notes
);
```

### Test 3 : Tester depuis le frontend

```typescript
import { paymentAdapter } from '@/lib/supabase-payment-adapter';

// Test de création
const result = await paymentAdapter.createPayment({
    tenantId: '2025_bu01',
    documentType: 'delivery_note',
    documentId: 1,
    paymentDate: '2024-01-15',
    amount: 5000,
    paymentMethod: 'cash',
    notes: 'Test'
});

console.log('Payment created:', result);
```

---

## 🔒 ÉTAPE 6 : Sécurité avec Row Level Security (RLS)

La migration active automatiquement RLS. Pour le configurer correctement :

### 1. Définir le tenant actuel

Dans votre middleware d'authentification :

```typescript
// Après l'authentification
await supabase.rpc('set_config', {
    setting: 'app.current_tenant',
    value: userTenantId
});
```

### 2. Vérifier l'isolation

```sql
-- En tant que tenant A
SET app.current_tenant = '2025_bu01';
SELECT * FROM payments; -- Voit seulement les paiements de bu01

-- En tant que tenant B
SET app.current_tenant = '2025_bu02';
SELECT * FROM payments; -- Voit seulement les paiements de bu02
```

---

## 📊 Fonctions RPC disponibles

| Fonction | Description | Paramètres |
|----------|-------------|------------|
| `create_payment` | Créer un paiement | tenant_id, document_type, document_id, payment_date, amount, payment_method, notes |
| `get_payments_by_document` | Liste des paiements d'un document | tenant_id, document_type, document_id |
| `get_payment_by_id` | Détail d'un paiement | payment_id, tenant_id |
| `update_payment` | Modifier un paiement | payment_id, tenant_id, payment_date, amount, payment_method, notes |
| `delete_payment` | Supprimer un paiement | payment_id, tenant_id |
| `get_document_balance` | Calculer le solde | tenant_id, document_type, document_id |
| `get_outstanding_balances` | Dashboard des impayés | tenant_id, document_type, client_id, sort_by, sort_order |

---

## 🎯 Avantages de l'approche Supabase

✅ **Pas besoin de serveur backend** - Tout est géré par Supabase
✅ **Temps réel** - Possibilité d'ajouter des subscriptions
✅ **Sécurité** - RLS intégré
✅ **Performance** - Fonctions RPC optimisées
✅ **Scalabilité** - Infrastructure gérée par Supabase

---

## 🔄 Migration depuis MySQL vers Supabase

Si vous utilisez déjà MySQL et voulez migrer vers Supabase :

### 1. Exporter les données MySQL

```bash
mysqldump -u root -p stock_management payments > payments_backup.sql
```

### 2. Convertir et importer dans Supabase

```sql
-- Dans Supabase SQL Editor
-- Copiez vos données en adaptant le format
INSERT INTO payments (tenant_id, document_type, document_id, ...)
VALUES (...);
```

### 3. Vérifier les données

```sql
SELECT COUNT(*) FROM payments;
```

---

## 🐛 Dépannage Supabase

### Erreur : "function does not exist"

**Solution :** Vérifiez que vous avez bien exécuté le script de migration complet.

### Erreur : "permission denied"

**Solution :** Vérifiez les permissions dans la section GRANT du script.

### Erreur : "RLS policy violation"

**Solution :** Désactivez temporairement RLS pour tester :

```sql
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
```

### Les fonctions RPC ne retournent rien

**Solution :** Vérifiez que vous passez les bons paramètres avec les bons noms (p_tenant_id, etc.).

---

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

---

## ✅ Checklist Supabase

- [ ] Migration SQL exécutée dans Supabase
- [ ] Table `payments` créée
- [ ] 7 fonctions RPC créées
- [ ] Adapter Supabase créé (`supabase-payment-adapter.ts`)
- [ ] Variables d'environnement configurées
- [ ] Routes API créées (Option B) OU composants modifiés (Option A)
- [ ] Tests RPC réussis
- [ ] RLS configuré (optionnel)
- [ ] Composants frontend fonctionnels

---

## 🎉 Félicitations !

Votre système de paiements est maintenant intégré avec Supabase ! Vous bénéficiez de :
- Infrastructure serverless
- Temps réel (si vous ajoutez des subscriptions)
- Sécurité RLS
- Scalabilité automatique

**Prochaine étape :** Testez en créant un paiement depuis votre interface !
