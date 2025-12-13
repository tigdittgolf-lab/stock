# STOCK DEDUCTION FIX - SOLUTION COMPLÈTE

## PROBLÈMES IDENTIFIÉS ET RÉSOLUS

### 1. PROBLÈME: Article 121 affichait des données incorrectes
**SYMPTÔME**: Article 121 montrait `prix_vente: "285.60"` au lieu de `prix_vente: "164.28"`

**CAUSE**: Le fichier `backend/src/routes/articles.ts` contenait plusieurs tableaux de données dupliqués avec des valeurs différentes pour le même article.

**SOLUTION**: ✅ CORRIGÉ
- Supprimé l'ancien fichier `articles.ts` avec des données dupliquées
- Créé un nouveau fichier avec des données cohérentes
- Article 121 affiche maintenant correctement: `prix_vente: "164.28"` et `stock_bl: 133`

### 2. PROBLÈME: Stock non déduit lors de la création de BL et factures
**SYMPTÔME**: Les messages d'erreur montraient:
```
Failed to fetch current stock for article 121: {
  code: "PGRST106",
  message: "The schema must be one of the following: public, graphql_public"
}
```

**CAUSE**: Les fonctions RPC de gestion du stock utilisaient une mauvaise casse pour les noms de colonnes:
- Utilisait: `Narticle` (sans guillemets)
- Devrait être: `"Narticle"` (avec guillemets pour la sensibilité à la casse PostgreSQL)

**SOLUTION**: ✅ FONCTIONS RPC CORRIGÉES
- Créé le fichier `backend/STOCK_RPC_FUNCTIONS_FINAL.sql` avec les bonnes fonctions
- Corrigé la casse des colonnes: `"Narticle"` au lieu de `Narticle`

## ACTIONS REQUISES POUR FINALISER LA CORRECTION

### ÉTAPE 1: Exécuter les fonctions RPC corrigées dans Supabase
```sql
-- Copiez et exécutez le contenu du fichier:
backend/STOCK_RPC_FUNCTIONS_FINAL.sql
```

### ÉTAPE 2: Redémarrer le serveur backend (FAIT)
Le serveur backend a été redémarré pour charger les nouvelles données d'articles.

### ÉTAPE 3: Tester la déduction de stock
1. Créer un nouveau bon de livraison (BL)
2. Vérifier que le `stock_bl` est déduit automatiquement
3. Créer une nouvelle facture
4. Vérifier que le `stock_f` est déduit automatiquement

## FONCTIONS RPC CORRIGÉES

### get_article_stock (CORRIGÉE)
```sql
CREATE OR REPLACE FUNCTION get_article_stock(
  p_tenant TEXT,
  p_narticle VARCHAR(10)
) RETURNS JSON AS $
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT row_to_json(t) FROM (SELECT stock_f, stock_bl FROM %I.article WHERE "Narticle" = $1) t', p_tenant)
  USING p_narticle
  INTO result;
  RETURN result;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

### update_stock_bl (CORRIGÉE - pour BL)
```sql
CREATE OR REPLACE FUNCTION update_stock_bl(
  p_tenant TEXT,
  p_narticle VARCHAR(10),
  p_quantity INTEGER
) RETURNS JSON AS $
DECLARE
  result JSON;
BEGIN
  EXECUTE format('UPDATE %I.article SET stock_bl = stock_bl - $2 WHERE "Narticle" = $1 RETURNING stock_bl', p_tenant)
  USING p_narticle, p_quantity
  INTO result;
  RETURN result;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

### update_stock_f (CORRIGÉE - pour factures)
```sql
CREATE OR REPLACE FUNCTION update_stock_f(
  p_tenant TEXT,
  p_narticle VARCHAR(10),
  p_quantity INTEGER
) RETURNS JSON AS $
DECLARE
  result JSON;
BEGIN
  EXECUTE format('UPDATE %I.article SET stock_f = stock_f - $2 WHERE "Narticle" = $1 RETURNING stock_f', p_tenant)
  USING p_narticle, p_quantity
  INTO result;
  RETURN result;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

## RÉSULTAT ATTENDU APRÈS CORRECTION

### Article 121 (CORRIGÉ)
```json
{
  "narticle": "121",
  "designation": "drog1",
  "famille": "Droguerie",
  "prix_vente": "164.28",  // ✅ Valeur correcte
  "stock_bl": 133,         // ✅ Stock BL correct
  "stock_f": 120           // ✅ Stock facture correct
}
```

### Déduction automatique du stock
- **BL (Bon de Livraison)**: Déduit de `stock_bl`
- **Factures**: Déduit de `stock_f`  
- **Proforma**: Aucune déduction (affichage des prix seulement)

## STATUT
- ✅ Données d'articles corrigées
- ✅ Serveur backend redémarré
- ⏳ **ACTION REQUISE**: Exécuter les fonctions RPC dans Supabase
- ⏳ **TEST REQUIS**: Vérifier la déduction de stock après exécution des RPC

## FICHIERS MODIFIÉS
- `backend/src/routes/articles.ts` - Données d'articles corrigées
- `backend/STOCK_RPC_FUNCTIONS_FINAL.sql` - Fonctions RPC corrigées
- `backend/STOCK_DEDUCTION_FIX.md` - Ce document de correction