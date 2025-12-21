# Correction des Erreurs de Syntaxe

## Problème
Le fichier `backend/src/routes/sales-clean.ts` a des erreurs de syntaxe après les modifications.

## Solution Simple

### Étape 1 : Sauvegarder et Restaurer
1. **Sauvegardez** votre fichier actuel : `cp backend/src/routes/sales-clean.ts backend/src/routes/sales-clean.ts.backup`

### Étape 2 : Utiliser Git pour Restaurer
```bash
cd backend
git checkout HEAD -- src/routes/sales-clean.ts
```

### Étape 3 : Appliquer Seulement les Corrections Nécessaires
Au lieu de modifier tout le fichier, créons seulement les fonctions RPC nécessaires et gardons le reste intact.

## Alternative : Fonctions RPC Seulement

Pour l'instant, exécutez seulement les fonctions RPC dans Supabase :

1. **Exécutez** `backend/GET_REAL_BL_RPC.sql` dans Supabase
2. **Exécutez** `backend/SALES_REPORT_RPC_CORRECT.sql` dans Supabase
3. **Gardez** le backend tel qu'il était

Cela permettra au rapport des ventes de fonctionner avec les vraies données, même si les listes utilisent encore des données simulées temporairement.

## Test Prioritaire

Le plus important est de tester le **Rapport des Ventes** qui combine tout. Les listes individuelles peuvent être corrigées plus tard.

### Ordre de Priorité :
1. ✅ Rapport des Ventes (avec vraies données)
2. ⏳ Liste BL (peut rester temporaire)  
3. ⏳ Liste Factures (peut rester temporaire)