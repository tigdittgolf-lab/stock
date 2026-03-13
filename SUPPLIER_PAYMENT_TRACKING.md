# Suivi des Paiements Fournisseurs (Achats)

## Vue d'ensemble
Extension du système de paiements pour gérer les dettes fournisseurs et les paiements d'achats.

## Modifications apportées

### 1. Extension de la table `payments`

**Script SQL**: `EXTEND_PAYMENTS_FOR_PURCHASES.sql`

Ajout de nouveaux types de documents:
- `purchase_delivery_note` - BL fournisseur (achat)
- `purchase_invoice` - Facture fournisseur (achat)

### 2. Frontend - Formulaire BL Achat

**Fichier**: `frontend/app/purchase-delivery-notes/page.tsx`

Ajout d'une section "💰 Paiement Fournisseur" avec:
- Type de paiement (total/partiel)
- Montant versé
- Méthode de paiement
- Notes
- Alerte dette restante

### 3. Utilisation

#### Créer un BL d'achat avec paiement total
1. Remplir le formulaire normalement
2. Section paiement affiche "Paiement total" par défaut
3. Sélectionner la méthode de paiement
4. Créer le BL → Paiement enregistré automatiquement

#### Créer un BL d'achat avec paiement partiel (crédit)
1. Remplir le formulaire
2. Sélectionner "Paiement partiel"
3. Saisir le montant versé
4. Système affiche la dette restante
5. Créer le BL → Dette enregistrée

## Prochaines étapes

1. Ajouter la même fonctionnalité aux factures d'achat
2. Créer un rapport des dettes fournisseurs
3. Ajouter des paiements ultérieurs
4. Alertes pour les dettes en retard
