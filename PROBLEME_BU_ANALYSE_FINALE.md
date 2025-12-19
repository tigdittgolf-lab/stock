# ANALYSE FINALE DU PROBLÈME DES BUSINESS UNITS

## Situation actuelle

### Ce qui fonctionne:
- ✅ La fonction RPC `get_available_exercises()` fonctionne dans Supabase SQL Editor
- ✅ Elle retourne correctement 4 BU: 2026_bu01, 2025_bu01, 2025_bu02, 2024_bu01
- ✅ L'authentification fonctionne

### Ce qui ne fonctionne PAS:
- ❌ L'application affiche `business_units: Array(0)` après connexion
- ❌ La fonction RPC `get_available_exercises()` échoue quand appelée depuis l'application Vercel
- ❌ L'utilisateur voit "User has no business units assigned"

## Diagnostic du problème

### Pourquoi la RPC fonctionne dans SQL Editor mais pas dans l'application?

**Raison probable: PERMISSIONS**

1. **SQL Editor** utilise les permissions de l'administrateur Supabase
2. **Application Vercel** utilise la `SUPABASE_SERVICE_ROLE_KEY` qui peut avoir des restrictions
3. La fonction RPC a besoin de `SECURITY DEFINER` ET de permissions sur `information_schema.schemata`

## Solutions possibles

### Solution 1: Vérifier les permissions de la fonction RPC

Exécutez dans Supabase SQL Editor:

```sql
-- Vérifier que la fonction existe et ses permissions
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proowner::regrole as owner
FROM pg_proc 
WHERE proname = 'get_available_exercises';

-- Donner les permissions explicites
GRANT EXECUTE ON FUNCTION get_available_exercises() TO anon, authenticated, service_role;
```

### Solution 2: Créer une table business_units

Au lieu de scanner `information_schema`, créer une table dédiée:

```sql
CREATE TABLE IF NOT EXISTS public.business_units (
  id SERIAL PRIMARY KEY,
  schema_name TEXT UNIQUE NOT NULL,
  bu_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  nom_entreprise TEXT,
  adresse TEXT,
  telephone TEXT,
  email TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insérer vos BU réels
INSERT INTO public.business_units (schema_name, bu_code, year, nom_entreprise, adresse, telephone, email) VALUES
('2026_bu01', '01', 2026, 'ETS BENAMAR BOUZID MENOUAR', '10, Rue Belhandouz A.E.K, Mostaganem', '(213)045.42.35.20', 'outillagesaada@gmail.com'),
('2025_bu01', '01', 2025, 'ETS BENAMAR BOUZID MENOUAR', '10, Rue Belhandouz A.E.K, Mostaganem', '(213)045.42.35.20', 'outillagesaada@gmail.com'),
('2025_bu02', '02', 2025, 'ETS BENAMAR BOUZID MENOUAR', '10, Rue Belhandouz A.E.K, Mostaganem', '(213)045.42.35.20', 'outillagesaada@gmail.com'),
('2024_bu01', '01', 2024, 'ETS BENAMAR BOUZID MENOUAR', '10, Rue Belhandouz A.E.K, Mostaganem', '(213)045.42.35.20', 'outillagesaada@gmail.com');

-- Activer RLS
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous
CREATE POLICY "Allow read access to all" ON public.business_units FOR SELECT USING (true);

-- Nouvelle fonction RPC qui lit depuis la table
CREATE OR REPLACE FUNCTION get_available_exercises()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT 
      schema_name,
      bu_code,
      year,
      nom_entreprise,
      adresse,
      telephone,
      email,
      active
    FROM public.business_units 
    WHERE active = true
    ORDER BY year DESC, CAST(bu_code AS INTEGER)
  ) t;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Solution 3: Utiliser la table users avec business_units

Stocker les BU directement dans la table users:

```sql
-- Ajouter une colonne business_units à la table users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS business_units TEXT[];

-- Mettre à jour l'utilisateur admin avec tous les BU
UPDATE public.users 
SET business_units = ARRAY['2026_bu01', '2025_bu01', '2025_bu02', '2024_bu01']
WHERE username = 'admin';
```

## Recommandation

**Solution 2 est la meilleure** car:
- ✅ Pas de dépendance sur `information_schema` (permissions complexes)
- ✅ Contrôle total sur les BU disponibles
- ✅ Facile à maintenir et à étendre
- ✅ Fonctionne avec RLS et permissions Supabase standard
- ✅ Pas de hardcode dans l'application

## Action immédiate requise

Choisissez une solution et exécutez le SQL correspondant dans Supabase SQL Editor.
