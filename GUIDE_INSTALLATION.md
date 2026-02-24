# Guide d'Installation et Utilisation - Application Stock Management

## 📋 Prérequis

- Node.js 18+ installé
- MySQL 8+ OU Supabase (PostgreSQL)
- Git installé
- Un éditeur de code (VS Code recommandé)

## 🚀 Installation Rapide

### 1. Cloner le projet
```bash
git clone https://github.com/tigdittgolf-lab/stock.git
cd stock
```

### 2. Installer les dépendances

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3. Configuration Base de Données

#### Option A: MySQL (Local)

1. Créer la base de données:
```sql
CREATE DATABASE stock_management;
```

2. Créer le fichier `backend/.env`:
```env
# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=stock_management
MYSQL_USER=root
MYSQL_PASSWORD=votre_mot_de_passe

# JWT
JWT_SECRET=votre_secret_jwt_ici
```

3. Importer les schémas (si disponibles):
```bash
mysql -u root -p stock_management < schema.sql
```

#### Option B: Supabase (Cloud)

1. Créer un compte sur [supabase.com](https://supabase.com)

2. Créer un nouveau projet

3. Récupérer les credentials dans Settings > API

4. Créer le fichier `backend/.env`:
```env
# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# JWT
JWT_SECRET=votre_secret_jwt_ici
```

### 4. Configuration Frontend

Créer `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3005
```

## ▶️ Démarrage de l'Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
✅ Backend démarre sur: `http://localhost:3005`

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
✅ Frontend démarre sur: `http://localhost:3000`

## 🔐 Première Connexion

### Créer un utilisateur admin (MySQL)
```sql
INSERT INTO stock_management.users (username, password, role, email)
VALUES ('admin', 'admin123', 'admin', 'admin@example.com');
```

### Créer un tenant (unité commerciale)
```sql
-- Créer le schéma tenant
CREATE DATABASE `2025_bu01`;

-- Ajouter dans la table business_units
INSERT INTO stock_management.business_units (tenant_id, name, description)
VALUES ('2025_bu01', 'Unité Commerciale 1', 'Description');
```

### Se connecter
1. Ouvrir `http://localhost:3000/login`
2. Username: `admin`
3. Password: `admin123`
4. Sélectionner le tenant: `2025_bu01`
5. Sélectionner la base: `MySQL` ou `Supabase`

## 📱 Utilisation de l'Application

### Menu Principal

Après connexion, vous avez accès à:

#### 📦 Gestion des Articles
- **Liste des articles**: Voir tous les produits
- **Ajouter article**: Créer un nouveau produit
- **Modifier/Supprimer**: Gérer les articles existants

#### 👥 Gestion des Clients
- **Liste clients**: Voir tous les clients
- **Ajouter client**: Créer un nouveau client
- **Historique**: Voir les achats par client

#### 🏭 Gestion des Fournisseurs
- **Liste fournisseurs**: Voir tous les fournisseurs
- **Ajouter fournisseur**: Créer un nouveau fournisseur
- **Commandes**: Gérer les commandes fournisseurs

#### 📄 Documents de Vente

**Bons de Livraison (BL)**
1. Aller dans "Ventes" > "Bons de Livraison"
2. Cliquer "Nouveau BL"
3. Sélectionner un client
4. Ajouter des articles (code, quantité, prix)
5. Sauvegarder
6. Imprimer le PDF

**Factures**
1. Aller dans "Ventes" > "Factures"
2. Créer depuis un BL existant OU créer directement
3. Même processus que les BL

**Proformas**
1. Aller dans "Ventes" > "Proformas"
2. Créer un devis pour le client
3. Convertir en BL/Facture plus tard

#### 💰 Gestion des Paiements

**Enregistrer un paiement:**
1. Ouvrir un BL ou une Facture
2. Cliquer sur "💰 Paiements"
3. Cliquer "Ajouter un paiement"
4. Remplir:
   - Montant
   - Date
   - Méthode (Espèces, Chèque, Virement, etc.)
   - Notes (optionnel)
5. Sauvegarder

**Filtrer par statut de paiement:**
1. Dans la liste des BL
2. Cliquer "Filtres"
3. Sélectionner "Statut de paiement":
   - 🟢 Payés totalement
   - 🟡 Partiellement payés
   - 🔴 Non payés (aucun paiement)
4. Les résultats s'affichent instantanément

#### 📊 Rapports et Statistiques

**Tableau de bord:**
- Chiffre d'affaires du jour/mois
- Nombre de documents
- Top clients
- Articles les plus vendus

**Marges:**
1. Aller dans "Rapports" > "Marges"
2. Voir les marges par document
3. Filtrer par période

## 🔧 Fonctionnalités Avancées

### Multi-Tenant (Plusieurs Unités Commerciales)

L'application supporte plusieurs unités commerciales (tenants):
- Chaque tenant a ses propres données (articles, clients, documents)
- Les utilisateurs peuvent accéder à plusieurs tenants
- Changement de tenant sans déconnexion

### Multi-Base de Données

Vous pouvez basculer entre MySQL et Supabase:
1. Cliquer sur l'icône de base de données (en haut à droite)
2. Sélectionner "MySQL" ou "Supabase"
3. Les données se chargent automatiquement

### Impression PDF

Tous les documents (BL, Factures, Proformas) peuvent être imprimés:
1. Ouvrir le document
2. Cliquer "Imprimer"
3. Le PDF s'ouvre dans un nouvel onglet
4. Imprimer ou sauvegarder

### Recherche et Filtres

**Recherche rapide:**
- Taper dans la barre de recherche
- Recherche par numéro, client, montant

**Filtres avancés:**
- Par date (du/au)
- Par montant (min/max)
- Par client
- Par statut de paiement

## 🐛 Dépannage

### Backend ne démarre pas
```bash
# Vérifier que le port 3005 est libre
netstat -ano | findstr :3005

# Vérifier les credentials dans backend/.env
# Vérifier que MySQL/Supabase est accessible
```

### Frontend ne démarre pas
```bash
# Vérifier que le port 3000 est libre
netstat -ano | findstr :3000

# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Erreur de connexion base de données

**MySQL:**
```bash
# Tester la connexion
mysql -u root -p -h localhost

# Vérifier que la base existe
SHOW DATABASES;
```

**Supabase:**
- Vérifier l'URL et la clé dans `.env`
- Vérifier que le projet Supabase est actif
- Tester avec: `node test-supabase-payments-direct.mjs`

### Erreur "Tenant not found"
- Vérifier que le tenant existe dans `business_units`
- Vérifier que le schéma/database du tenant existe
- Créer le tenant si nécessaire

### Filtre de paiement ne fonctionne pas
```bash
# Redémarrer le backend (important!)
cd backend
# Ctrl+C pour arrêter
npm run dev

# Tester
curl http://localhost:3005/api/sales/delivery-notes-by-payment-status?status=paid -H "X-Tenant: 2025_bu01" -H "X-Database-Type: mysql"
```

## 📚 Structure du Projet

```
stock/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Logique métier
│   │   └── middleware/     # Middleware
│   ├── .env               # Configuration (à créer)
│   └── package.json
│
├── frontend/               # Application Next.js
│   ├── app/               # Pages (App Router)
│   ├── components/        # Composants React
│   ├── lib/              # Utilitaires
│   ├── .env.local        # Configuration (à créer)
│   └── package.json
│
└── README.md
```

## 🔑 Commandes Utiles

### Backend
```bash
npm run dev          # Démarrer en mode développement
npm run build        # Compiler pour production
npm start            # Démarrer en production
```

### Frontend
```bash
npm run dev          # Démarrer en mode développement
npm run build        # Compiler pour production
npm start            # Démarrer en production
npm run lint         # Vérifier le code
```

### Git
```bash
git pull             # Récupérer les dernières modifications
git status           # Voir l'état des fichiers
git add .            # Ajouter tous les fichiers
git commit -m "msg"  # Créer un commit
git push             # Envoyer sur GitHub
```

## 📞 Support

En cas de problème:
1. Vérifier les logs du backend (terminal)
2. Vérifier la console du navigateur (F12)
3. Consulter les fichiers de documentation (*.md)
4. Tester avec les scripts de test fournis

## 🎯 Checklist de Démarrage

- [ ] Node.js installé
- [ ] MySQL ou Supabase configuré
- [ ] Dépendances installées (backend + frontend)
- [ ] Fichiers `.env` créés et configurés
- [ ] Base de données créée
- [ ] Backend démarre sur port 3005
- [ ] Frontend démarre sur port 3000
- [ ] Connexion réussie
- [ ] Tenant sélectionné
- [ ] Premier document créé

**Félicitations! Votre application est prête à l'emploi! 🎉**
