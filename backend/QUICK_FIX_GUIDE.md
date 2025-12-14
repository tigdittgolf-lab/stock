# GUIDE DE CORRECTION RAPIDE - "ARTICLE NON TROUVÉ"

## PROBLÈME
La page de modification d'article affiche "Article non trouvé" même pour des articles existants.

## SOLUTION IMMÉDIATE

### ÉTAPE 1: Exécuter les Fonctions SQL ⚠️ CRITIQUE
```sql
-- Dans Supabase SQL Editor, copiez et exécutez TOUT le contenu de:
-- backend/create-all-missing-rpc-functions-fixed.sql
```

**IMPORTANT:** Ce fichier contient maintenant la syntaxe PostgreSQL correcte avec `$$` au lieu de `$`.

### ÉTAPE 2: Vérifier les Fonctions
Après exécution, vérifiez que les fonctions sont créées :
```sql
-- Vérifier les fonctions articles
SELECT proname FROM pg_proc WHERE proname LIKE '%article%';

-- Tester la récupération d'un article
SELECT * FROM get_article_by_id_from_tenant('2025_bu01', 'VOTRE_ARTICLE_ID');
```

### ÉTAPE 3: Tester l'Interface
1. Aller sur `/dashboard?tab=articles`
2. Cliquer "Modifier" sur un article existant
3. Vérifier que les données se chargent

## CHANGEMENTS APPLIQUÉS

### Backend ✅
- **Route optimisée** : Utilise `get_article_by_id_from_tenant` au lieu de filtrer tous les articles
- **Syntaxe SQL corrigée** : Toutes les fonctions utilisent `$$` (syntaxe PostgreSQL valide)

### Frontend ✅
- **API cohérente** : Utilise l'API settings pour les familles (comme la page d'ajout)
- **Gestion d'erreurs** : Fallback vers familles par défaut si l'API échoue

## FICHIERS MODIFIÉS
- `backend/src/routes/articles-clean.ts` - Route GET /:id optimisée
- `backend/create-all-missing-rpc-functions-fixed.sql` - Syntaxe SQL corrigée
- `frontend/app/dashboard/edit-article/[id]/page.tsx` - API settings intégrée

## RÉSULTAT ATTENDU
- ✅ Article chargé avec toutes ses données
- ✅ Familles dynamiques depuis `/settings`
- ✅ Performance optimisée
- ✅ Pas d'erreur "Article non trouvé"

## EN CAS DE PROBLÈME
Si l'erreur persiste :
1. Vérifiez que les fonctions SQL sont bien créées dans Supabase
2. Vérifiez les logs du backend (console)
3. Testez l'API directement : `GET /api/articles/VOTRE_ID`

**PRIORITÉ:** Exécutez d'abord le script SQL, c'est la cause principale du problème.