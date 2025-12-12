# 📄 Documents à Imprimer

## Vue d'Ensemble

Dans l'application Java originale, vous utilisiez **JasperReports** pour générer des documents PDF. Voici tous les documents qui doivent être imprimés:

---

## 🧾 Documents Commerciaux (Priorité 1 - CRITIQUE)

### 1. Factures de Vente 💰
**Fichiers:** `report_fact.jrxml`

**Contenu:**
- En-tête avec logo et informations entreprise
- Informations client (nom, adresse, NIF, etc.)
- Numéro de facture et date
- Tableau des articles vendus:
  - Code article
  - Désignation
  - Quantité
  - Prix unitaire
  - TVA
  - Total ligne
- Sous-total HT
- Total TVA
- Timbre fiscal
- **Total TTC**
- **Montant en lettres** (ex: "Mille cinq cents dinars")
- Conditions de paiement
- Signature et cachet

**Importance:** ⭐⭐⭐⭐⭐ CRITIQUE
**Utilisation:** Chaque vente

---

### 2. Bons de Livraison (BL) 📦
**Fichiers:** 
- `report_bl.jrxml` (format standard)
- `report_smal_bl.jrxml` (format petit)
- `report_ext_smal_bl.jrxml` (format externe petit)

**Contenu:**
- Informations client
- Numéro de BL et date
- Liste des articles livrés:
  - Code article
  - Désignation
  - Quantité livrée
- Signature du livreur
- Signature du client (réception)

**Importance:** ⭐⭐⭐⭐⭐ CRITIQUE
**Utilisation:** Chaque livraison

---

### 3. Factures Proforma 📋
**Fichiers:** `report_prof.jrxml`

**Contenu:**
- Similaire à la facture
- Marqué "PROFORMA" (pas de valeur légale)
- Devis pour le client
- Validité de l'offre

**Importance:** ⭐⭐⭐⭐ IMPORTANT
**Utilisation:** Devis clients

---

### 4. Bons de Commande 📝
**Fichiers:** 
- `report_bon.jrxml`
- `report_bon1.jrxml`

**Contenu:**
- Informations fournisseur
- Articles commandés
- Quantités
- Prix convenus
- Date de livraison souhaitée

**Importance:** ⭐⭐⭐⭐ IMPORTANT
**Utilisation:** Commandes fournisseurs

---

### 5. Tickets de Caisse 🎫
**Fichiers:**
- `report_ticket.jrxml`
- `report_ticke.jrxml`

**Contenu:**
- Format petit (80mm)
- Articles achetés
- Prix
- Total
- Date et heure
- Numéro de ticket

**Importance:** ⭐⭐⭐ MOYEN
**Utilisation:** Ventes au comptoir

---

## 📊 Rapports de Gestion (Priorité 2)

### 6. Rapport de Stock 📦
**Fichiers:**
- `report_art_stock.jrxml`
- `report_art_stock1.jrxml`

**Contenu:**
- Liste complète des articles
- Stock disponible
- Stock réservé
- Valeur du stock
- Articles en rupture

**Importance:** ⭐⭐⭐⭐ IMPORTANT
**Utilisation:** Inventaire, gestion

---

### 7. Rapport Articles Sous Seuil ⚠️
**Fichiers:** `report_art_seuil.jrxml`

**Contenu:**
- Articles avec stock < seuil
- Quantité actuelle
- Seuil défini
- Fournisseur
- Recommandation de réapprovisionnement

**Importance:** ⭐⭐⭐⭐ IMPORTANT
**Utilisation:** Réapprovisionnement

---

### 8. Rapport de Ventes 💹
**Fichiers:** `report_ventes.jrxml`

**Contenu:**
- Ventes par période
- Ventes par client
- Ventes par article
- Chiffre d'affaires
- Marges

**Importance:** ⭐⭐⭐⭐ IMPORTANT
**Utilisation:** Analyse, comptabilité

---

### 9. Liste des Articles 📋
**Fichiers:**
- `report_article.jrxml`
- `article_report.jrxml`
- `report_art_publ.jrxml` (pour publication)
- `report_art_publa.jrxml`

**Contenu:**
- Catalogue complet
- Code, désignation, prix
- Famille d'articles
- Fournisseur

**Importance:** ⭐⭐⭐ MOYEN
**Utilisation:** Catalogue, tarifs

---

### 10. Annexes et Documents Spéciaux 📎
**Fichiers:** `Report_annexe01.jrxml`

**Contenu:**
- Documents annexes aux factures
- Conditions générales de vente
- Garanties
- Autres documents légaux

**Importance:** ⭐⭐⭐ MOYEN
**Utilisation:** Documents légaux

---

## 🎯 Priorités d'Implémentation

### Phase 1 - URGENT (1 semaine)
1. ✅ **Factures de Vente** - Document légal obligatoire
2. ✅ **Bons de Livraison** - Preuve de livraison
3. ✅ **Conversion nombres en lettres** - Requis pour factures

### Phase 2 - IMPORTANT (1 semaine)
4. ✅ **Factures Proforma** - Devis clients
5. ✅ **Bons de Commande** - Commandes fournisseurs
6. ✅ **Rapport de Stock** - Gestion quotidienne

### Phase 3 - UTILE (1 semaine)
7. ✅ **Rapport Articles Sous Seuil** - Alertes
8. ✅ **Rapport de Ventes** - Analyse
9. ✅ **Tickets de Caisse** - Ventes comptoir

