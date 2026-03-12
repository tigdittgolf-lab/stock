-- Ajouter les colonnes marge et marge_percent si elles n'existent pas

-- Pour la table BL
DO $$
BEGIN
  -- Ajouter colonne marge si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = '2009_bu02' 
    AND table_name = 'bl' 
    AND column_name = 'marge'
  ) THEN
    ALTER TABLE "2009_bu02".bl ADD COLUMN marge NUMERIC DEFAULT 0;
    RAISE NOTICE 'Colonne marge ajoutée à la table bl';
  ELSE
    RAISE NOTICE 'Colonne marge existe déjà dans la table bl';
  END IF;

  -- Ajouter colonne marge_percent si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = '2009_bu02' 
    AND table_name = 'bl' 
    AND column_name = 'marge_percent'
  ) THEN
    ALTER TABLE "2009_bu02".bl ADD COLUMN marge_percent NUMERIC DEFAULT 0;
    RAISE NOTICE 'Colonne marge_percent ajoutée à la table bl';
  ELSE
    RAISE NOTICE 'Colonne marge_percent existe déjà dans la table bl';
  END IF;
END $$;

-- Pour la table FACT
DO $$
BEGIN
  -- Ajouter colonne marge si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = '2009_bu02' 
    AND table_name = 'fact' 
    AND column_name = 'marge'
  ) THEN
    ALTER TABLE "2009_bu02".fact ADD COLUMN marge NUMERIC DEFAULT 0;
    RAISE NOTICE 'Colonne marge ajoutée à la table fact';
  ELSE
    RAISE NOTICE 'Colonne marge existe déjà dans la table fact';
  END IF;

  -- Ajouter colonne marge_percent si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = '2009_bu02' 
    AND table_name = 'fact' 
    AND column_name = 'marge_percent'
  ) THEN
    ALTER TABLE "2009_bu02".fact ADD COLUMN marge_percent NUMERIC DEFAULT 0;
    RAISE NOTICE 'Colonne marge_percent ajoutée à la table fact';
  ELSE
    RAISE NOTICE 'Colonne marge_percent existe déjà dans la table fact';
  END IF;
END $$;

-- Vérifier que les colonnes ont été ajoutées
SELECT 'Colonnes BL' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'bl'
  AND column_name IN ('marge', 'marge_percent');

SELECT 'Colonnes FACT' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'fact'
  AND column_name IN ('marge', 'marge_percent');
