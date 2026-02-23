# Fix: Route Dynamique pour Détails BL d'Achat

## Problème
Erreur 404 lors de l'accès aux détails d'un BL d'achat en production:
```
/api/purchases/delivery-notes/60754/MOSTA → 404 Not Found
```

## Cause
La route dynamique `frontend/app/api/purchases/delivery-notes/[nfact]/[nfournisseur]/route.ts` n'existait pas physiquement dans le système de fichiers, bien qu'elle ait été mentionnée dans les commits précédents.

## Solution Appliquée

### 1. Création de la Route Frontend
Créé le fichier: `frontend/app/api/purchases/delivery-notes/[nfact]/[nfournisseur]/route.ts`

Cette route:
- Accepte les paramètres dynamiques `nfact` et `nfournisseur`
- Utilise `BACKEND_URL` pour se connecter au backend (ngrok en production)
- Supporte GET et PUT
- Ajoute les headers nécessaires (X-Tenant, X-Database-Type, ngrok-skip-browser-warning)

### 2. Commit et Déploiement
```bash
git add frontend/app/api/purchases/delivery-notes/[nfact]/[nfournisseur]/route.ts
git commit -m "feat: Add dynamic route for purchase BL details (nfact/nfournisseur)"
git push
```

Commit: `e83e1f6`

## Vérification Backend
La route backend existe déjà dans `backend/src/routes/purchases.ts`:
```typescript
purchases.get('/delivery-notes/:nfact/:nfournisseur', async (c) => {
  // Appelle get_purchase_bl_by_id RPC function
})
```

## Résultat Attendu
Après le redéploiement Vercel (automatique):
- ✅ Liste des BL d'achat fonctionne
- ✅ Détails d'un BL d'achat fonctionnent
- ✅ Modification d'un BL d'achat fonctionne

## Variables d'Environnement Requises
Assurez-vous que `BACKEND_URL` est configurée dans Vercel Dashboard:
```
BACKEND_URL=https://karmen-unordainable-irvin.ngrok-free.dev
```

## Test
Une fois le déploiement terminé, tester:
1. Accéder à la liste des BL d'achat
2. Cliquer sur un BL pour voir les détails
3. Vérifier que les données s'affichent correctement
