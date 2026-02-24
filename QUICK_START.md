# Quick Start - 5 Minutes ⚡

## Installation Express

```bash
# 1. Cloner
git clone https://github.com/tigdittgolf-lab/stock.git
cd stock

# 2. Backend
cd backend
npm install
```

Créer `backend/.env`:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=stock_management
MYSQL_USER=root
MYSQL_PASSWORD=

SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_key

JWT_SECRET=secret123
```

```bash
# 3. Frontend
cd ../frontend
npm install
```

Créer `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3005
```

## Démarrer

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
cd frontend
npm run dev
```

## Utiliser

1. Ouvrir: `http://localhost:3000/login`
2. Login: `admin` / `admin123`
3. Sélectionner tenant et base de données
4. C'est parti! 🚀

## Fonctionnalités Principales

### Créer un BL
1. Menu "Ventes" > "Bons de Livraison"
2. Cliquer "Nouveau BL"
3. Choisir client
4. Ajouter articles
5. Sauvegarder

### Enregistrer un Paiement
1. Ouvrir un BL
2. Cliquer "💰 Paiements"
3. "Ajouter un paiement"
4. Remplir montant et méthode
5. Sauvegarder

### Filtrer par Paiement
1. Liste des BL
2. Cliquer "Filtres"
3. Choisir statut:
   - 🟢 Payés
   - 🟡 Partiellement payés
   - 🔴 Non payés

### Imprimer PDF
1. Ouvrir un document
2. Cliquer "Imprimer"
3. PDF s'ouvre automatiquement

## Problèmes Courants

**Backend ne démarre pas:**
- Vérifier `.env`
- Vérifier MySQL/Supabase accessible

**Frontend erreur:**
- Vérifier que backend tourne sur port 3005
- Vérifier `.env.local`

**Erreur connexion:**
- Créer la base: `CREATE DATABASE stock_management;`
- Créer un user admin dans la table `users`

**Filtre paiement ne marche pas:**
- Redémarrer le backend (Ctrl+C puis `npm run dev`)

## Ports

- Backend: `http://localhost:3005`
- Frontend: `http://localhost:3000`

## Documentation Complète

Voir `GUIDE_INSTALLATION.md` pour plus de détails.
