# Migration Java NetBeans MySQL vers Next.js + Supabase

## ✅ Fonctionnalités Migrées

### Backend (Hono + Supabase)
- ✅ API Articles (CRUD complet)
- ✅ API Clients (CRUD complet)
- ✅ API Fournisseurs (CRUD complet)
- ✅ API Ventes
  - ✅ Factures (invoices)
  - ✅ Bons de livraison (delivery notes)
  - ✅ Factures proforma
  - ✅ Conversion BL → Facture
- ✅ API Achats
  - ✅ Factures d'achat
  - ✅ Bons de livraison d'achat
  - ✅ Conversion BL achat → Facture
- ✅ API Stock
  - ✅ Résumé du stock
  - ✅ Alertes stock faible
  - ✅ Mouvements de stock
  - ✅ Valorisation par famille
  - ✅ Entrées/sorties manuelles
- ✅ API Rapports
  - ✅ Rapport ventes par période
  - ✅ Rapport ventes par client
  - ✅ Rapport ventes par article
  - ✅ Rapport achats par période
  - ✅ Rapport marges bénéficiaires
  - ✅ Top articles vendus

### Frontend (Next.js + React)
- ✅ Dashboard principal
  - ✅ Statistiques globales
  - ✅ Actions rapides
- ✅ Gestion Articles
  - ✅ Liste des articles
  - ✅ Ajout/Modification/Suppression
  - ✅ Calcul automatique prix de vente
  - ✅ Indicateurs de stock
- ✅ Gestion Clients
  - ✅ Liste des clients
  - ✅ Ajout/Modification/Suppression
- ✅ Gestion Fournisseurs
  - ✅ Liste des fournisseurs
  - ✅ Ajout/Modification/Suppression
- ✅ Page création de factures
  - ✅ Sélection client
  - ✅ Ajout de lignes d'articles
  - ✅ Calcul automatique des totaux
  - ✅ Vérification du stock

## 🚧 Fonctionnalités à Compléter

### Frontend
- ⏳ Gestion des ventes
  - ⏳ Liste des factures
  - ⏳ Détail d'une facture
  - ⏳ Impression de factures
  - ⏳ Liste des bons de livraison
  - ⏳ Conversion BL → Facture
- ⏳ Gestion des achats
  - ⏳ Liste des factures d'achat
  - ⏳ Création facture d'achat
  - ⏳ Liste des BL d'achat
- ⏳ Gestion du stock
  - ⏳ Vue détaillée du stock
  - ⏳ Historique des mouvements
  - ⏳ Entrées/sorties manuelles
  - ⏳ Inventaire
- ⏳ Rapports et statistiques
  - ⏳ Graphiques de ventes
  - ⏳ Analyse des marges
  - ⏳ Rapports personnalisés
  - ⏳ Export PDF/Excel
- ⏳ Gestion financière
  - ⏳ Suivi des paiements clients
  - ⏳ Suivi des paiements fournisseurs
  - ⏳ Échéancier
  - ⏳ Relances

### Base de données
- ⏳ Fonctions PostgreSQL
  - ⏳ update_stock_on_sale
  - ⏳ update_stock_on_purchase
  - ⏳ calculate_client_balance
  - ⏳ calculate_supplier_balance
- ⏳ Triggers
  - ⏳ Auto-update stock on invoice
  - ⏳ Auto-create stock movements
  - ⏳ Validate stock before sale

## 📋 Prochaines Étapes

### Priorité 1 - Fonctionnalités Essentielles
1. Compléter la gestion des ventes
   - Liste et détail des factures
   - Impression des documents
2. Ajouter la gestion des achats
   - Création et liste des factures d'achat
3. Implémenter les fonctions PostgreSQL manquantes
4. Ajouter la validation du stock

### Priorité 2 - Amélioration UX
1. Ajouter des notifications toast
2. Améliorer la navigation
3. Ajouter des filtres et recherche avancée
4. Implémenter la pagination

### Priorité 3 - Fonctionnalités Avancées
1. Système de rapports complet
2. Gestion financière
3. Export de données
4. Authentification et permissions

## 🛠️ Technologies Utilisées

### Backend
- **Runtime**: Bun
- **Framework**: Hono (API REST)
- **Base de données**: Supabase (PostgreSQL)
- **ORM**: Supabase Client

### Frontend
- **Framework**: Next.js 16
- **UI**: React 19
- **Styling**: CSS Modules
- **State Management**: React Hooks

## 🚀 Démarrage

### Backend
```bash
cd backend
bun install
bun run index.ts
```
Le backend démarre sur http://localhost:3005

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Le frontend démarre sur http://localhost:3000

## 📊 Structure de la Base de Données

### Tables Principales
- `article` - Articles/Produits
- `client` - Clients
- `fournisseur` - Fournisseurs
- `fact` - Factures de vente
- `detail_fact` - Lignes de factures de vente
- `bl` - Bons de livraison
- `detail_bl` - Lignes de bons de livraison
- `fachat` - Factures d'achat
- `fachat_detail` - Lignes de factures d'achat
- `bachat` - Bons de livraison d'achat
- `bachat_detail` - Lignes de BL d'achat
- `mouvement_stock` - Historique des mouvements de stock
- `famille_art` - Familles d'articles

## 📝 Notes de Migration

### Différences avec l'Application Java
1. **Interface utilisateur**: Web moderne vs Swing desktop
2. **Base de données**: PostgreSQL (Supabase) vs MySQL
3. **Architecture**: API REST vs connexion directe
4. **Rapports**: À implémenter (remplace JasperReports)
5. **Impression**: À implémenter avec génération PDF côté serveur

### Améliorations Apportées
- Interface responsive et moderne
- API REST pour une meilleure séparation des préoccupations
- Validation côté client et serveur
- Gestion d'erreurs améliorée
- Code TypeScript pour une meilleure maintenabilité

## 🔧 Configuration

### Variables d'Environnement

#### Backend (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=3005
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3005
```

## 📞 Support

Pour toute question ou problème, consultez la documentation ou créez une issue.
