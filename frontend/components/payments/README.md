# Payment Tracking Components

Ce dossier contient tous les composants React pour le système de suivi des paiements clients.

## Composants disponibles

### 1. PaymentForm
Formulaire pour enregistrer un nouveau paiement.

**Props:**
```typescript
{
    documentType: 'delivery_note' | 'invoice';
    documentId: number;
    documentNumber: string;
    documentTotalAmount: number;
    currentBalance?: number;
    onSuccess: () => void;
    onCancel: () => void;
}
```

**Exemple d'utilisation:**
```tsx
import PaymentForm from '@/components/payments/PaymentForm';

<PaymentForm
    documentType="delivery_note"
    documentId={123}
    documentNumber="BL-2024-001"
    documentTotalAmount={15000}
    onSuccess={() => {
        // Rafraîchir les données
        fetchPayments();
    }}
    onCancel={() => {
        // Fermer le modal
        setShowPaymentForm(false);
    }}
/>
```

### 2. PaymentHistory
Affiche l'historique complet des paiements avec possibilité de modifier/supprimer.

**Props:**
```typescript
{
    documentType: 'delivery_note' | 'invoice';
    documentId: number;
    onPaymentChange?: () => void;
}
```

**Exemple d'utilisation:**
```tsx
import PaymentHistory from '@/components/payments/PaymentHistory';

<PaymentHistory
    documentType="invoice"
    documentId={456}
    onPaymentChange={() => {
        // Rafraîchir le résumé des paiements
        refreshPaymentSummary();
    }}
/>
```

### 3. PaymentSummary
Widget compact affichant le statut de paiement d'un document.

**Props:**
```typescript
{
    documentType: 'delivery_note' | 'invoice';
    documentId: number;
    totalAmount: number;
    onViewHistory?: () => void;
    refreshTrigger?: number;
}
```

**Exemple d'utilisation:**
```tsx
import PaymentSummary from '@/components/payments/PaymentSummary';

<PaymentSummary
    documentType="delivery_note"
    documentId={789}
    totalAmount={25000}
    onViewHistory={() => {
        // Ouvrir le modal d'historique
        setShowHistory(true);
    }}
    refreshTrigger={refreshCounter}
/>
```

### 4. Outstanding Balances Dashboard
Page complète pour voir tous les documents avec soldes impayés.

**Route:** `/payments/outstanding`

Aucune prop nécessaire - la page gère tout en interne.

## Intégration dans les pages existantes

### Page de détail d'un bon de livraison

```tsx
// frontend/app/delivery-notes/[id]/page.tsx

'use client';

import { useState } from 'react';
import PaymentSummary from '@/components/payments/PaymentSummary';
import PaymentForm from '@/components/payments/PaymentForm';
import PaymentHistory from '@/components/payments/PaymentHistory';

export default function DeliveryNoteDetailPage({ params }: { params: { id: string } }) {
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    // ... votre code existant pour charger le BL
    
    return (
        <div>
            {/* Votre contenu existant */}
            
            {/* Widget de résumé des paiements */}
            <PaymentSummary
                documentType="delivery_note"
                documentId={parseInt(params.id)}
                totalAmount={deliveryNote.montant_total}
                onViewHistory={() => setShowHistory(true)}
                refreshTrigger={refreshTrigger}
            />
            
            {/* Bouton pour ajouter un paiement */}
            <button onClick={() => setShowPaymentForm(true)}>
                💰 Enregistrer un paiement
            </button>
            
            {/* Modal de formulaire de paiement */}
            {showPaymentForm && (
                <div className="modal">
                    <PaymentForm
                        documentType="delivery_note"
                        documentId={parseInt(params.id)}
                        documentNumber={deliveryNote.numero}
                        documentTotalAmount={deliveryNote.montant_total}
                        onSuccess={() => {
                            setShowPaymentForm(false);
                            setRefreshTrigger(prev => prev + 1);
                        }}
                        onCancel={() => setShowPaymentForm(false)}
                    />
                </div>
            )}
            
            {/* Modal d'historique des paiements */}
            {showHistory && (
                <div className="modal">
                    <PaymentHistory
                        documentType="delivery_note"
                        documentId={parseInt(params.id)}
                        onPaymentChange={() => setRefreshTrigger(prev => prev + 1)}
                    />
                    <button onClick={() => setShowHistory(false)}>Fermer</button>
                </div>
            )}
        </div>
    );
}
```

### Page de détail d'une facture

```tsx
// frontend/app/invoices/[id]/page.tsx

// Même structure que pour les bons de livraison
// Remplacer documentType="delivery_note" par documentType="invoice"
```

### Ajouter un lien dans le menu principal

```tsx
// frontend/components/Navigation.tsx ou Sidebar.tsx

<Link href="/payments/outstanding">
    💰 Soldes impayés
</Link>
```

## API Endpoints utilisés

Les composants utilisent les endpoints suivants :

- `POST /api/payments` - Créer un paiement
- `GET /api/payments?documentType={type}&documentId={id}` - Liste des paiements
- `GET /api/payments/:id` - Détail d'un paiement
- `PUT /api/payments/:id` - Modifier un paiement
- `DELETE /api/payments/:id` - Supprimer un paiement
- `GET /api/payments/balance?documentType={type}&documentId={id}` - Solde d'un document
- `GET /api/payments/outstanding` - Dashboard des soldes impayés

## Configuration requise

### Backend

1. Exécuter les migrations de base de données :
```bash
# MySQL
mysql -u root -p < backend/migrations/create_payments_table_mysql.sql

# PostgreSQL
psql -U postgres -d stock_management < backend/migrations/create_payments_table_postgresql.sql
```

2. Ajouter les routes dans votre serveur Express :
```typescript
import { createPaymentRoutes } from './routes/payments';
import { MySQLPaymentRepository } from './repositories/PaymentRepository';

const paymentRepository = new MySQLPaymentRepository(mysqlPool);
app.use('/api/payments', createPaymentRoutes(paymentRepository));
```

### Frontend

Les composants sont prêts à l'emploi. Assurez-vous que :
- Votre middleware d'authentification définit `req.tenantId` et `req.userId`
- Les routes API sont correctement configurées
- Les styles CSS modules sont supportés par votre configuration Next.js

## Styles

Chaque composant a son propre fichier CSS module :
- `PaymentForm.module.css`
- `PaymentHistory.module.css`
- `PaymentSummary.module.css`
- `page.module.css` (pour le dashboard)

Les styles sont isolés et ne causeront pas de conflits avec vos styles existants.

## Support multi-tenant

Tous les composants et endpoints respectent l'isolation des tenants :
- Les paiements sont automatiquement associés au tenant du document
- Les requêtes filtrent toujours par `tenant_id`
- Aucun accès cross-tenant n'est possible

## Prochaines étapes

1. ✅ Exécuter les migrations de base de données
2. ✅ Configurer les routes API backend
3. ⏳ Intégrer PaymentSummary dans les pages de détail
4. ⏳ Ajouter les boutons "Enregistrer un paiement"
5. ⏳ Ajouter le lien vers le dashboard dans le menu
6. ⏳ Tester avec des données réelles
