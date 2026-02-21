# 🔧 Instructions pour Corriger les Fonctions RPC Supabase

## ❌ Problème Actuel

Les fonctions RPC Supabase échouent avec ces erreurs:
```
Supabase RPC error: column t.Narticle does not exist
Supabase RPC error: column t.Nclient does not exist
```

**Cause**: Les colonnes en majuscules doivent être entourées de guillemets doubles dans PostgreSQL.

## ✅ Solution

Exécuter le script SQL `FIX_RPC_FUNCTIONS_UPPERCASE_V2.sql` dans Supabase SQL Editor.

## 📋 Étapes à Suivre

### 1. Ouvrir Supabase SQL Editor
1. Aller sur https://supabase.com/dashboard
2. Sélectionner ton projet: `szgodrjglbpzkrksnroi`
3. Cliquer sur "SQL Editor" dans le menu de gauche

### 2. Copier le Script SQL
Le fichier `FIX_RPC_FUNCTIONS_UPPERCASE_V2.sql` contient le script complet.

### 3. Exécuter le Script
1. Coller le contenu du fichier dans l'éditeur SQL
2. Cliquer sur "Run" (ou Ctrl+Enter)
3. Vérifier qu'il n'y a pas d'erreurs

### 4. Vérifier les Résultats
Le script va:
- ✅ Supprimer les anciennes fonctions RPC
- ✅ Créer les nouvelles fonctions avec les guillemets corrects
- ✅ Tester les fonctions sur le schéma `2009_bu02`

Tu devrais voir des résultats JSON pour chaque test:
```json
[{"narticle": 1, "designation": "...", ...}]
[{"nclient": 1, "raison_sociale": "...", ...}]
[{"nfournisseur": 1, "nom_fournisseur": "...", ...}]
```

## 🎯 Fonctions Corrigées

1. **get_articles_by_tenant** - Utilise `t."Narticle"` au lieu de `t.Narticle`
2. **get_clients_by_tenant** - Utilise `t."Nclient"` au lieu de `t.Nclient`
3. **get_suppliers_by_tenant** - Utilise `t."Nfournisseur"` au lieu de `t.Nfournisseur`
4. **get_fournisseurs_by_tenant** - Alias pour get_suppliers_by_tenant

## ⚠️ Important

Après avoir exécuté ce script:
- Les erreurs RPC disparaîtront
- Les listes d'articles, clients et fournisseurs se chargeront correctement
- Plus besoin de fallback adaptatif

## 🔄 Prochaine Étape

Une fois le script exécuté, redémarrer le backend local:
```bash
cd backend
bun run dev
```

Puis tester l'application pour vérifier que tout fonctionne.
