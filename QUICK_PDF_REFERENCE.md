# 📄 Référence Rapide - Génération PDF

## 🚀 Démarrage Rapide

### Serveurs
```bash
# Backend (Terminal 1)
cd backend
bun run index.ts

# Frontend (Terminal 2)
cd frontend
bun run dev
```

### URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:3005
- API Docs: http://localhost:3005/

## 📋 Endpoints PDF

| Document | Endpoint | Exemple |
|----------|----------|---------|
| Facture | `GET /api/pdf/invoice/:id` | `/api/pdf/invoice/1` |
| Bon de Livraison | `GET /api/pdf/delivery-note/:id` | `/api/pdf/delivery-note/1` |
| Proforma | `GET /api/pdf/proforma/:id` | `/api/pdf/proforma/1` |
| Facture Achat | `GET /api/pdf/purchase-invoice/:id` | `/api/pdf/purchase-invoice/1` |
| BL Achat | `GET /api/pdf/purchase-delivery-note/:id` | `/api/pdf/purchase-delivery-note/1` |

## 🖱️ Interface Utilisateur

### Créer une Facture
1. Dashboard → **Ventes** → **➕ Nouvelle Facture**
2. Sélectionner client et date
3. Ajouter des articles
4. Cliquer sur **Créer la Facture**

### Imprimer une Facture
1. Dashboard → **Ventes** → **📋 Liste des Factures**
2. Cliquer sur **📄 Imprimer**
3. Le PDF s'ouvre dans un nouvel onglet

## 🔧 Personnalisation

### Informations Entreprise
Fichier: `backend/src/routes/pdf.ts`

```typescript
const companyInfo = {
  name: 'VOTRE ENTREPRISE',           // ← Modifier ici
  address: '123 Rue Example, Alger',  // ← Modifier ici
  phone: '+213 XX XX XX XX',          // ← Modifier ici
  email: 'contact@entreprise.dz',     // ← Modifier ici
  nif: '000000000000000',             // ← Modifier ici
  rc: '00/00-0000000'                 // ← Modifier ici
};
```

Après modification:
```bash
# Redémarrer le backend
cd backend
# Arrêter avec Ctrl+C
bun run index.ts
```

## 💡 Exemples de Code

### JavaScript - Ouvrir PDF
```javascript
// Ouvrir dans un nouvel onglet
window.open('http://localhost:3005/api/pdf/invoice/1', '_blank');
```

### JavaScript - Télécharger PDF
```javascript
fetch('http://localhost:3005/api/pdf/invoice/1')
  .then(res => res.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'facture_1.pdf';
    a.click();
  });
```

### Curl - Télécharger PDF
```bash
curl http://localhost:3005/api/pdf/invoice/1 > facture.pdf
```

## 🔢 Conversion Nombres en Lettres

### Exemples
```
1500 → "mille cinq cents"
1785.50 → "mille sept cent quatre-vingt-cinq dinars et cinquante centimes"
```

### Utilisation dans le Code
```typescript
import { amountToWordsFr } from './utils/numberToWords';

const amount = 1500.50;
const words = amountToWordsFr(amount, 'dinars', 'centimes');
// "mille cinq cents dinars et cinquante centimes"
```

## 📊 Structure d'une Facture PDF

```
┌─────────────────────────────────────┐
│           FACTURE                    │
├─────────────────────────────────────┤
│ Entreprise Info    │  Facture N°: 1 │
│ Adresse            │  Date: XX/XX/XX│
│ Tel, Email, NIF    │                │
├─────────────────────────────────────┤
│ Client:                             │
│ Nom, Adresse, NIF                   │
├─────────────────────────────────────┤
│ Code │ Désignation │ Qté │ P.U. │...│
├──────┼─────────────┼─────┼──────┼───┤
│ ART1 │ Article 1   │  10 │ 100  │...│
│ ART2 │ Article 2   │   5 │ 200  │...│
├─────────────────────────────────────┤
│                  Sous-total HT: XXX │
│                         TVA: XXX    │
│                   TOTAL TTC: XXX    │
│                                     │
│ Arrêté à la somme de:               │
│ Mille cinq cents dinars             │
│                                     │
│ Signature et Cachet                 │
└─────────────────────────────────────┘
```

## 🐛 Dépannage

### Le PDF ne s'affiche pas
```bash
# Vérifier que le backend est en cours d'exécution
curl http://localhost:3005/health

# Vérifier les logs du backend
# (dans le terminal où le backend tourne)
```

### Erreur "Invoice not found"
- Vérifier que la facture existe dans la base de données
- Vérifier l'ID de la facture

### Caractères français incorrects
- jsPDF supporte UTF-8 par défaut
- Pas de configuration nécessaire

## 📁 Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `backend/src/services/pdfService.ts` | Service de génération PDF |
| `backend/src/utils/numberToWords.ts` | Conversion nombres en lettres |
| `backend/src/routes/pdf.ts` | Routes API PDF |
| `frontend/app/invoices/list/page.tsx` | Page liste des factures |
| `PDF_GENERATION_GUIDE.md` | Guide complet |

## ✅ Checklist de Vérification

- [ ] Backend démarré sur port 3005
- [ ] Frontend démarré sur port 3000
- [ ] Informations entreprise personnalisées
- [ ] Facture de test créée
- [ ] PDF généré avec succès
- [ ] Montant en lettres correct
- [ ] Impression testée

## 🎯 Prochaines Étapes

1. **Personnaliser** les informations entreprise
2. **Créer** une facture de test
3. **Tester** l'impression
4. **Ajouter** le logo (optionnel)
5. **Déployer** en production

## 📞 Support

- Documentation complète: `PDF_GENERATION_GUIDE.md`
- Statut du projet: `FINAL_STATUS.md`
- Résumé: `PDF_IMPLEMENTATION_SUMMARY.md`

---

**Version**: 1.0  
**Date**: 09/12/2025  
**Statut**: ✅ Opérationnel
