# CORRECTION - Mise à jour du stock avec RPC

## 🚨 PROBLÈME RÉSOLU

L'erreur `"The schema must be one of the following: public, graphql_public"` lors de la mise à jour du stock a été corrigée.

## ✅ SOLUTION APPLIQUÉE

### 1. **Nouvelles fonctions RPC ajoutées**

Ajouté 4 nouvelles fonctions dans `SUPABASE_RPC_FUNCTIONS.sql` :

```sql
-- Récupérer le stock d'un article
get_article_stock(p_tenant, p_narticle)

-- Mettre à jour le stock complet
update_article_stock(p_tenant, p_narticle, p_stock_f, p_stock_bl)

-- Mettre à jour uniquement stock_bl (pour bons de livraison)
update_stock_bl(p_tenant, p_narticle, p_quantity)

-- Mettre à jour uniquement stock_f (pour factures)
update_stock_f(p_tenant, p_narticle, p_quantity)
```

### 2. **Code backend modifié**

**AVANT (ne fonctionnait pas)** :
```typescript
const { data } = await supabaseAdmin
  .schema(tenant)  // ❌ Ne fonctionne pas
  .from('article')
  .update({ stock_bl: newStock })
```

**APRÈS (fonctionne maintenant)** :
```typescript
const { data } = await supabaseAdmin.rpc('update_stock_bl', {
  p_tenant: tenant,  // ✅ Utilise RPC
  p_narticle: detail.narticle,
  p_quantity: detail.qte
});
```

## 🔧 ACTIONS REQUISES

1. **Exécuter les nouvelles fonctions RPC** dans Supabase SQL Editor
2. **Copier le contenu mis à jour** de `SUPABASE_RPC_FUNCTIONS.sql`
3. **Tester la création** d'un bon de livraison et d'une facture

## 🎯 RÉSULTATS ATTENDUS

Après avoir exécuté les nouvelles fonctions RPC :

- ✅ **Plus d'erreur "schema must be one of"**
- ✅ **Stock BL mis à jour automatiquement** lors de la création de bons de livraison
- ✅ **Stock Facture mis à jour automatiquement** lors de la création de factures
- ✅ **Messages de succès** : "📦 Stock BL/facture updated for article"

## 📊 FONCTIONS TOTALES

Le fichier `SUPABASE_RPC_FUNCTIONS.sql` contient maintenant **16 fonctions** :
- 4 pour BL (delivery notes)
- 4 pour Factures (invoices) 
- 4 pour Proformas
- 4 pour gestion du stock (**NOUVELLES**)

Toutes avec `SECURITY DEFINER` pour les permissions correctes.