# 📄 Guide d'Utilisation - Génération de PDF

## ✅ Fonctionnalités Implémentées

### 1. Génération de Factures PDF
- **Endpoint**: `GET /api/pdf/invoice/:id`
- **Description**: Génère un PDF de facture de vente avec toutes les informations légales
- **Contenu**:
  - En-tête avec informations entreprise
  - Informations client (nom, adresse, NIF, RC)
  - Numéro de facture et date
  - Tableau des articles vendus
  - Totaux (HT, TVA, Timbre, TTC)
  - **Montant en lettres** (ex: "mille cinq cents dinars")
  - Espace pour signature et cachet

### 2. Génération de Bons de Livraison PDF
- **Endpoint**: `GET /api/pdf/delivery-note/:id`
- **Description**: Génère un PDF de bon de livraison
- **Contenu**:
  - Informations entreprise
  - Informations client
  - Numéro de BL et date
  - Liste des articles livrés avec quantités
  - Espaces pour signatures (livreur et client)

### 3. Génération de Factures Proforma PDF
- **Endpoint**: `GET /api/pdf/proforma/:id`
- **Description**: Génère un PDF de facture proforma (devis)
- **Contenu**:
  - Identique à la facture
  - Marqué "PROFORMA" en filigrane

### 4. Génération de Factures d'Achat PDF
- **Endpoint**: `GET /api/pdf/purchase-invoice/:id`
- **Description**: Génère un PDF de facture d'achat fournisseur

### 5. Génération de Bons de Livraison d'Achat PDF
- **Endpoint**: `GET /api/pdf/purchase-delivery-note/:id`
- **Description**: Génère un PDF de bon de livraison fournisseur

## 🎯 Comment Utiliser

### Depuis l'Interface Web

1. **Accéder à la liste des factures**:
   - Cliquez sur "Ventes" dans le menu principal
   - Cliquez sur "📋 Liste des Factures"

2. **Imprimer une facture**:
   - Dans la liste, cliquez sur le bouton "📄 Imprimer" à côté de la facture
   - Le PDF s'ouvrira dans un nouvel onglet
   - Vous pouvez ensuite l'imprimer ou le télécharger

### Depuis l'API

```bash
# Générer une facture PDF
curl http://localhost:3005/api/pdf/invoice/1 > facture_1.pdf

# Générer un bon de livraison PDF
curl http://localhost:3005/api/pdf/delivery-note/1 > bl_1.pdf

# Générer une facture proforma PDF
curl http://localhost:3005/api/pdf/proforma/1 > proforma_1.pdf
```

### Depuis le Code JavaScript

```javascript
// Ouvrir le PDF dans un nouvel onglet
window.open('http://localhost:3005/api/pdf/invoice/1', '_blank');

// Télécharger le PDF
fetch('http://localhost:3005/api/pdf/invoice/1')
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'facture_1.pdf';
    a.click();
  });
```

## 🔧 Configuration

### Informations Entreprise

Les informations de l'entreprise sont configurées dans `backend/src/routes/pdf.ts`:

```typescript
const companyInfo = {
  name: 'VOTRE ENTREPRISE',
  address: '123 Rue Example, Alger, Algérie',
  phone: '+213 XX XX XX XX',
  email: 'contact@entreprise.dz',
  nif: '000000000000000',
  rc: '00/00-0000000'
};
```

**Pour personnaliser**: Modifiez ces valeurs avec vos informations réelles.

## 📋 Conversion Nombres en Lettres

La bibliothèque `numberToWords.ts` convertit automatiquement les montants en français:

### Exemples:
- `1500` → "mille cinq cents"
- `1785.50` → "mille sept cent quatre-vingt-cinq dinars et cinquante centimes"
- `999999` → "neuf cent quatre-vingt-dix-neuf mille neuf cent quatre-vingt-dix-neuf"

### Utilisation:
```typescript
import { amountToWordsFr } from './utils/numberToWords';

const amount = 1500.50;
const words = amountToWordsFr(amount, 'dinars', 'centimes');
// Résultat: "mille cinq cents dinars et cinquante centimes"
```

## 🎨 Personnalisation du Design

Le design des PDF est défini dans `backend/src/services/pdfService.ts`.

### Modifier les Polices:
```typescript
doc.setFontSize(12);  // Taille de police
doc.setFont('helvetica', 'bold');  // Police et style
```

### Modifier les Couleurs:
```typescript
doc.setTextColor(255, 0, 0);  // Rouge (RGB)
doc.setDrawColor(0, 0, 0);    // Noir pour les lignes
```

### Modifier les Positions:
```typescript
doc.text('Texte', x, y);  // x et y en millimètres
```

## 📊 Structure des Données

### Facture (Invoice):
```typescript
{
  nfact: number;           // Numéro de facture
  date_fact: string;       // Date (YYYY-MM-DD)
  client: {
    raison_sociale: string;
    adresse?: string;
    nif?: string;
    rc?: string;
  };
  detail_fact: [{
    article: {
      narticle: string;
      designation: string;
    };
    qte: number;
    prix: number;
    tva: number;
    total_ligne: number;
  }];
  montant_ht: number;
  tva: number;
  timbre: number;
  autre_taxe: number;
}
```

## 🚀 Prochaines Étapes

### Phase 2 - Documents Supplémentaires:
- [ ] Tickets de caisse (format 80mm)
- [ ] Rapports de stock
- [ ] Rapports d'alertes de stock
- [ ] Rapports de ventes
- [ ] Catalogues d'articles

### Phase 3 - Améliorations:
- [ ] Ajouter logo entreprise
- [ ] QR Code pour vérification
- [ ] Code-barres
- [ ] Envoi par email automatique
- [ ] Archivage automatique des PDF
- [ ] Templates personnalisables

## 🐛 Dépannage

### Le PDF ne s'affiche pas:
1. Vérifiez que le backend est en cours d'exécution sur le port 3005
2. Vérifiez que la facture existe dans la base de données
3. Consultez les logs du backend pour les erreurs

### Les caractères français ne s'affichent pas correctement:
- jsPDF supporte les caractères français par défaut
- Si problème, vérifiez l'encodage UTF-8

### Le montant en lettres est incorrect:
- Vérifiez la fonction `numberToWordsFr` dans `backend/src/utils/numberToWords.ts`
- Testez avec différents montants

## 📞 Support

Pour toute question ou problème:
1. Consultez les logs du backend: `bun run index.ts`
2. Vérifiez la console du navigateur (F12)
3. Testez l'endpoint directement: `http://localhost:3005/api/pdf/invoice/1`

## ✅ Checklist de Vérification

- [x] Backend installé avec jsPDF
- [x] Routes PDF configurées
- [x] Service PDF créé
- [x] Conversion nombres en lettres implémentée
- [x] Page liste des factures créée
- [x] Bouton d'impression ajouté
- [ ] Informations entreprise personnalisées
- [ ] Logo ajouté (optionnel)
- [ ] Tests avec données réelles

---

**Version**: 1.0.0  
**Date**: 09/12/2025  
**Statut**: ✅ Opérationnel