### Phase 4 - OPTIONNEL
10. ✅ **Catalogues et Annexes** - Marketing

---

## 🛠️ Technologies pour l'Impression PDF

### Option 1: PDFKit (Recommandé)
**Avantages:**
- Léger et rapide
- Contrôle total du design
- Génération côté serveur

**Code exemple:**
```typescript
import PDFDocument from 'pdfkit';

const generateInvoice = (invoiceData) => {
  const doc = new PDFDocument();
  
  // En-tête
  doc.fontSize(20).text('FACTURE', { align: 'center' });
  doc.fontSize(12).text(`N° ${invoiceData.numero}`);
  
  // Client
  doc.text(`Client: ${invoiceData.client.nom}`);
  
  // Articles
  invoiceData.articles.forEach(article => {
    doc.text(`${article.designation} - ${article.prix} DA`);
  });
  
  // Total
  doc.fontSize(14).text(`Total: ${invoiceData.total} DA`);
  
  return doc;
};
```

### Option 2: Puppeteer
**Avantages:**
- Utilise HTML/CSS (plus facile)
- Rendu identique au navigateur
- Templates réutilisables

**Code exemple:**
```typescript
import puppeteer from 'puppeteer';

const generatePDF = async (html) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdf;
};
```

### Option 3: React-PDF
**Avantages:**
- Composants React
- Prévisualisation dans le navigateur
- Facile à maintenir

---

## 📋 Éléments Essentiels pour Chaque Document

### Facture Légale (Algérie)
✅ **Obligatoire:**
- Numéro de facture unique
- Date d'émission
- Informations vendeur (NIF, RC, Adresse)
- Informations acheteur (NIF, RC, Adresse)
- Désignation des articles
- Prix unitaire HT
- Taux de TVA
- Montant TVA
- Total TTC
- **Montant en lettres**
- Timbre fiscal (si applicable)
- Conditions de paiement

### Bon de Livraison
✅ **Obligatoire:**
- Numéro de BL
- Date de livraison
- Référence facture (si applicable)
- Articles livrés
- Quantités
- Signature livreur
- Signature client

---

## 💡 Fonctionnalités Spéciales

### 1. Conversion Nombres en Lettres
**Exemple:** 1500 → "Mille cinq cents dinars"

**Langues nécessaires:**
- Français ✅
- Arabe (optionnel)

### 2. Code-barres / QR Code
- QR code avec numéro de facture
- Vérification en ligne
- Traçabilité

### 3. Logo et En-tête
- Logo entreprise
- Coordonnées complètes
- Slogan

### 4. Pied de Page
- Conditions générales
- Informations bancaires
- Mentions légales

---

## 🎨 Design des Documents

### Format Standard
- **Papier:** A4 (210 x 297 mm)
- **Marges:** 20mm de chaque côté
- **Police:** Arial ou similaire
- **Taille:** 10-12pt pour le texte, 14-16pt pour les titres

### Format Ticket
- **Papier:** 80mm de large
- **Longueur:** Variable
- **Police:** Monospace
- **Taille:** 8-10pt

---

## 📊 Exemple de Facture

```
┌─────────────────────────────────────────────────────────┐
│                    VOTRE ENTREPRISE                      │
│              Adresse, Téléphone, Email                   │
│           NIF: XXXXXXXXX  RC: XXXXXXXXX                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  FACTURE N° 2025-001                Date: 09/12/2025    │
│                                                           │
│  Client: ABC SARL                                        │
│  Adresse: 123 Rue Example, Alger                        │
│  NIF: 123456789                                          │
│                                                           │
├─────────────────────────────────────────────────────────┤
│ Code  │ Désignation      │ Qté │ P.U.  │ TVA │ Total   │
├───────┼──────────────────┼─────┼───────┼─────┼─────────┤
│ ART01 │ Article 1        │  10 │ 100DA │ 19% │ 1190DA  │
│ ART02 │ Article 2        │   5 │ 200DA │ 19% │ 1190DA  │
├─────────────────────────────────────────────────────────┤
│                                    Sous-total: 1500.00DA │
│                                          TVA: 285.00DA   │
│                                       Timbre: 0.00DA     │
│                                    ─────────────────────  │
│                                  TOTAL TTC: 1785.00DA    │
│                                                           │
│  Arrêté la présente facture à la somme de:              │
│  Mille sept cent quatre-vingt-cinq dinars               │
│                                                           │
│  Conditions: Paiement à 30 jours                        │
│                                                           │
│  Signature et Cachet                                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Plan d'Action

### Semaine 1: Documents Critiques
- [ ] Installer PDFKit ou Puppeteer
- [ ] Créer template de facture
- [ ] Implémenter conversion nombres en lettres
- [ ] Créer template de bon de livraison
- [ ] Tests et validation

### Semaine 2: Documents Importants
- [ ] Factures proforma
- [ ] Bons de commande
- [ ] Rapports de stock

### Semaine 3: Rapports et Optimisation
- [ ] Rapports de ventes
- [ ] Rapports d'alertes
- [ ] Optimisation et tests

---

## 🎯 Résultat Attendu

Après implémentation, vous pourrez:
1. ✅ Générer des factures PDF légales
2. ✅ Imprimer des bons de livraison
3. ✅ Créer des devis (proforma)
4. ✅ Générer tous les rapports nécessaires
5. ✅ Exporter en PDF pour archivage
6. ✅ Envoyer par email aux clients

---

**Voulez-vous que je commence par implémenter la génération de factures PDF?**
