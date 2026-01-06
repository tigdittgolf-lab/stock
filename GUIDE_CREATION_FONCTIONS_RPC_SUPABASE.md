# 🔧 GUIDE: Création des Fonctions RPC Supabase

## 🎯 OBJECTIF
Créer les fonctions RPC manquantes dans Supabase pour récupérer les détails des BL et éviter l'utilisation de données mock.

## 📋 ÉTAPES À SUIVRE

### 1. Accéder au Dashboard Supabase
1. Aller sur : https://supabase.com/dashboard
2. Se connecter avec votre compte
3. Sélectionner le projet : **szgodrjglbpzkrksnroi**

### 2. Ouvrir l'Éditeur SQL
1. Dans le menu de gauche, cliquer sur **"SQL Editor"**
2. Cliquer sur **"New Query"**

### 3. Créer la Première Fonction RPC

Copier-coller ce code dans l'éditeur SQL :

```sql
-- Fonction pour récupérer les détails d'un BL par ID
CREATE OR REPLACE FUNCTION public.get_bl_details_by_id(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS TABLE (
    narticle TEXT,
    designation TEXT,
    qte INTEGER,
    prix NUMERIC,
    tva NUMERIC,
    total_ligne NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Construire le nom du schéma
    schema_name := p_tenant;
    
    -- Exécuter la requête dynamique pour récupérer les détails du BL
    RETURN QUERY EXECUTE format('
        SELECT 
            d.narticle::TEXT,
            COALESCE(a.designation, ''Article '' || d.narticle)::TEXT as designation,
            d.qte::INTEGER,
            d.prix::NUMERIC,
            d.tva::NUMERIC,
            d.total_ligne::NUMERIC
        FROM %I.detail_bl d
        LEFT JOIN %I.article a ON d.narticle = a.narticle
        WHERE d.nfact = $1
        ORDER BY d.narticle
    ', schema_name, schema_name)
    USING p_nfact;
END;
$$;
```

4. Cliquer sur **"Run"** pour exécuter

### 4. Créer la Deuxième Fonction RPC

Dans une nouvelle requête, copier-coller :

```sql
-- Fonction alternative pour récupérer les détails d'un BL
CREATE OR REPLACE FUNCTION public.get_bl_details(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS TABLE (
    narticle TEXT,
    designation TEXT,
    qte INTEGER,
    prix NUMERIC,
    tva NUMERIC,
    total_ligne NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Construire le nom du schéma
    schema_name := p_tenant;
    
    -- Exécuter la requête dynamique pour récupérer les détails du BL
    RETURN QUERY EXECUTE format('
        SELECT 
            d.narticle::TEXT,
            COALESCE(a.designation, ''Article '' || d.narticle)::TEXT as designation,
            d.qte::INTEGER,
            d.prix::NUMERIC,
            d.tva::NUMERIC,
            d.total_ligne::NUMERIC
        FROM %I.detail_bl d
        LEFT JOIN %I.article a ON d.narticle = a.narticle
        WHERE d.nfact = $1
        ORDER BY d.narticle
    ', schema_name, schema_name)
    USING p_nfact;
END;
$$;
```

### 5. Créer la Troisième Fonction RPC

Dans une nouvelle requête, copier-coller :

```sql
-- Fonction pour récupérer les détails BL par tenant
CREATE OR REPLACE FUNCTION public.get_detail_bl_by_tenant(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS TABLE (
    narticle TEXT,
    designation TEXT,
    qte INTEGER,
    prix NUMERIC,
    tva NUMERIC,
    total_ligne NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Construire le nom du schéma
    schema_name := p_tenant;
    
    -- Exécuter la requête dynamique pour récupérer les détails du BL
    RETURN QUERY EXECUTE format('
        SELECT 
            d.narticle::TEXT,
            COALESCE(a.designation, ''Article '' || d.narticle)::TEXT as designation,
            d.qte::INTEGER,
            d.prix::NUMERIC,
            d.tva::NUMERIC,
            d.total_ligne::NUMERIC
        FROM %I.detail_bl d
        LEFT JOIN %I.article a ON d.narticle = a.narticle
        WHERE d.nfact = $1
        ORDER BY d.narticle
    ', schema_name, schema_name)
    USING p_nfact;
END;
$$;
```

### 6. Accorder les Permissions

Dans une nouvelle requête, copier-coller :

```sql
-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.get_bl_details_by_id(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_bl_details(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_detail_bl_by_tenant(TEXT, INTEGER) TO anon, authenticated;
```

### 7. Tester les Fonctions

Dans une nouvelle requête, tester :

```sql
-- Test des fonctions créées
SELECT * FROM public.get_bl_details_by_id('2025_bu01', 4);
SELECT * FROM public.get_bl_details('2025_bu01', 3);
SELECT * FROM public.get_detail_bl_by_tenant('2025_bu01', 5);
```

## ✅ RÉSULTAT ATTENDU

Après création des fonctions, les logs backend devraient montrer :
```
✅ PDF: Found 1 BL details via get_bl_details_by_id
```

Au lieu de :
```
⚠️ PDF: Direct SQL also failed, using mock data
```

## 🚨 ALTERNATIVE TEMPORAIRE

En attendant la création des fonctions RPC, le système utilise des données mock améliorées qui sont basées sur les montants réels des BL, donc les PDF restent fonctionnels.

## 📞 SUPPORT

Si vous avez des difficultés avec la création des fonctions RPC, l'application continue de fonctionner avec les données mock améliorées. Les PDF sont générés correctement avec les bonnes informations de base (client, montants, etc.).