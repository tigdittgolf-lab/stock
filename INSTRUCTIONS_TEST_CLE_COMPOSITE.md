# Instructions pour Tester le Système avec Clé Composite

## Étapes à suivre

### 1. Redémarrer le serveur backend

```bash
# Arrêter le serveur actuel (Ctrl+C)
# Puis redémarrer
cd backend
npm run dev
```

### 2. Lancer le test

Dans un nouveau terminal :

```bash
node test-purchases-composite-key.js
```

## Résultats Attendus

Le test devrait maintenant :

✅ **TEST 1** : Créer un BL d'achat avec succès
- Numéro: `BL-FOUR1-2025-001`
- Fournisseur: `FOURNISSEUR 1`
- Article: `1000` (Gillet jaune)

✅ **TEST 2** : Rejeter le doublon (même BL + même fournisseur)
- Message d'erreur attendu

✅ **TEST 3** : Créer un BL avec même numéro mais fournisseur différent
- Devrait échouer car `FOURNISSEUR 2` n'existe pas encore dans votre base
- C'est normal !

✅ **TEST 4** : Créer une facture d'achat
- Numéro: `FAC-FOUR1-2025-001`
- Fournisseur: `FOURNISSEUR 1`

✅ **TEST 5** : Récupérer la liste des BL

✅ **TEST 6** : Récupérer un BL spécifique

✅ **TEST 7** : Récupérer la liste des factures

## Données Actuelles dans Votre Base

**Fournisseurs :**
- `FOURNISSEUR 1` (avec espace) ✅

**Articles :**
- `1000` - Gillet jaune - Prix: 1300 DA - Fournisseur: `FOURNISSEUR 1` ✅

## Si Vous Voulez Tester avec 2 Fournisseurs

Créez d'abord un deuxième fournisseur :

```bash
# Utiliser l'API ou l'interface pour créer FOURNISSEUR 2
# Puis relancer le test
```

## Vérifications Rapides

### Vérifier les fournisseurs existants
```bash
node test-check-suppliers.js
```

### Vérifier les articles existants
```bash
node test-check-articles.js
```

## Changements Effectués

1. ✅ Fonctions SQL exécutées sur Supabase
2. ✅ Routes mises à jour dans `backend/index.ts`
3. ✅ Script de test corrigé avec les bonnes données
4. ✅ URL encodée pour gérer l'espace dans "FOURNISSEUR 1"

## Notes Importantes

- Le code fournisseur contient un **espace** : `"FOURNISSEUR 1"` (pas `"FOURNISSEUR1"`)
- Les URLs sont automatiquement encodées pour gérer les espaces
- Le système valide que les articles appartiennent au bon fournisseur
