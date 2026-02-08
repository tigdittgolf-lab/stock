# 🚀 Démarrage rapide - Système de paiements

## En 5 minutes chrono ⏱️

### 1. Exécuter la migration (30 secondes)

```bash
mysql -u root -p stock_management < backend/migrations/create_payments_table_mysql.sql
```

### 2. Configurer le backend (2 minutes)

Dans votre fichier serveur principal (ex: `backend/server.ts`), ajoutez :

```typescript
import { createPaymentRoutes } from './routes/payments';
import { MySQLPaymentRepository } from './repositories/PaymentRepository';

const paymentRepository = new MySQLPaymentRepository(mysqlPool);
app.use('/api/payments', createPaymentRoutes(paymentRepository));
```

### 3. Intégrer dans une page (2 minutes)

Dans `frontend/app/delivery-notes/[id]/page.tsx` :

```typescript
// 1. Imports
import PaymentSummary from '@/components/payments/PaymentSummary';

// 2. Dans le JSX, avant l'en-tête du document
<PaymentSummary
    documentType="delivery_note"
    documentId={deliveryNote.nbl}
    totalAmount={deliveryNote.montant_ttc}
/>
```

### 4. Tester (30 secondes)

```bash
node test-payment-system.js
```

---

## 📁 Fichiers créés

### Backend
- ✅ `backend/migrations/create_payments_table_mysql.sql`
- ✅ `backend/migrations/create_payments_table_postgresql.sql`
- ✅ `backend/types/payment.types.ts`
- ✅ `backend/services/PaymentValidator.ts`
- ✅ `backend/services/BalanceCalculator.ts`
- ✅ `backend/services/PaymentStatusClassifier.ts`
- ✅ `backend/repositories/PaymentRepository.ts`
- ✅ `backend/routes/payments.ts`

### Frontend
- ✅ `frontend/components/payments/PaymentForm.tsx`
- ✅ `frontend/components/payments/PaymentForm.module.css`
- ✅ `frontend/components/payments/PaymentHistory.tsx`
- ✅ `frontend/components/payments/PaymentHistory.module.css`
- ✅ `frontend/components/payments/PaymentSummary.tsx`
- ✅ `frontend/components/payments/PaymentSummary.module.css`
- ✅ `frontend/app/payments/outstanding/page.tsx`
- ✅ `frontend/app/payments/outstanding/page.module.css`

### Documentation
- ✅ `PAYMENT_TRACKING_IMPLEMENTATION_SUMMARY.md` - Vue d'ensemble complète
- ✅ `INTEGRATION_GUIDE_STEP_BY_STEP.md` - Guide détaillé étape par étape
- ✅ `frontend/components/payments/README.md` - Documentation des composants
- ✅ `QUICK_START_PAYMENTS.md` - Ce fichier (démarrage rapide)

### Exemples
- ✅ `frontend/app/delivery-notes/[id]/page-with-payments.tsx` - Exemple complet
- ✅ `test-payment-system.js` - Script de test automatique

---

## 🎯 Fonctionnalités disponibles

### ✅ Enregistrement des paiements
- Montant, date, mode de paiement, notes
- Validation automatique
- Paiements échelonnés

### ✅ Calcul automatique des soldes
- Total payé
- Solde restant
- Pourcentage payé

### ✅ Statuts visuels
- 🔴 Non payé
- 🟡 Partiellement payé
- 🟢 Payé
- 🔵 Trop-perçu

### ✅ Historique complet
- Liste de tous les paiements
- Modification inline
- Suppression avec confirmation

### ✅ Dashboard de suivi
- Vue d'ensemble des impayés
- Filtres par type et client
- Tri par solde, date, client
- Statistiques globales

---

## 📊 Endpoints API disponibles

```
POST   /api/payments                    - Créer un paiement
GET    /api/payments?documentType&documentId  - Liste des paiements
GET    /api/payments/:id                - Détail d'un paiement
PUT    /api/payments/:id                - Modifier un paiement
DELETE /api/payments/:id                - Supprimer un paiement
GET    /api/payments/balance            - Solde d'un document
GET    /api/payments/outstanding        - Dashboard des impayés
```

---

## 🔧 Configuration minimale requise

### Backend
- Node.js 18+
- MySQL 5.7+ ou PostgreSQL 12+
- Express.js

### Frontend
- Next.js 14+
- React 18+
- TypeScript

---

## 💡 Exemples d'utilisation

### Créer un paiement

```typescript
const response = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        documentType: 'delivery_note',
        documentId: 123,
        paymentDate: '2024-01-15',
        amount: 5000,
        paymentMethod: 'cash',
        notes: 'Premier paiement'
    })
});
```

### Afficher le widget de paiement

```tsx
<PaymentSummary
    documentType="delivery_note"
    documentId={123}
    totalAmount={15000}
    onViewHistory={() => setShowHistory(true)}
/>
```

### Afficher l'historique

```tsx
<PaymentHistory
    documentType="invoice"
    documentId={456}
    onPaymentChange={() => refreshData()}
/>
```

---

## 🐛 Problèmes courants

### "Table 'payments' doesn't exist"
➡️ Exécutez la migration (Étape 1)

### "404 Not Found" sur /api/payments
➡️ Configurez les routes backend (Étape 2)

### "Cannot find module '@/components/payments/...'"
➡️ Vérifiez que les fichiers sont dans `frontend/components/payments/`

### Les paiements ne s'affichent pas
➡️ Ouvrez la console (F12) et vérifiez les erreurs

---

## 📚 Pour aller plus loin

- **Guide complet** : `INTEGRATION_GUIDE_STEP_BY_STEP.md`
- **Documentation technique** : `PAYMENT_TRACKING_IMPLEMENTATION_SUMMARY.md`
- **Exemple complet** : `frontend/app/delivery-notes/[id]/page-with-payments.tsx`
- **Spécifications** : `.kiro/specs/client-payment-tracking/`

---

## ✅ Checklist de déploiement

- [ ] Migrations exécutées
- [ ] Routes backend configurées
- [ ] Composants intégrés dans les pages
- [ ] Lien dashboard ajouté au menu
- [ ] Tests passés avec succès
- [ ] Documentation lue

---

## 🎉 C'est tout !

Votre système de paiements est prêt à l'emploi. Commencez à enregistrer des paiements et suivez vos soldes en temps réel !

**Questions ?** Consultez `INTEGRATION_GUIDE_STEP_BY_STEP.md` pour plus de détails.
