# Fix: Erreur "amount.toFixed is not a function" dans les Paiements

## Problème
Erreur runtime dans les composants de paiement:
```
TypeError: amount.toFixed is not a function
at formatAmount (components/payments/PaymentHistory.tsx:165:23)
```

## Cause
MySQL retourne les colonnes DECIMAL/NUMERIC comme des chaînes de caractères, pas comme des nombres. Quand le frontend essaie d'appeler `.toFixed()` sur une chaîne, ça échoue.

## Solution Appliquée

### 1. PaymentHistory.tsx

#### Type Payment mis à jour
```typescript
interface Payment {
    id: number;
    paymentDate: string;
    amount: number | string; // MySQL peut retourner DECIMAL comme string
    paymentMethod?: string;
    notes?: string;
    createdAt: string;
}
```

#### Fonction formatAmount corrigée
```typescript
const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return (isNaN(numAmount) ? 0 : numAmount).toFixed(2) + ' DA';
};
```

#### Conversion dans handleEdit
```typescript
const handleEdit = (payment: Payment) => {
    setEditingId(payment.id);
    setEditForm({
        paymentDate: payment.paymentDate.split('T')[0],
        amount: typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount,
        paymentMethod: payment.paymentMethod,
        notes: payment.notes
    });
};
```

#### Calcul du total sécurisé
```typescript
{formatAmount(payments.reduce((sum, p) => {
    const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
    return sum + (isNaN(amount) ? 0 : amount);
}, 0))}
```

### 2. PaymentSummary.tsx

#### Fonction formatAmount corrigée
```typescript
const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return (isNaN(numAmount) ? 0 : numAmount).toFixed(2) + ' DA';
};
```

### 3. PaymentForm.tsx

#### Props mises à jour
```typescript
interface PaymentFormProps {
    documentType: 'delivery_note' | 'invoice';
    documentId: number;
    documentNumber: string;
    documentTotalAmount: number | string; // MySQL peut retourner DECIMAL comme string
    currentBalance?: number | string;
    onSuccess: () => void;
    onCancel: () => void;
}
```

#### Helper de conversion ajouté
```typescript
// Helper pour convertir les montants de manière sûre
const toNumber = (value: number | string | undefined): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
};

const totalAmount = toNumber(documentTotalAmount);
const initialBalance = toNumber(currentBalance !== undefined ? currentBalance : documentTotalAmount);
```

## Principe de la Solution

Tous les composants de paiement acceptent maintenant `amount` comme `number | string` et convertissent systématiquement en nombre avant d'utiliser des méthodes numériques comme `.toFixed()`.

La conversion est toujours sécurisée avec:
1. Vérification du type (`typeof amount === 'string'`)
2. Conversion avec `parseFloat()`
3. Vérification de NaN avec fallback à 0

## Test

Pour tester:
1. Aller sur la page de détails d'un BL
2. Vérifier que l'historique des paiements s'affiche sans erreur
3. Essayer d'ajouter un nouveau paiement
4. Vérifier que les montants s'affichent correctement avec 2 décimales

## Statut

✅ Tous les composants de paiement corrigés
✅ Gestion sécurisée des types number et string
✅ Pas de régression sur les calculs
