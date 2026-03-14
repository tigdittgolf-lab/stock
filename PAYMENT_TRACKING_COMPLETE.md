# Système de Suivi des Paiements - Documentation Complète

## Vue d'ensemble

Le système de suivi des paiements permet de gérer les paiements partiels et totaux pour tous les types de documents (ventes et achats). Il offre une traçabilité complète des transactions financières.

## Architecture

### Base de données

#### Table `payments` (Supabase/PostgreSQL et MySQL)

```sql
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant VARCHAR(50) NOT NULL,
  document_type ENUM('delivery_note', 'invoice', 'purchase_delivery_note', 'purchase_invoice') NOT NULL,
  document_id INT NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method ENUM('cash', 'check', 'bank_transfer', 'credit_card', 'other') NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant_document (tenant, document_type, document_id),
  INDEX idx_payment_date (payment_date)
);
```

### Types de documents supportés

1. **Ventes (Clients)**
   - `delivery_note` - Bon de livraison client
   - `invoice` - Facture client

2. **Achats (Fournisseurs)**
   - `purchase_delivery_note` - Bon de livraison fournisseur
   - `purchase_invoice` - Facture fournisseur

### Méthodes de paiement

- `cash` - Espèces
- `check` - Chèque
- `bank_transfer` - Virement bancaire
- `credit_card` - Carte bancaire
- `other` - Autre

## Fonctionnalités

### 1. Enregistrement de paiement lors de la création de document

**Fichiers concernés:**
- `frontend/app/delivery-notes/page.tsx`
- `frontend/app/invoices/page.tsx`
- `frontend/app/purchase-delivery-notes/page.tsx`
- `frontend/app/purchases/page.tsx`

**Fonctionnement:**
- Section de paiement affichée après la saisie des articles
- Options: Paiement total (défaut) ou paiement partiel
- Saisie du montant versé avec validation
- Sélection de la méthode de paiement
- Notes optionnelles
- Affichage du solde restant en temps réel

**Validation:**
- Le montant versé ne peut pas dépasser le total TTC
- Utilisation de `lang="en"` sur les inputs numériques pour forcer le point comme séparateur décimal
- Focus automatique sur le champ montant lors de l'activation du paiement partiel

### 2. Ajout de paiement sur document existant

**Page:** `frontend/app/payments/add/page.tsx`

**URL:** `/payments/add?type={document_type}&id={document_id}`

**Fonctionnalités:**
- Affichage des informations du document
- Calcul automatique du solde restant
- Validation: le montant ne peut pas dépasser le solde
- Indicateur visuel du solde après paiement
- Message de confirmation si le paiement solde la dette

**Paramètres URL:**
- `type`: Type de document (delivery_note, invoice, purchase_delivery_note, purchase_invoice)
- `id`: ID du document

### 3. Historique des paiements

**Page:** `frontend/app/payments/history/page.tsx`

**URL:** `/payments/history?type={document_type}&id={document_id}`

**Affichage:**
- Liste de tous les paiements pour un document
- Date, montant, méthode, notes
- Total payé avec résumé
- Bouton pour ajouter un nouveau paiement

### 4. Rapport global des paiements

**Page:** `frontend/app/payments/report/page.tsx`

**URL:** `/payments/report`

**Fonctionnalités:**
- Filtrage par période (date début/fin)
- Résumé global: total des paiements, nombre de transactions
- Détail par type de document
- Export possible (à implémenter)

### 5. Intégration dans les listes de documents

**Fichiers modifiés:**
- `frontend/app/delivery-notes/list/page.tsx`
- `frontend/app/invoices/list/page.tsx`

**Boutons ajoutés:**
- 💰 Ajouter Paiement - Redirige vers `/payments/add`
- 📜 Historique - Redirige vers `/payments/history`

**Placement:**
- Vue mobile: Deuxième ligne de boutons (après Voir/Modifier/Supprimer)
- Vue desktop: Colonne Actions avec menu déroulant

## API Endpoints

### Frontend (Next.js API Routes)

#### GET `/api/payments`
Récupère les paiements pour un document

**Query params:**
- `documentType`: Type de document
- `documentId`: ID du document

**Headers:**
- `X-Tenant`: Schéma du tenant

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "paymentDate": "2025-01-15",
      "amount": 5000.00,
      "paymentMethod": "cash",
      "notes": "Paiement partiel",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### POST `/api/payments`
Enregistre un nouveau paiement

**Body:**
```json
{
  "documentType": "delivery_note",
  "documentId": 123,
  "paymentDate": "2025-01-15",
  "amount": 5000.00,
  "paymentMethod": "cash",
  "notes": "Paiement partiel"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Paiement enregistré avec succès",
  "data": {
    "id": 1,
    "balance": 3000.00
  }
}
```

#### GET `/api/payments/balance`
Calcule le solde restant pour un document

