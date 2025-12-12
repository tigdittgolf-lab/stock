-- 1. Fix Primary Key for Bachat
-- This resolves ERROR: 42830
ALTER TABLE bachat DROP CONSTRAINT IF EXISTS bachat_pkey CASCADE;
ALTER TABLE bachat ADD PRIMARY KEY (nfact);

-- 2. Data Cleaning: Create missing suppliers/families to prevent FK violations
-- (Idempotent: safe to run multiple times)

-- Create missing Suppliers for Articles
INSERT INTO fournisseur (nfournisseur, nom_fournisseur)
SELECT DISTINCT a.nfournisseur, 'Fournisseur Reconstitué'
FROM article a
LEFT JOIN fournisseur f ON a.nfournisseur = f.nfournisseur
WHERE f.nfournisseur IS NULL;

-- Create missing Families for Articles
INSERT INTO famille_art (famille)
SELECT DISTINCT a.famille
FROM article a
LEFT JOIN famille_art f ON a.famille = f.famille
WHERE f.famille IS NULL;

-- Create missing Suppliers for Bachat (Purchase Delivery Notes)
INSERT INTO fournisseur (nfournisseur, nom_fournisseur)
SELECT DISTINCT b.nfournisseur, 'Fournisseur Reconstitué (Achat)'
FROM bachat b
LEFT JOIN fournisseur f ON b.nfournisseur = f.nfournisseur
WHERE f.nfournisseur IS NULL;

-- 3. Apply Foreign Keys

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

-- 4. Force Schema Cache Refresh
NOTIFY pgrst, 'reload config';
