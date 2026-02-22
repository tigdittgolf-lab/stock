# ✅ Corrections - BL et Factures d'Achat

## Problèmes résolus

### 1. ❌ Erreur "Failed to update" malgré success: true
**Cause:** Le backend vérifiait `result.success` alors que la structure retournée est `{data: {...}, error: null}`

**Solution:** Modification dans `backend/src/routes/purchases.ts` ligne ~337
```typescript
// AVANT (incorrect)
if (!result.success) {
  return c.json({ success: false, error: ... }, 500);
}

// APRÈS (correct)
if (result.error) {
  return c.json({ success: false, error: result.error }, 500);
}
```

### 2. 💰 Prix à 0 lors de la sélection d'article
**Cause:** Le code cherchait uniquement `prix_unitaire` mais la base peut avoir `prix_vente` ou `prix_achat`

**Solution:** Essai de plusieurs champs dans l'ordre
```typescript
// Factures d'achat
const prix = article.prix_unitaire || article.prix_vente || article.prix_achat || 0;

// BL d'achat  
const prix = article.prix_achat || article.prix_unitaire || article.prix_vente || 0;
```

**Fichiers modifiés:**
- `frontend/app/purchases/page.tsx`
- `frontend/app/purchases/invoices/[id]/edit/page.tsx`
- `frontend/app/purchases/delivery-notes/page.tsx`
- `frontend/app/purchases/delivery-notes/[numero]/[fournisseur]/edit/page.tsx`

### 3. 🐌 Lenteur et confusion dans le dropdown
**Cause:** Le dropdown affichait "Désignation (Code)" ce qui était long et peu clair

**Solution:** Séparation en deux colonnes
- Colonne 1: Code Article (dropdown avec codes uniquement)
- Colonne 2: Désignation (affichage automatique, non éditable)

### 4. 🔍 Manque de visibilité sur les données
**Solution:** Ajout de logs de débogage

**Frontend (console navigateur):**
```
✅ X articles chargés
📦 Premier article: {...}
🔍 Article sélectionné: {...}
💰 Prix trouvé: X depuis: {prix_unitaire: ..., prix_vente: ..., prix_achat: ...}
```

**Backend (console serveur):**
```
📦 Structure du premier article: {...}
```

## 🔄 IMPORTANT: Redémarrage requis

Les modifications backend ne sont actives qu'après redémarrage du serveur.

### Méthode 1: Script automatique
```powershell
.\restart-backend.ps1
```

### Méthode 2: Manuel
```bash
cd backend
bun run dev
```

## 📋 Checklist de test

1. ✅ Ouvrir la console (F12)
2. ✅ Aller sur une page d'édition de BL/Facture d'achat
3. ✅ Vérifier les logs: "X articles chargés"
4. ✅ Sélectionner un article dans le dropdown
5. ✅ Vérifier que:
   - La désignation s'affiche automatiquement
   - Le prix se remplit (pas 0)
   - Les logs montrent l'article et le prix
6. ✅ Modifier les quantités/prix
7. ✅ Sauvegarder
8. ✅ Vérifier le message de succès (pas d'erreur)

## 🔧 Débogage

Si le prix est toujours à 0:
1. Regarder les logs console: `📦 Premier article: {...}`
2. Identifier quel champ contient le prix
3. Vérifier que ce champ est dans la liste des fallbacks

Si l'erreur "Failed to update" persiste:
1. Vérifier que le backend a été redémarré
2. Vérifier les logs backend
3. Vérifier que le fichier `backend/src/routes/purchases.ts` a bien été modifié

## 📁 Fichiers modifiés

### Backend
- `backend/src/routes/purchases.ts` (ligne ~337)
- `backend/src/routes/sales.ts` (ajout logs)

### Frontend
- `frontend/app/purchases/page.tsx`
- `frontend/app/purchases/invoices/[id]/edit/page.tsx`
- `frontend/app/purchases/delivery-notes/page.tsx`
- `frontend/app/purchases/delivery-notes/[numero]/[fournisseur]/edit/page.tsx`

### Scripts
- `restart-backend.ps1` (nouveau)
- `REDEMARRAGE_BACKEND.md` (nouveau)
