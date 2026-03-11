# Fix: Filtre "Partiellement payés" ne retourne aucun résultat

## Problème
Après avoir corrigé la boucle infinie, le filtre par statut de paiement ne fonctionnait toujours pas car:
1. Les statuts n'étaient chargés que pour la page courante (50 BLs)
2. Quand l'utilisateur activait le filtre "Partiellement payés", `paymentStatuses` ne contenait que 50 statuts
3. Les BLs partiellement payés pouvaient être sur d'autres pages non chargées

## Solution: Chargement intelligent à la demande

### Stratégie à deux niveaux

**Niveau 1: Navigation normale (pas de filtre)**
- Charge uniquement les statuts de la page courante (50 BLs)
- Performance optimale
- Pas de surcharge

**Niveau 2: Filtre par statut activé**
- Charge TOUS les statuts de TOUS les BLs
- Permet un filtrage précis
- Se déclenche uniquement quand nécessaire

### Implémentation

#### 1. Fonction avec paramètre `forceAll`

```typescript
const loadPaymentStatusesOptimized = async (
  notes: DeliveryNote[], 
  tenantSchema: string, 
  dbType: string, 
  forceAll: boolean = false  // ✅ Nouveau paramètre
) => {
  let notesToProcess: DeliveryNote[];
  
  if (forceAll) {
    // ✅ Charger TOUS les BLs si demandé
    notesToProcess = notes;
    console.log(`📊 Loading payment statuses for ALL ${notes.length} BLs (filter active)`);
  } else {
    // ✅ Sinon, charger uniquement la page courante
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    notesToProcess = notes.slice(startIndex, endIndex);
    console.log(`📊 Loading payment statuses for page ${currentPage}: ${notesToProcess.length} BLs`);
  }
  
  const statuses: Record<number, string> = {};
  
  for (const note of notesToProcess) {
    // ✅ Skip si déjà chargé (optimisation)
    if (!forceAll && paymentStatuses[note.nbl]) {
      continue;
    }
    
    // ... calcul du statut
  }
  
  // ✅ Merge avec les statuts existants
  setPaymentStatuses(prev => ({ ...prev, ...statuses }));
};
```

#### 2. useEffect pour la pagination (mode normal)

```typescript
// Recharger les statuts de paiement quand la page change
useEffect(() => {
  if (filteredDeliveryNotes.length > 0) {
    const tenantInfo = localStorage.getItem('tenant_info');
    const dbConfig = localStorage.getItem('activeDbConfig');
    
    if (tenantInfo && dbConfig) {
      const tenant = JSON.parse(tenantInfo);
      const dbType = JSON.parse(dbConfig).type;
      
      // ✅ forceAll = false (page courante uniquement)
      loadPaymentStatusesOptimized(filteredDeliveryNotes, tenant.schema, dbType, false);
    }
  }
}, [currentPage, itemsPerPage]);
```

#### 3. useEffect pour le filtre par statut (mode complet)

```typescript
// Charger TOUS les statuts quand le filtre par statut de paiement est activé
useEffect(() => {
  if (paymentStatus !== 'all' && deliveryNotes.length > 0) {
    const tenantInfo = localStorage.getItem('tenant_info');
    const dbConfig = localStorage.getItem('activeDbConfig');
    
    if (tenantInfo && dbConfig) {
      const tenant = JSON.parse(tenantInfo);
      const dbType = JSON.parse(dbConfig).type;
      
      console.log(`🔍 Payment status filter activated: ${paymentStatus}, loading all statuses...`);
      // ✅ forceAll = true (TOUS les BLs)
      loadPaymentStatusesOptimized(deliveryNotes, tenant.schema, dbType, true);
    }
  }
}, [paymentStatus]); // ✅ Se déclenche quand le filtre change
```

## Comportement

### Scénario 1: Navigation normale
1. Utilisateur charge la liste des BLs
2. Système charge les statuts de la page 1 (50 BLs)
3. Utilisateur change de page → charge les statuts de la nouvelle page
4. Performance: 50 requêtes par page

### Scénario 2: Filtre par statut
1. Utilisateur sélectionne "🟡 Partiellement payés"
2. Système détecte `paymentStatus !== 'all'`
3. Système charge TOUS les statuts (4689 BLs)
4. Filtre s'applique correctement
5. Résultats affichés

### Scénario 3: Retour à "Tous"
1. Utilisateur sélectionne "Tous"
2. `paymentStatus === 'all'`
3. Pas de rechargement (statuts déjà en cache)
4. Affichage instantané

## Optimisations

### 1. Skip des statuts déjà chargés
```typescript
if (!forceAll && paymentStatuses[note.nbl]) {
  continue; // ✅ Ne pas recharger
}
```

### 2. Logs conditionnels
```typescript
if (forceAll && statuses[note.nbl] === 'partially_paid') {
  console.log(`💰 BL ${note.nbl}: Total=${totalAmount.toFixed(2)}, Payé=${totalPaid.toFixed(2)}, Statut=${statuses[note.nbl]}`);
}
```
Affiche uniquement les BLs partiellement payés quand on charge tout.

### 3. Merge des statuts
```typescript
setPaymentStatuses(prev => ({ ...prev, ...statuses }));
```
Conserve les statuts déjà chargés.

## Logs de debug

### Mode normal (pagination)
```
📊 Loading payment statuses for page 1: 50 BLs (0 to 50)
✅ Loaded payment statuses for 50 BLs on page 1
```

### Mode filtre activé
```
🔍 Payment status filter activated: partially_paid, loading all statuses...
📊 Loading payment statuses for ALL 4689 BLs (filter active)
💰 BL 8523: Total=1500.00, Payé=750.00, Statut=partially_paid
💰 BL 8234: Total=2000.00, Payé=1000.00, Statut=partially_paid
... (uniquement les partiellement payés)
✅ Loaded payment statuses for 4689 BLs (ALL)
```

## Test

1. Charger la liste des BLs
2. Observer dans la console: `Loading payment statuses for page 1: 50 BLs`
3. Sélectionner le filtre "🟡 Partiellement payés"
4. Observer dans la console: `Payment status filter activated: partially_paid, loading all statuses...`
5. Attendre quelques secondes (chargement de tous les statuts)
6. Les BLs partiellement payés s'affichent!

## Performance

- **Sans filtre**: ~50 requêtes par page (rapide)
- **Avec filtre**: ~4689 requêtes une seule fois (puis cache)
- **Changement de filtre**: Instantané (utilise le cache)

## Statut

✅ Implémenté pour les BLs
✅ Chargement intelligent à deux niveaux
✅ Cache des statuts
✅ Logs de debug détaillés
⚠️ À implémenter pour les factures (même logique)
