# Formats Multiples de Bons de Livraison

## Vue d'ensemble

Comme dans l'ancienne application Java NetBeans, nous avons maintenant **3 formats différents** de bons de livraison :

### 1. 📄 **Bon de Livraison Complet** (Format A4)
- **Route**: `/api/pdf/delivery-note/:id`
- **Bouton**: "📄 BL Complet"
- **Description**: Format complet avec toutes les informations, signatures, montant en lettres
- **Usage**: Document officiel pour livraisons importantes
- **Basé sur**: `report_bl.jrxml` (original)

### 2. 📄 **Bon de Livraison Réduit** (Format compact)
- **Route**: `/api/pdf/delivery-note-small/:id`
- **Bouton**: "📄 BL Réduit"
- **Description**: Format plus compact, moins de détails, plus rapide à imprimer
- **Usage**: Livraisons rapides, usage interne
- **Basé sur**: `report_smal_bl.jrxml`

### 3. 🎫 **Ticket de Caisse** (Format 80mm)
- **Route**: `/api/pdf/delivery-note-ticket/:id`
- **Bouton**: "🎫 Ticket"
- **Description**: Format très petit (80mm), style reçu de caisse
- **Usage**: Petites livraisons, clients au comptoir
- **Basé sur**: `report_ticket.jrxml`

## Caractéristiques par Format

### Format Complet
```
- Taille: A4 (210x297mm)
- En-tête entreprise complet
- Informations client détaillées
- Tableau avec toutes les colonnes
- Totaux avec TVA
- Montant en lettres (réglementaire)
- Sections signatures
- Notes et conditions
```

### Format Réduit
```
- Taille: A4 mais layout compact
- En-tête simplifié
- Informations essentielles seulement
- Tableau condensé
- Total simple
- Pas de signatures
- Plus rapide à générer
```

### Format Ticket
```
- Taille: 80mm de large (hauteur variable)
- En-tête minimal
- Informations très compactes
- Articles sur 2 lignes (nom + détails)
- Total simple
- Message de remerciement
- Optimisé pour imprimantes thermiques
```

## Implémentation Technique

### Services PDF (`backend/src/services/pdfService.ts`)

#### 1. `generateDeliveryNote()` - Format Complet
- Layout A4 standard
- Toutes les sections complètes
- Montant en lettres inclus

#### 2. `generateSmallDeliveryNote()` - Format Réduit
- Layout compact sur A4
- Colonnes réduites
- Informations essentielles seulement

#### 3. `generateTicketReceipt()` - Format Ticket
- Format personnalisé 80x200mm
- Police plus petite (6-8pt)
- Layout vertical optimisé

### Routes API (`backend/src/routes/pdf.ts`)

```typescript
// Format complet (existant)
GET /api/pdf/delivery-note/:id

// Format réduit (nouveau)
GET /api/pdf/delivery-note-small/:id

// Format ticket (nouveau)
GET /api/pdf/delivery-note-ticket/:id
```

### Interface Utilisateur

Dans `frontend/app/delivery-notes/[id]/page.tsx`, 3 boutons sont disponibles :

```jsx
📄 BL Complet  - Format officiel complet
📄 BL Réduit   - Format compact rapide  
🎫 Ticket      - Format caisse 80mm
```

## Utilisation

1. **Naviguer vers un bon de livraison** : `http://localhost:3000/delivery-notes/list`
2. **Cliquer sur un BL** pour voir les détails
3. **Choisir le format souhaité** :
   - **BL Complet** : Pour documents officiels
   - **BL Réduit** : Pour usage interne rapide
   - **Ticket** : Pour petites livraisons/comptoir

## Avantages

### Format Complet
- ✅ Conforme aux réglementations
- ✅ Toutes les informations légales
- ✅ Présentation professionnelle

### Format Réduit
- ✅ Génération plus rapide
- ✅ Moins d'encre/papier
- ✅ Idéal pour usage interne

### Format Ticket
- ✅ Très compact (80mm)
- ✅ Compatible imprimantes thermiques
- ✅ Parfait pour comptoir/caisse

## Cohérence avec l'Ancien Système

Cette implémentation reproduit fidèlement les 3 formats de l'ancienne application Java NetBeans :
- Même logique de présentation
- Mêmes informations par format
- Même usage selon le contexte
- Compatibilité avec les habitudes utilisateur

## Tests

Pour tester les 3 formats :

1. Créer un bon de livraison
2. Aller dans les détails du BL
3. Cliquer sur chaque bouton PDF
4. Vérifier que chaque format s'affiche correctement

Les 3 PDFs devraient s'ouvrir dans des onglets séparés avec des mises en page différentes mais les mêmes données.