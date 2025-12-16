# GUIDE : Création des fonctions RPC pour les factures

## PROBLÈME ACTUEL

L'impression PDF échoue avec l'erreur "Tenant header required" et les fonctions RPC `get_fact_with_details` n'existent pas encore dans Supabase.

## SOLUTION IMMÉDIATE

### 1. Correction de l'impression PDF ✅

Le frontend a été corrigé pour envoyer l'en-tête X-Tenant lors de l'impression PDF.

### 2. Création des fonctions RPC manquantes

**ÉTAPES À SUIVRE :**

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet
   - Aller dans "SQL Editor"

2. **Exécuter le script SQL suivant :**

```sql
-- Fonction pour récupérer une facture avec ses détails
CREATE OR REPLACE FUNCTION get_fact_with_details(p_tenant TEXT, p_nfact INTEGER) 
RETURNS JSON AS $$
DECLARE
  result JSON;
  fact_data JSON;
  details_data JSON;
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN NULL;
  END IF;
  
  -- Vérifier si les tables existent
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'fact'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN NULL;
  END IF;
  
  -- Récupérer la facture
  EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM %I.fact WHERE nfact = $1) t', p_tenant) 
  USING p_nfact INTO fact_data;
  
  IF fact_data IS NULL THEN
      RETURN NULL;
  END IF;
  
  -- Récupérer les détails avec enrichissement des articles
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''narticle'', d.narticle,
        ''designation'', COALESCE(a.designation, ''Article '' || d.narticle),
        ''qte'', d.qte,
        ''prix'', d.prix,
        ''tva'', d.tva,
        ''total_ligne'', d.qte * d.prix
      )
    ) 
    FROM %I.detail_fact d
    LEFT JOIN %I.article a ON d.narticle = a.narticle
    WHERE d.nfact = $1
  ', p_tenant, p_tenant) 
  USING p_nfact INTO details_data;
  
  -- Combiner les données
  SELECT json_build_object(
      'nfact', (fact_data->>'nfact')::INTEGER,
      'nclient', fact_data->>'nclient',
      'date_fact', fact_data->>'date_fact',
      'montant_ht', (fact_data->>'montant_ht')::DECIMAL,
      'tva', (fact_data->>'tva')::DECIMAL,
      'total_ttc', (fact_data->>'montant_ht')::DECIMAL + (fact_data->>'tva')::DECIMAL,
      'created_at', fact_data->>'created_at',
      'details', COALESCE(details_data, '[]'::json)
  ) INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer la liste des factures enrichie
CREATE OR REPLACE FUNCTION get_fact_list_enriched(p_tenant TEXT) 
RETURNS JSON AS $$
DECLARE
  result JSON;
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN '[]'::json;
  END IF;
  
  -- Vérifier si la table fact existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'fact'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN '[]'::json;
  END IF;
  
  -- Récupérer les factures avec calcul du total TTC
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''nfact'', nfact,
        ''nclient'', nclient,
        ''date_fact'', date_fact,
        ''montant_ht'', montant_ht,
        ''tva'', tva,
        ''total_ttc'', montant_ht + tva,
        ''created_at'', created_at
      )
    ) 
    FROM %I.fact 
    ORDER BY nfact DESC
  ', p_tenant) INTO result;
  
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_fact_with_details TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_fact_list_enriched TO anon, authenticated;

-- Commentaires
COMMENT ON FUNCTION get_fact_with_details IS 'Récupère une facture avec ses détails et articles pour un tenant';
COMMENT ON FUNCTION get_fact_list_enriched IS 'Récupère la liste des factures avec totaux calculés pour un tenant';
```

3. **Cliquer sur "Run" pour exécuter le script**

4. **Vérifier que les fonctions sont créées :**

```sql
-- Test de la fonction get_fact_with_details
SELECT get_fact_with_details('2025_bu01', 1);

-- Test de la fonction get_fact_list_enriched
SELECT get_fact_list_enriched('2025_bu01');
```

## RÉSULTAT ATTENDU

Après avoir exécuté ces fonctions RPC :

1. ✅ **Impression PDF fonctionnelle** - Plus d'erreur "Tenant header required"
2. ✅ **Détails des articles affichés** - Les vraies données des articles apparaîtront
3. ✅ **Performance améliorée** - Utilisation des vraies fonctions RPC au lieu du fallback

## VÉRIFICATION

Une fois les fonctions créées, redémarrer le backend et tester :

1. **Liste des factures** : http://localhost:3000/invoices/list
2. **Détail facture** : http://localhost:3000/invoices/1
3. **Impression PDF** : Cliquer sur le bouton "Imprimer" dans le détail

## ALTERNATIVE TEMPORAIRE

Si vous ne pouvez pas créer les fonctions RPC immédiatement, le système fonctionne déjà avec le fallback intelligent qui affiche les vraies données. Seule l'impression PDF nécessite la correction du frontend (déjà faite).

## STATUT

- ✅ Frontend corrigé pour l'impression PDF
- ⏳ Fonctions RPC à créer dans Supabase (script fourni ci-dessus)
- ✅ Fallback intelligent fonctionnel en attendant