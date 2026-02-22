# 🚀 Guide Rapide: Activer la Modification des BL d'Achat

## 2 Étapes Simples

### 1️⃣ Exécuter le SQL (1 minute)

Ouvrez Supabase et exécutez le fichier `CREATE_UPDATE_PURCHASE_BL_FUNCTIONS.sql`

### 2️⃣ Redémarrer le Backend (30 secondes)

```bash
cd backend
npm run dev
```

## ✅ C'est Tout!

Maintenant vous pouvez:
- Aller sur http://localhost:3001/purchases/delivery-notes/list
- Cliquer sur un BL
- Cliquer sur "Modifier"
- Modifier les données
- Sauvegarder

## 🎯 URLs de Test

- Liste: http://localhost:3001/purchases/delivery-notes/list
- Détail: http://localhost:3001/purchases/delivery-notes/28/ATIA
- Édition: http://localhost:3001/purchases/delivery-notes/28/ATIA/edit

## 📝 Fichiers Modifiés

1. `backend/src/routes/purchases.ts` - Endpoint PUT ajouté
2. `frontend/app/purchases/delivery-notes/[numero]/[fournisseur]/edit/page.tsx` - Page d'édition créée
3. `CREATE_UPDATE_PURCHASE_BL_FUNCTIONS.sql` - Fonction SQL à exécuter
