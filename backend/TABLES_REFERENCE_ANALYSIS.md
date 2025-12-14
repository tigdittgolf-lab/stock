# ANALYSE DES TABLES DE RÉFÉRENCE

## 📋 TABLES IDENTIFIÉES POUR LE MODULE RÉGLAGES

### 1. **famille_art** (Familles d'Articles)
- **Usage**: Classification des articles
- **Exemples**: Electricité, Droguerie, Peinture, Outillage, Plomberie, Carrelage
- **Opérations**: CRUD complet (Créer, Lire, Modifier, Supprimer)

### 2. **activite** (Informations Entreprise)
- **Usage**: Données de l'entreprise par BU
- **Exemples**: Nom, Adresse, Téléphone, Email, NIF, RC
- **Opérations**: Lecture, Modification (pas de suppression)

### 3. **Tables Potentielles à Ajouter**
- **unites** (Unités de Mesure): kg, m, pièce, litre, etc.
- **taux_tva** (Taux de TVA): 0%, 9%, 19%, etc.
- **modes_paiement** (Modes de Paiement): Espèces, Chèque, Virement, etc.
- **statuts_commande** (Statuts): En cours, Livré, Annulé, etc.
- **categories_client** (Catégories Client): Particulier, Professionnel, Grossiste
- **devises** (Devises): DZD, EUR, USD

## 🎨 CONCEPTION DU MODULE RÉGLAGES

### Interface Utilisateur
```
📊 Tableau de Bord
📦 Articles
👥 Clients  
🏭 Fournisseurs
💰 Ventes
🛒 Achats
📈 Stock
⚙️  RÉGLAGES ← NOUVEAU MODULE
    ├── 📂 Familles d'Articles
    ├── 🏢 Informations Entreprise
    ├── 📏 Unités de Mesure
    ├── 💱 Taux de TVA
    ├── 💳 Modes de Paiement
    └── 🔧 Paramètres Système
```

### Fonctionnalités par Table
- **Liste** avec pagination et recherche
- **Ajouter** nouveaux éléments
- **Modifier** éléments existants
- **Supprimer** avec confirmation
- **Import/Export** CSV
- **Validation** des données
- **Audit** des modifications