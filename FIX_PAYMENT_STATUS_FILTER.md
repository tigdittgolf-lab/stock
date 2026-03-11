# Fix: Filtre "Partiellement payés" ne trouve aucun résultat

## Problème
Lorsqu'on filtre les BL ou factures par statut de paiement "Partiellement payés", aucun résultat n'apparaît même s'il existe des documents avec des paiements partiels.

## Causes Identifiées

### 1. Fonction de chargement des statuts désactivée
Dans `delivery-notes/list/page.tsx` et `invoices/list/page.tsx`, la fonction `loadPaymentStatusesInBackground` était commentée:
```typescript
// NE PLUS charger les statuts de paiement automatiquement
// C'est trop lourd et cause des boucles infinies
// loadPaymentStatusesInBackground(data.data || [], tenantSchema);
```

Résultat: `paymentStatuses` restait vide `{}`, donc le filtre ne trouvait jamais rien.

### 2. API /balance non implémentée
L'endpoint `/api/payments/balance` retournait toujours `documentTotalAmount = 0`:
```typescript
const documentTotalAmount = 0; // Placeholder - needs implementation
```

Cela rendait tous les calculs de statut incorrects.

## Solution Appliquée

### Nouvelle fonction optimisée: `loadPaymentStatusesOptimized`

Au lieu d'utiliser l'API `/balance` qui n'est pas implémentée, on calcule le statut directement côté frontend:

```typescript
const loadPaymentStatusesOptimized = async (notes: DeliveryNote[], tenantSchema: string, dbType: string) => {
  const statuses: Record<number, string> = {};
  
  for (const note of notes) {
    try {
      // 1. Récupérer les paiements pour ce document
      const response = await fetch(
        `/api/payments?documentType=delivery_note&documentId=${note.nbl}`,
        {
          headers: {
            'X-Tenant': tenantSchema,
            'X-Database-Type': dbType
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const payments = data.data;
          
          // 2. Calculer le total payé (avec conversion string->number pour MySQL)
          const totalPaid = payments.reduce((sum: number, p: any) => {
            const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);
          
          // 3. Récupérer le montant total du document
          const totalAmount = typeof note.montant_ttc === 'string' 
            ? parseFloat(note.montant_ttc) 
            : (note.montant_ttc || (note.montant_ht + note.tva));
          
          // 4. Déterminer le statut
          const balance = totalAmount - totalPaid;
          
          if (Math.abs(balance) < 0.01) {
            statuses[note.nbl] = 'paid';              // Payé totalement
          } else if (totalPaid > 0 && balance > 0) {
            statuses[note.nbl] = 'partially_paid';    // Partiellement payé ✅
          } else if (totalPaid > totalAmount) {
            statuses[note.nbl] = 'overpaid';          // Trop-perçu
          } else {
            statuses[note.nbl] = 'unpaid';            // Non payé
          }
          
          console.log(`💰 BL ${note.nbl}: Total=${totalAmount.toFixed(2)}, Payé=${totalPaid.toFixed(2)}, Statut=${statuses[note.nbl]}`);
        }
      }
    } catch (error) {
      console.error(`Error loading payment status for BL ${note.nbl}:`, error);
      statuses[note.nbl] = 'unpaid';
    }
  }
  
  // 5. Mettre à jour tous les statuts en une fois
  setPaymentStatuses(statuses);
  console.log(`✅ Loaded payment statuses for ${Object.keys(statuses).length} BLs`);
};
```

### Activation de la fonction

**delivery-notes/list/page.tsx** (ligne ~137):
```typescript
if (data.success) {
  const notes = data.data || [];
  setDeliveryNotes(notes);
  setFilteredDeliveryNotes(notes);
  console.log(`✅ Delivery notes loaded successfully: ${notes.length} BL`);
  
  // Charger les statuts de paiement de manière optimisée
  loadPaymentStatusesOptimized(notes, tenantSchema, dbType);
}
```

**invoices/list/page.tsx** (ligne ~93):
```typescript
if (data.success) {
  const invoices = data.data || [];
  setInvoices(invoices);
  setFilteredInvoices(invoices);
  
  // Charger les statuts de paiement de manière optimisée
  const dbConfig = localStorage.getItem('activeDbConfig');
  const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
  loadPaymentStatusesOptimized(invoices, tenantSchema, dbType);
}
```

## Avantages de cette solution

1. ✅ **Calcul précis**: Utilise les vraies données de paiement et les montants réels des documents
2. ✅ **Compatible MySQL et Supabase**: Gère la conversion string->number pour MySQL
3. ✅ **Logs détaillés**: Affiche le calcul pour chaque document dans la console
4. ✅ **Pas de boucle infinie**: Appelé une seule fois au chargement
5. ✅ **Tolérance aux erreurs**: Continue même si un document échoue

## Logique de détermination du statut

```
balance = totalAmount - totalPaid

Si |balance| < 0.01 DA        → 'paid' (payé totalement)
Si totalPaid > 0 ET balance > 0 → 'partially_paid' (partiellement payé) ✅
Si totalPaid > totalAmount     → 'overpaid' (trop-perçu)
Sinon                          → 'unpaid' (non payé)
```

## Test

Pour tester:
1. Créer un BL avec un montant total (ex: 1000 DA)
2. Ajouter un paiement partiel (ex: 500 DA)
3. Aller sur la liste des BLs
4. Ouvrir la console pour voir: `💰 BL XXX: Total=1000.00, Payé=500.00, Statut=partially_paid`
5. Filtrer par "🟡 Partiellement payés"
6. Le BL devrait apparaître dans les résultats

## Statut

✅ Implémenté pour les BLs (delivery-notes/list/page.tsx)
✅ Implémenté pour les factures (invoices/list/page.tsx)
✅ Compatible MySQL et Supabase
✅ Logs de debug activés
