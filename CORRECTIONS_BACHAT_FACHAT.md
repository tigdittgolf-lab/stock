# Corrections pour afficher les vraies données bachat/fachat

## Problème identifié
L'application affichait des données de fallback (exemple) au lieu des vraies données MySQL de la table `bachat`.

## Cause
Les routes utilisaient des fonctions RPC (`get_purchase_bl_list`) qui n'existent pas dans MySQL, donc elles retournaient toujours les données de fallback.

## Solutions appliquées

### 1. Route GET /api/purchases/delivery-notes (Liste des BL)
**Fichier:** `backend/src/routes/purchases.ts`

**Avant:**
```typescript
const { data: blData, error: blError } = await databaseRouter.rpc('get_purchase_bl_list', {
  p_tenant: tenant
});
// Retournait des données de fallback si la fonction RPC n'existe pas
```

**Après:**
```typescript
const { data: bachatData, error: bachatError } = await databaseRouter
  .from('bachat')
  .select('*')
  .order('date_fact', { ascending: false });
// Récupère directement depuis la table bachat
```

**Enrichissement des données:**
- Récupère les fournisseurs depuis la table `fournisseur`
- Calcule le total TTC (montant_ht + tva + timbre + autre_taxe)
- Formate les données pour correspondre à l'interface frontend

### 2. Route GET /api/purchases/delivery-notes/:id (Détail d'un BL)
**Fichier:** `backend/src/routes/purchases.ts`

**Avant:**
```typescript
const { data: blResult, error: blError } = await databaseRouter.rpc('get_purchase_bl_with_details', {
  p_tenant: tenant,
  p_nbl_achat: blId
});
```

**Après:**
```typescript
// 1. Récupérer le BL
const { data: blData } = await databaseRouter
  .from('bachat')
  .select('*')
  .eq('nfact', blId)
  .single();

// 2. Récupérer les détails
const { data: detailsData } = await databaseRouter
  .from('bachat_detail')
  .select('*')
  .eq('NFact', blId)
  .eq('nfournisseur', blData.nfournisseur);

// 3. Enrichir avec articles et fournisseur
```

### 3. Amélioration du databaseRouter.from()
**Fichier:** `backend/src/services/databaseRouter.ts`

**Implémentation complète des méthodes CRUD:**
- `.select()` - avec support de `.eq()`, `.order()`, `.limit()`, `.single()`
- `.insert()` - avec support de `.select()`, `.single()`
- `.update()` - avec support de `.eq()`
- `.delete()` - avec support de `.eq()`

**Fonctionnement:**
- Détecte automatiquement le type de base (MySQL, PostgreSQL, Supabase)
- Pour Supabase: utilise l'API native
- Pour MySQL/PostgreSQL: génère des requêtes SQL et utilise `executeQuery()`

## Structure des données retournées

### Liste des BL (GET /api/purchases/delivery-notes)
```typescript
{
  success: true,
  data: [
    {
      nbl_achat: 1,                          // ID interne (nfact converti en int)
      nfournisseur: "FOURNISSEUR1",          // Code fournisseur
      numero_bl_fournisseur: "1",            // Numéro du BL (nfact)
      supplier_name: "Nom du fournisseur",   // Nom enrichi
      date_bl: "2025-02-15",                 // Date du BL
      montant_ht: 12000.00,                  // Montant HT
      tva: 2280.00,                          // TVA
      total_ttc: 14280.00,                   // Total calculé
      created_at: "2025-02-15",              // Date de création
      type: "purchase_delivery_note"         // Type de document
    }
  ],
  tenant: "2025_bu01",
  source: "database",
  database_type: "mysql"
}
```

### Détail d'un BL (GET /api/purchases/delivery-notes/:id)
```typescript
{
  success: true,
  data: {
    nbl_achat: 1,
    nfournisseur: "FOURNISSEUR1",
    numero_bl_fournisseur: "1",
    supplier_name: "Nom du fournisseur",
    supplier_address: "Adresse du fournisseur",
    date_bl: "2025-02-15",
    montant_ht: 12000.00,
    tva: 2280.00,
    timbre: 0.00,
    autre_taxe: 0.00,
    total_ttc: 14280.00,
    ncheque: null,
    banque: null,
    details: [
      {
        narticle: "ART001",
        designation: "Article 1",
        qte: 10,
        prix: 1200.00,
        tva: 19.00,
        total_ligne: 12000.00
      }
    ]
  },
  source: "database",
  database_type: "mysql"
}
```

## Test des modifications

### 1. Vérifier que le backend utilise MySQL
```bash
# Dans les logs du backend, vous devriez voir:
🔀 DatabaseRouter: ... → mysql
🐬 MySQL: Executing query: SELECT * FROM bachat...
✅ MySQL: Query successful, X rows returned
```

### 2. Vérifier les données dans le frontend
- Ouvrir `/purchases/delivery-notes/list`
- Vous devriez voir toutes vos données de la table `bachat`
- Le nombre de BL affiché doit correspondre au nombre de lignes dans `bachat`

### 3. Vérifier un BL spécifique
- Cliquer sur "Voir" pour un BL
- Vous devriez voir les détails depuis `bachat_detail`
- Les articles doivent être enrichis avec leur désignation

## Prochaines étapes

Si les données ne s'affichent toujours pas:

1. **Vérifier la connexion MySQL:**
   ```sql
   SELECT COUNT(*) FROM bachat;
   SELECT COUNT(*) FROM bachat_detail;
   ```

2. **Vérifier les logs backend:**
   - Chercher les messages `📋 Fetching purchase delivery notes`
   - Vérifier s'il y a des erreurs SQL

3. **Vérifier le tenant:**
   - Le frontend envoie `X-Tenant: 2025_bu01`
   - Vérifier que ce tenant correspond à votre base

4. **Tester directement l'API:**
   ```bash
   curl -H "X-Tenant: 2025_bu01" http://localhost:3005/api/purchases/delivery-notes
   ```

## Compatibilité multi-base

Ces modifications respectent l'architecture multi-base:
- ✅ MySQL: Utilise des requêtes SQL directes
- ✅ PostgreSQL: Utilise des requêtes SQL PostgreSQL
- ✅ Supabase: Utilise l'API Supabase native

Le changement de base se fait via `databaseRouter` sans modifier le code des routes.
