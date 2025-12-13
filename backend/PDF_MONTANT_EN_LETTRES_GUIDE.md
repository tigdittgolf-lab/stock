# GUIDE: MONTANT EN LETTRES DANS LES PDF

## FONCTIONNALITÉ AJOUTÉE

### ✅ Conversion automatique du montant en lettres
- **Conforme à la réglementation algérienne**
- **Intégré dans tous les documents PDF** (factures, bons de livraison, proformas)
- **Format professionnel** avec encadrement du montant

## ENDPOINTS PDF DISPONIBLES

### 1. Factures
```
GET /api/pdf/invoice/:id
Header: X-Tenant: 2025_bu01
```

### 2. Bons de Livraison
```
GET /api/pdf/delivery-note/:id
Header: X-Tenant: 2025_bu01
```

### 3. Proformas
```
GET /api/pdf/proforma/:id
Header: X-Tenant: 2025_bu01
```

### 4. Test de conversion en lettres
```
GET /api/pdf/test-amount-words/1234.56
```
**Résultat**: "Mille deux cent trente-quatre dinars et cinquante-six centimes"

### 5. Test PDF avec données d'exemple
```
GET /api/pdf/test-invoice-pdf
```

## EXEMPLES DE CONVERSION

| Montant | Résultat en lettres |
|---------|-------------------|
| 0 | Zéro dinar |
| 1 | Un dinar |
| 21 | Vingt et un dinars |
| 80 | Quatre-vingts dinars |
| 81 | Quatre-vingt-un dinars |
| 100 | Cent dinars |
| 200 | Deux cents dinars |
| 1000 | Mille dinars |
| 1234.56 | Mille deux cent trente-quatre dinars et cinquante-six centimes |

## FORMAT DANS LES PDF

### Factures et Proformas
```
Arrêté la présente facture à la somme de :
┌─────────────────────────────────────────────────────────────┐
│ MILLE DEUX CENT TRENTE-QUATRE DINARS ET CINQUANTE-SIX      │
│ CENTIMES                                                    │
└─────────────────────────────────────────────────────────────┘
```

### Bons de Livraison
- Note ajoutée : "Ce bon de livraison ne constitue pas une facture"
- Pas de montant en lettres (car pas de facturation)

## CONFORMITÉ RÉGLEMENTAIRE

### ✅ Exigences respectées :
- **Montant en lettres** obligatoire sur les factures
- **Format français** conforme à la réglementation algérienne
- **Devise en dinars** avec centimes
- **Encadrement** du montant pour la lisibilité
- **Capitalisation** appropriée

### 📋 Éléments inclus dans les PDF :
- En-tête avec informations de l'entreprise
- Numéro de document et date
- Informations client
- Détail des articles avec quantités et prix
- Calculs TVA et totaux
- **Montant total en lettres** (NOUVEAU)
- Signatures et cachets

## UTILISATION DANS LE FRONTEND

### Boutons PDF à ajouter dans les interfaces :

#### Page de détail d'une facture :
```tsx
<button 
  onClick={() => window.open(`/api/pdf/invoice/${factureId}`, '_blank')}
  className="btn btn-primary"
>
  📄 Imprimer Facture PDF
</button>
```

#### Page de détail d'un bon de livraison :
```tsx
<button 
  onClick={() => window.open(`/api/pdf/delivery-note/${blId}`, '_blank')}
  className="btn btn-primary"
>
  📄 Imprimer BL PDF
</button>
```

#### Page de détail d'une proforma :
```tsx
<button 
  onClick={() => window.open(`/api/pdf/proforma/${proformaId}`, '_blank')}
  className="btn btn-primary"
>
  📄 Imprimer Proforma PDF
</button>
```

## CONFIGURATION ENTREPRISE

### Modifier les informations de l'entreprise dans `backend/src/routes/pdf.ts` :
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

## TESTS

### 1. Tester la conversion en lettres :
```bash
curl http://localhost:3005/api/pdf/test-amount-words/1234.56
```

### 2. Tester la génération PDF :
```bash
curl http://localhost:3005/api/pdf/test-invoice-pdf > test.pdf
```

### 3. Tester avec de vraies données :
```bash
curl -H "X-Tenant: 2025_bu01" http://localhost:3005/api/pdf/invoice/1 > facture_1.pdf
```

## PROCHAINES ÉTAPES

1. **Démarrer le serveur backend** :
   ```bash
   cd backend
   bun run index.ts
   ```

2. **Tester les endpoints PDF**

3. **Intégrer les boutons PDF dans le frontend**

4. **Personnaliser les informations de l'entreprise**

5. **Tester avec de vraies factures, BL et proformas**

## STATUT
- ✅ Fonction de conversion en lettres créée
- ✅ Service PDF mis à jour avec montant en lettres
- ✅ Routes PDF configurées pour multi-tenant
- ✅ Endpoints de test disponibles
- ⏳ **À FAIRE** : Intégrer dans le frontend
- ⏳ **À FAIRE** : Personnaliser les informations entreprise