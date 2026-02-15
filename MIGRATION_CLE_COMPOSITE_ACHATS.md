# Migration vers Clé Composite pour les Achats

## Vue d'ensemble

Migration du système d'achats (BL et factures) pour utiliser des clés composites naturelles au lieu d'IDs auto-incrémentés.

## Changements de Structure

### Avant (avec ID auto-incrémenté)
```sql
CREATE TABLE facture_achat (
    nfact_achat SERIAL PRIMARY KEY,  -- ID artificiel
    nfournisseur VARCHAR(20),
    numero_facture_fournisseur VARCHAR(100),
    ...
);
```

### Après (avec clé composite)
```sql
CREATE TABLE facture_achat (
    numero_facture_fournisseur VARCHAR(100) NOT NULL,
    nfournisseur VARCHAR(20) NOT NULL,
    PRIMARY KEY (numero_facture_fournisseur, nfournisseur),
    ...
);
```

## Avantages de la Clé Composite

1. **Données naturelles** : Utilise les numéros réels fournis par les fournisseurs
2. **Pas de doublons** : Impossible d'avoir deux fois la même facture/BL pour un fournisseur
3. **Flexibilité** : Le même numéro peut exister pour différents fournisseurs
4. **Cohérence** : Correspond à la structure MySQL existante

## Fichiers Créés

### 1. Fonctions SQL Supabase

#### `backend/FONCTIONS_RPC_ACHATS_CLE_COMPOSITE.sql`
Fonctions RPC pour les factures d'achats :
- `ensure_purchase_schema_composite()` - Crée les tables avec clé composite
- `check_supplier_invoice_exists_composite()` - Vérifie l'existence d'une facture
- `insert_purchase_invoice_composite()` - Crée une facture
- `insert_detail_purchase_invoice_composite()` - Ajoute les détails
- `update_stock_purchase_invoice_composite()` - Met à jour le stock
- `get_purchase_invoices_list_composite()` - Liste des factures
- `get_purchase_invoice_with_details_composite()` - Détails d'une facture

#### `backend/FONCTIONS_RPC_BL_ACHATS_CLE_COMPOSITE.sql`
Fonctions RPC pour les BL d'achats :
- `ensure_purchase_bl_schema_composite()` - Crée les tables avec clé composite
- `check_supplier_bl_exists_composite()` - Vérifie l'existence d'un BL
- `insert_purchase_bl_composite()` - Crée un BL
- `insert_detail_purchase_bl_composite()` - Ajoute les détails
- `update_stock_purchase_bl_composite()` - Met à jour le stock
- `get_purchase_bl_list_composite()` - Liste des BL
- `get_purchase_bl_with_details_composite()` - Détails d'un BL

### 2. Routes API

#### `backend/src/routes/purchases-composite.ts`
Routes API mises à jour pour utiliser les fonctions avec clé composite :

**BL d'achats :**
- `GET /api/purchases/delivery-notes` - Liste des BL
- `POST /api/purchases/delivery-notes` - Créer un BL
- `GET /api/purchases/delivery-notes/:numero/:fournisseur` - Détails d'un BL

**Factures d'achats :**
- `GET /api/purchases/invoices` - Liste des factures
- `POST /api/purchases/invoices` - Créer une facture
- `GET /api/purchases/invoices/:numero/:fournisseur` - Détails d'une facture

### 3. Script de Test

#### `test-purchases-composite-key.js`
Script de test complet qui vérifie :
1. ✅ Création d'un BL d'achat
2. ✅ Rejet des doublons (même numéro + même fournisseur)
3. ✅ Acceptation du même numéro pour un autre fournisseur
4. ✅ Création d'une facture d'achat
5. ✅ Récupération de la liste des BL
6. ✅ Récupération d'un BL spécifique
7. ✅ Récupération de la liste des factures

## Instructions de Déploiement

### Étape 1 : Exécuter les fonctions SQL sur Supabase

1. Ouvrir le dashboard Supabase : https://supabase.com/dashboard/project/szgodrjglbpzkrksnroi/sql/new

