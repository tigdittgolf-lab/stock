-- TRANSACTION START
BEGIN;

-- 1. FIX COLUMN NAMES (Ensure Lowercase)
-- We rename only if they exist in uppercase to avoid errors
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bachat' AND column_name = 'NFact') THEN
        ALTER TABLE bachat RENAME COLUMN "NFact" TO nfact;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bachat' AND column_name = 'Nfournisseur') THEN
        ALTER TABLE bachat RENAME COLUMN "Nfournisseur" TO nfournisseur;
    END IF;
    -- Add more if needed, but these are the critical ones for the current errors
END $$;

-- 2. ENSURE PRIMARY KEYS (Critical for Foreign Keys)
ALTER TABLE bachat DROP CONSTRAINT IF EXISTS bachat_pkey CASCADE;
ALTER TABLE bachat ADD CONSTRAINT bachat_pkey PRIMARY KEY (nfact);

ALTER TABLE bachat_detail DROP CONSTRAINT IF EXISTS bachat_detail_pkey CASCADE;
ALTER TABLE bachat_detail ADD CONSTRAINT bachat_detail_pkey PRIMARY KEY (id);

-- 3. DATA REPAIR (Fix Orphaned Records)
-- Ensure 'Auto-Fix' suppliers exist for any Article referencing a missing supplier
INSERT INTO fournisseur (nfournisseur, nom_fournisseur)
SELECT DISTINCT a.nfournisseur, 'Auto-Fix Supplier'
FROM article a
LEFT JOIN fournisseur f ON a.nfournisseur = f.nfournisseur
WHERE f.nfournisseur IS NULL
ON CONFLICT (nfournisseur) DO NOTHING;

-- Ensure 'Auto-Fix' families exist
INSERT INTO famille_art (famille)
SELECT DISTINCT a.famille
FROM article a
LEFT JOIN famille_art f ON a.famille = f.famille
WHERE f.famille IS NULL
ON CONFLICT (famille) DO NOTHING;

-- Ensure 'Auto-Fix' suppliers exist for Bachat
INSERT INTO fournisseur (nfournisseur, nom_fournisseur)
SELECT DISTINCT b.nfournisseur, 'Auto-Fix Supplier (Purchase)'
FROM bachat b
LEFT JOIN fournisseur f ON b.nfournisseur = f.nfournisseur
WHERE f.nfournisseur IS NULL
ON CONFLICT (nfournisseur) DO NOTHING;

-- 4. RE-APPLY FOREIGN KEYS
-- Article -> Famille
ALTER TABLE article DROP CONSTRAINT IF EXISTS article_famille_fkey;
ALTER TABLE article ADD CONSTRAINT article_famille_fkey FOREIGN KEY (famille) REFERENCES famille_art(famille);

-- Article -> Fournisseur
ALTER TABLE article DROP CONSTRAINT IF EXISTS article_fournisseur_fkey;
ALTER TABLE article ADD CONSTRAINT article_fournisseur_fkey FOREIGN KEY (nfournisseur) REFERENCES fournisseur(nfournisseur);

-- Bachat -> Bachat Detail
ALTER TABLE bachat_detail DROP CONSTRAINT IF EXISTS bachat_detail_nfact_fkey;
ALTER TABLE bachat_detail ADD CONSTRAINT bachat_detail_nfact_fkey FOREIGN KEY (nfact) REFERENCES bachat(nfact) ON DELETE CASCADE;

ALTER TABLE bachat_detail DROP CONSTRAINT IF EXISTS bachat_detail_narticle_fkey;
ALTER TABLE bachat_detail ADD CONSTRAINT bachat_detail_narticle_fkey FOREIGN KEY (narticle) REFERENCES article(narticle);

-- Bachat -> Fournisseur
ALTER TABLE bachat DROP CONSTRAINT IF EXISTS bachat_nfournisseur_fkey;
ALTER TABLE bachat ADD CONSTRAINT bachat_nfournisseur_fkey FOREIGN KEY (nfournisseur) REFERENCES fournisseur(nfournisseur);

COMMIT;

-- 5. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload config';
