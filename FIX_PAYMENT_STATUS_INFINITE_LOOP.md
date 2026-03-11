# Fix: Boucle infinie de requêtes pour les statuts de paiement

## Problème
Lors du chargement de la liste des BLs, le frontend faisait une requête `/api/payments` pour CHAQUE BL, créant une boucle massive:
- 4689 BLs = 4689 requêtes simultanées
- Surcharge du serveur
- Ralentissement de l'application
- Logs remplis de requêtes identiques

```
📋 Fetching payments: {documentId: '8703'}
📋 Fetching payments: {documentId: '8702'}
📋 Fetching payments: {documentId: '8701'}
... (4689 fois)
```

## Cause
La fonction `loadPaymentStatusesOptimized` chargeait les statuts pour TOUS les BLs au chargement initial, sans tenir compte de la pagination.

```typescript
// ❌ AVANT: Chargeait TOUS les BLs
for (const note of notes) {  // notes = 4689 BLs!
  await fetch(`/api/payments?documentType=delivery_note&documentId=${note.nbl}`);
}
```

## Solution: Chargement par page

### 1. Modification de `loadPaymentStatusesOptimized` (BLs)

**Fichier**: `frontend/app/delivery-notes/list/page.tsx`

```typescript
const loadPaymentStatusesOptimized = async (notes: DeliveryNote[], tenantSchema: string, dbType: string) => {
  // ✅ Calculer quels BLs sont visibles sur la page courante
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleNotes = notes.slice(startIndex, endIndex);
  
  console.log(`📊 Loading payment statuses for page ${currentPage}: ${visibleNotes.length} BLs (${startIndex} to ${endIndex})`);
  
  const statuses: Record<number, string> = {};
  
  // ✅ Charger uniquement pour les BLs visibles (50 max par défaut)
  for (const note of visibleNotes) {
    // ... calcul du statut
  }
  
  // ✅ Merge avec les statuts existants (ne pas écraser)
  setPaymentStatuses(prev => ({ ...prev, ...statuses }));
  console.log(`✅ Loaded payment statuses for ${Object.keys(statuses).length} BLs on page ${currentPage}`);
};
```

### 2. Ajout d'un useEffect pour recharger à chaque changement de page

```typescript
// Recharger les statuts de paiement quand la page change
useEffect(() => {
  if (filteredDeliveryNotes.length > 0) {
    const tenantInfo = localStorage.getItem('tenant_info');
    const dbConfig = localStorage.getItem('activeDbConfig');
    
    if (tenantInfo && dbConfig) {
      const tenant = JSON.parse(tenantInfo);
      const dbType = JSON.parse(dbConfig).type;
      
      // ✅ Charger les statuts uniquement pour la page courante
      loadPaymentStatusesOptimized(filteredDeliveryNotes, tenant.schema, dbType);
    }
  }
}, [currentPage, itemsPerPage]); // ✅ Recharger quand la page ou le nombre d'items change
```

### 3. Suppression de l'appel initial massif

```typescript
// ❌ AVANT
if (data.success) {
  const notes = data.data || [];
  setDeliveryNotes(notes);
  setFilteredDeliveryNotes(notes);
  loadPaymentStatusesOptimized(notes, tenantSchema, dbType); // ❌ Chargeait TOUS les BLs
}

// ✅ APRÈS
if (data.success) {
  const notes = data.data || [];
  setDeliveryNotes(notes);
  setFilteredDeliveryNotes(notes);
  // ✅ Les statuts seront chargés par le useEffect de pagination
}
```

### 4. Limitation pour les factures

**Fichier**: `frontend/app/invoices/list/page.tsx`

Comme les factures n'ont pas de pagination visible, on limite à 50 factures:

```typescript
const loadPaymentStatusesOptimized = async (invoices: Invoice[], tenantSchema: string, dbType: string) => {
  // ✅ Limiter à 50 premières factures pour éviter la surcharge
  const visibleInvoices = invoices.slice(0, 50);
  
  console.log(`📊 Loading payment statuses for ${visibleInvoices.length} invoices (limited to avoid overload)`);
  
  // ... reste du code
};
```

## Résultat

### Avant
- 4689 requêtes au chargement initial
- Temps de chargement: plusieurs secondes
- Serveur surchargé

### Après
- 50 requêtes maximum par page (selon `itemsPerPage`)
- Temps de chargement: < 1 seconde
- Chargement progressif quand l'utilisateur change de page
- Les statuts déjà chargés sont conservés (merge)

## Comportement

1. **Chargement initial**: Charge les statuts uniquement pour la page 1 (50 BLs)
2. **Changement de page**: Charge les statuts pour la nouvelle page
3. **Cache**: Les statuts déjà chargés sont conservés
4. **Filtre par statut**: Fonctionne uniquement pour les BLs dont le statut a été chargé

## Logs de debug

```
📊 Loading payment statuses for page 1: 50 BLs (0 to 50)
💰 BL 8703: Total=1500.00, Payé=750.00, Statut=partially_paid
💰 BL 8702: Total=2000.00, Payé=2000.00, Statut=paid
... (50 fois max)
✅ Loaded payment statuses for 50 BLs on page 1
```

## Améliorations futures possibles

1. **Chargement en arrière-plan**: Précharger la page suivante pendant que l'utilisateur consulte la page courante
2. **API batch**: Créer un endpoint `/api/payments/batch` qui accepte plusieurs documentIds en une seule requête
3. **Cache côté serveur**: Mettre en cache les statuts de paiement avec Redis
4. **WebSocket**: Mettre à jour les statuts en temps réel quand un paiement est ajouté

## Statut

✅ Implémenté pour les BLs avec pagination
✅ Implémenté pour les factures avec limite de 50
✅ Logs de debug ajoutés
✅ Merge des statuts pour conserver le cache
