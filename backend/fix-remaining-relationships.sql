-- 1. Ensure Low Stock FK
-- Article -> Famille
ALTER TABLE article DROP CONSTRAINT IF EXISTS article_famille_fkey;
ALTER TABLE article ADD CONSTRAINT article_famille_fkey FOREIGN KEY (famille) REFERENCES famille_art(famille);

-- 2. Ensure Article -> Fournisseur FK
ALTER TABLE article DROP CONSTRAINT IF EXISTS article_fournisseur_fkey;
ALTER TABLE article ADD CONSTRAINT article_fournisseur_fkey FOREIGN KEY (nfournisseur) REFERENCES fournisseur(nfournisseur);

-- 3. Ensure Bachat -> Bachat Detail FKs
-- Ensure bachat and bachat_detail have correct primary keys first
ALTER TABLE bachat DROP CONSTRAINT IF EXISTS bachat_pkey CASCADE;
ALTER TABLE bachat ADD PRIMARY KEY (nfact);

ALTER TABLE bachat_detail DROP CONSTRAINT IF EXISTS bachat_detail_nfact_fkey;
ALTER TABLE bachat_detail ADD CONSTRAINT bachat_detail_nfact_fkey FOREIGN KEY (nfact) REFERENCES bachat(nfact) ON DELETE CASCADE;

ALTER TABLE bachat_detail DROP CONSTRAINT IF EXISTS bachat_detail_narticle_fkey;
ALTER TABLE bachat_detail ADD CONSTRAINT bachat_detail_narticle_fkey FOREIGN KEY (narticle) REFERENCES article(narticle);

-- 4. Ensure Bachat -> Fournisseur
ALTER TABLE bachat DROP CONSTRAINT IF EXISTS bachat_nfournisseur_fkey;
ALTER TABLE bachat ADD CONSTRAINT bachat_nfournisseur_fkey FOREIGN KEY (nfournisseur) REFERENCES fournisseur(nfournisseur);


-- 5. Force Refresh
NOTIFY pgrst, 'reload config';
