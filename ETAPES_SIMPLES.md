# ✅ Problème Résolu: BL d'Achat avec MySQL

## Le Problème

Erreur avec MySQL: `🚨 CRITICAL: No valid ID found for BL: {}`

Les BL d'achat fonctionnaient avec Supabase mais pas avec MySQL/PostgreSQL.

## La Cause

MySQL retournait `nbl_achat` mais le frontend cherchait `nbl`, `id`, ou `nfact`.

## La Solution

Ajout des alias dans les requêtes SQL MySQL/PostgreSQL:
```sql
b.Nbl as nbl_achat,  -- Original
b.Nbl as nbl,        -- ✅ Nouveau
b.Nbl as id,         -- ✅ Nouveau
```

## Commits Créés

1. `a83eb3c` - Normalisation structure BL d'achat (liste)
2. `d9e78f1` - Normalisation structure BL d'achat (détail)
3. `73b84a9` - Documentation

## À Tester

1. Redémarrer le backend: `npm run dev` (dans `backend/`)
2. Tester avec MySQL: Liste des BL d'achat
3. Tester avec PostgreSQL: Liste des BL d'achat
4. Tester avec Supabase: Vérifier que ça fonctionne toujours

## Push

Le push a échoué (problème réseau). Réessayer quand la connexion est rétablie:
```bash
git push
```

## Principe Important

**L'application doit retourner la même structure de données pour les 3 bases de données.**

Le `databaseRouter` doit être transparent - le frontend ne doit pas savoir quelle base de données est utilisée.
