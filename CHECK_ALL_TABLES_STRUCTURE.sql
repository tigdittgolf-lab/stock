-- Vérifier la structure de toutes les tables de vente

-- Table detail_bl
SELECT 'detail_bl' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = '2009_bu02' AND table_name = 'detail_bl'
ORDER BY ordinal_position;

-- Table fact
SELECT 'fact' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = '2009_bu02' AND table_name = 'fact'
ORDER BY ordinal_position;

-- Table detail_fact
SELECT 'detail_fact' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = '2009_bu02' AND table_name = 'detail_fact'
ORDER BY ordinal_position;

-- Table fprof (proforma)
SELECT 'fprof' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = '2009_bu02' AND table_name = 'fprof'
ORDER BY ordinal_position;

-- Table detail_fprof
SELECT 'detail_fprof' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = '2009_bu02' AND table_name = 'detail_fprof'
ORDER BY ordinal_position;

-- Table article (pour update_stock)
SELECT 'article' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = '2009_bu02' AND table_name = 'article'
  AND column_name IN ('narticle', 'Narticle', 'stock_bl', 'stock_f')
ORDER BY ordinal_position;