2. Exécuter dans l'ordre :
   ```bash
   # 1. Factures d'achats
   backend/FONCTIONS_RPC_ACHATS_CLE_COMPOSITE.sql
   
   # 2. BL d'achats
   backend/FONCTIONS_RPC_BL_ACHATS_CLE_COMPOSITE.sql
   ```

### Étape 2 : Mettre à jour les routes

Remplacer l'import dans `backend/index.ts` ou le fichier principal :

```typescript
// Avant
import purchases from './src/routes/purchases.js';

// Après
import purchases from './src/routes/purchases-composite.js';
```

### Étape 3 : Tester

```bash
# Démarrer le serveur backend
cd backend
npm run dev

# Dans un autre terminal, exécuter les tests
node test-purchases-composite-key.js
```

## Exemples d'Utilisation

### Créer un BL d'achat

```javascript
POST /api/purchases/delivery-notes
Headers: { "X-Tenant": "2025_bu01" }
Body: {
  "Nfournisseur": "FOURNISSEUR1",
  "numero_bl_fournisseur": "BL-FOUR1-2025-001",
  "date_bl": "2025-02-15",
  "detail_bl_achat": [
    {
      "Narticle": "1000",
      "Qte": 50,
      "prix": 800.00,
      "tva": 19.00
    }
  ]
}
```

### Créer une facture d'achat

```javascript
POST /api/purchases/invoices
Headers: { "X-Tenant": "2025_bu01" }
Body: {
  "Nfournisseur": "FOURNISSEUR1",
  "numero_facture_fournisseur": "FAC-FOUR1-2025-001",
  "date_fact": "2025-02-15",
  "detail_fact_achat": [
    {
      "Narticle": "1000",
      "Qte": 100,
      "prix": 750.00,
      "tva": 19.00
    }
  ]
}
```

### Récupérer un BL spécifique

```javascript
GET /api/purchases/delivery-notes/BL-FOUR1-2025-001/FOURNISSEUR1
Headers: { "X-Tenant": "2025_bu01" }
```

### Récupérer une facture spécifique

```javascript
GET /api/purchases/invoices/FAC-FOUR1-2025-001/FOURNISSEUR1
Headers: { "X-Tenant": "2025_bu01" }
```

## Validation des Données

Le système valide automatiquement :

1. ✅ **Unicité** : Pas de doublon (numero + fournisseur)
2. ✅ **Fournisseur** : Le fournisseur doit exister
3. ✅ **Articles** : Les articles doivent exister
4. ✅ **Cohérence** : Les articles doivent appartenir au fournisseur sélectionné
5. ✅ **Stock** : Mise à jour automatique du stock après création

## Différences avec l'Ancien Système

| Aspect | Ancien Système | Nouveau Système |
|--------|---------------|-----------------|
| Clé primaire | ID auto-incrémenté | (numero_fournisseur, nfournisseur) |
| Numéro document | Stocké séparément | Fait partie de la clé |
| Doublons | Possibles | Impossibles |
| URL API | `/invoices/:id` | `/invoices/:numero/:fournisseur` |
| Flexibilité | Limitée | Même numéro pour différents fournisseurs |

## Compatibilité

- ✅ **MySQL local** : Structure déjà compatible (utilise déjà des clés composites)
- ✅ **Supabase** : Nouvelles fonctions RPC avec clé composite
- ✅ **Frontend** : Nécessite mise à jour des appels API

## Notes Importantes

1. Les fonctions `_composite` coexistent avec les anciennes fonctions
2. Pas de migration de données nécessaire (nouvelles tables)
3. Les anciennes routes restent fonctionnelles
4. Migration progressive possible

## Support

Pour toute question ou problème :
1. Vérifier les logs du serveur backend
2. Tester avec `test-purchases-composite-key.js`
3. Vérifier les fonctions RPC dans Supabase

## Statut

- ✅ Fonctions SQL créées et exécutées sur Supabase
- ✅ Routes API créées
- ✅ Script de test créé
- ⏳ Intégration dans le serveur principal (à faire)
- ⏳ Mise à jour du frontend (à faire)