**Query params:**
- `documentType`: Type de document
- `documentId`: ID du document

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAmount": 10000.00,
    "totalPaid": 7000.00,
    "balance": 3000.00,
    "status": "partially_paid"
  }
}
```

### Backend (Hono API)

#### POST `/api/sales/payments`
Enregistre un paiement (ventes)

**Fichier:** `backend/src/routes/sales-clean.ts`

#### POST `/api/purchases/payments`
Enregistre un paiement (achats)

**Fichier:** `backend/src/routes/purchases.ts`

## Statuts de paiement

Le système calcule automatiquement le statut de paiement:

- `unpaid` - Non payé (aucun paiement)
- `partially_paid` - Partiellement payé (paiements < total)
- `paid` - Payé (paiements = total)
- `overpaid` - Surpayé (paiements > total)

## Filtrage par statut de paiement

Les listes de documents (BL et factures) permettent de filtrer par statut de paiement:

**Implémentation:**
- Chargement optimisé des statuts (par lots de 3 pour MySQL)
- Filtre côté client pour éviter la surcharge serveur
- Indicateurs visuels dans les listes

## Rapports de dettes

### Dettes clients

**Page:** `frontend/app/clients/debts/page.tsx`

**Fonctionnalités:**
- Liste de tous les clients avec dettes
- Montant total dû par client
- Nombre de documents impayés
- Filtrage et tri

### Dettes fournisseurs

**Page:** `frontend/app/suppliers/debts/page.tsx`

**Fonctionnalités:**
- Liste de tous les fournisseurs avec dettes
- Montant total dû aux fournisseurs
- Nombre de documents impayés
- Filtrage et tri

## Compatibilité

### Bases de données supportées

1. **Supabase (PostgreSQL)**
   - Utilisation de RPC functions
   - Schémas multi-tenants
   - Transactions ACID

2. **MySQL (Local)**
   - Syntaxe adaptée pour les contraintes
   - Support des ENUM
   - Transactions InnoDB

### Scripts SQL fournis

- `EXTEND_PAYMENTS_FOR_PURCHASES.sql` - PostgreSQL/Supabase
- `EXTEND_PAYMENTS_FOR_PURCHASES_MYSQL.sql` - MySQL
- `EXTEND_PAYMENTS_ALTERNATIVE_MYSQL.sql` - MySQL (approche alternative)

## Problèmes résolus

### 1. Saisie décimale
**Problème:** Impossible de saisir des montants avec point décimal
**Solution:** Ajout de `lang="en"` sur tous les inputs de type number

### 2. Duplication de tenant
**Problème:** Header X-Tenant dupliqué causant des erreurs
**Solution:** Nettoyage du tenant dans le middleware avec `split(',')[0].trim()`

### 3. Focus automatique
**Problème:** Pas de focus sur le champ montant lors du paiement partiel
**Solution:** Ajout de `onFocus={(e) => e.target.select()}` sur les inputs

### 4. Alignement PDF
**Problème:** Colonnes mal alignées dans les tickets PDF
**Solution:** Correction des largeurs de colonnes dans `pdfService.ts`

### 5. Performance MySQL
**Problème:** Chargement lent des statuts de paiement
**Solution:** Chargement par lots de 3 requêtes simultanées maximum

## Prochaines étapes

### À implémenter

1. **Backend endpoint pour rapport global**
   - Endpoint `/api/payments/report` avec filtrage par date
   - Agrégation par type de document
   - Statistiques avancées

2. **Modification/Suppression de paiements**
   - Interface pour modifier un paiement existant
   - Confirmation avant suppression
   - Recalcul automatique des soldes

3. **Alertes de dettes**
   - Notification pour dettes dépassant un seuil
   - Rappels automatiques
   - Dashboard des dettes critiques

4. **Export de données**
   - Export PDF des rapports
   - Export Excel des paiements
   - Export CSV pour comptabilité

5. **Intégration comptable**
   - Journal des paiements
   - Rapprochement bancaire
   - Export vers logiciels comptables

6. **Statistiques avancées**
   - Graphiques d'évolution des paiements
   - Analyse par client/fournisseur
   - Prévisions de trésorerie

## Tests recommandés

### Scénarios de test

1. **Paiement total lors de la création**
   - Créer un BL avec paiement total
   - Vérifier que le statut est "paid"
   - Vérifier l'enregistrement dans la table payments

2. **Paiement partiel lors de la création**
   - Créer un BL avec paiement partiel
   - Vérifier le calcul du solde
   - Vérifier le statut "partially_paid"

3. **Ajout de paiement ultérieur**
   - Créer un document sans paiement
   - Ajouter un paiement via `/payments/add`
   - Vérifier la mise à jour du solde

4. **Paiements multiples**
   - Créer un document
   - Ajouter plusieurs paiements partiels
   - Vérifier le total et le solde final

5. **Validation des montants**
   - Tenter de payer plus que le solde
   - Vérifier le message d'erreur
   - Tenter de payer un montant négatif

6. **Filtrage par statut**
   - Créer des documents avec différents statuts
   - Tester les filtres dans les listes
   - Vérifier les compteurs

## Support

Pour toute question ou problème:
1. Vérifier les logs backend (console)
2. Vérifier les logs frontend (DevTools)
3. Consulter cette documentation
4. Vérifier la configuration de la base de données

## Changelog

### Version 1.0 (Janvier 2025)
- ✅ Système de paiement pour ventes (BL et factures)
- ✅ Système de paiement pour achats (BL et factures fournisseurs)
- ✅ Pages de gestion des paiements (ajout, historique, rapport)
- ✅ Intégration dans les listes de documents
- ✅ Rapports de dettes clients et fournisseurs
- ✅ Support MySQL et Supabase
- ✅ Corrections des bugs de saisie décimale
- ✅ Optimisation des performances

### À venir (Version 1.1)
- ⏳ Backend endpoint pour rapport global
- ⏳ Modification/suppression de paiements
- ⏳ Alertes de dettes
- ⏳ Export PDF/Excel
- ⏳ Statistiques avancées
