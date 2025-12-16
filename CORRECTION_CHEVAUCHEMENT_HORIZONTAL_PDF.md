# CORRECTION CHEVAUCHEMENT HORIZONTAL PDF ✅

## Problème Identifié
**Chevauchement horizontal** entre les informations longues de l'entreprise (côté gauche) et les informations de la proforma (côté droit).

### Exemple du Problème
```
ETS BENAMAR BOUZID MENOUAR Commerce Outillage et Équipements Proforma N: 1
10, Rue Belhandouz A.E.K, Mostaganem, Mostaganem Date: 15/12/2025
                                                   ↑ CHEVAUCHEMENT
```

## Cause du Problème
- Textes d'entreprise trop longs (> 50 caractères)
- Pas de limitation de largeur pour la colonne gauche
- Positionnement simultané des deux colonnes

## Solution Implémentée

### 1. Ordre de Placement Modifié
```typescript
// AVANT: Infos entreprise puis infos proforma
// APRÈS: Infos proforma puis infos entreprise
doc.text(`Proforma N: ${invoiceData.nfact}`, 140, yPos);
doc.text(`Date: ${date}`, 140, yPos + 5);
// Puis revenir à Y=45 pour les infos entreprise
```

### 2. Limitation de Largeur des Textes
```typescript
// Nom entreprise: max 35 caractères
const companyName = companyInfo.name.length > 35 ? 
  companyInfo.name.substring(0, 35) + '...' : companyInfo.name;

// Adresse: max 45 caractères  
const address = companyInfo.address.length > 45 ? 
  companyInfo.address.substring(0, 45) + '...' : companyInfo.address;

// Email: max 35 caractères
const email = companyInfo.email.length > 35 ? 
  companyInfo.email.substring(0, 35) + '...' : companyInfo.email;
```

### 3. Position Fixe pour Éviter Conflits
```typescript
yPos = 45; // Position fixe après placement des infos proforma
```

## Résultat Attendu
```
ETS BENAMAR BOUZID MENOUAR Commerce...    Proforma N: 1
10, Rue Belhandouz A.E.K, Mostaganem...  Date: 15/12/2025
Tél: (213)045.42.35.20
Email: outillagesaada@gmail.com
NIF: 10227010185816600000
RC: 21A3965999-27/00
Art: 100227010185845

Client:
cl1 nom1
Mostaganem
```

## Avantages
✅ **Aucun chevauchement horizontal**
✅ **Lisibilité optimale** des deux colonnes
✅ **Troncature intelligente** des textes longs
✅ **Préservation des informations essentielles**

## Test
Générez une proforma via l'application et vérifiez que :
- Les infos entreprise ne débordent pas sur la droite
- "Proforma N:" et "Date:" sont clairement visibles
- Tous les textes sont lisibles sans chevauchement