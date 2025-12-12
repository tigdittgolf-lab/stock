-- 1. Safe Foreign Key Recreation (Lowercase)
-- We assume columns are already lowercase (unquoted creation) or we can't rename them easily if they don't exist.
-- Use lowercase names for constraints and references.

-- Detail Fact -> Fact
ALTER TABLE detail_fact DROP CONSTRAINT IF EXISTS detail_fact_nfact_fkey;
ALTER TABLE detail_fact ADD CONSTRAINT detail_fact_nfact_fkey FOREIGN KEY (nfact) REFERENCES fact(nfact) ON DELETE CASCADE;

-- Detail Fact -> Article
ALTER TABLE detail_fact DROP CONSTRAINT IF EXISTS detail_fact_narticle_fkey;
ALTER TABLE detail_fact ADD CONSTRAINT detail_fact_narticle_fkey FOREIGN KEY (narticle) REFERENCES article(narticle);

-- Detail BL -> BL
ALTER TABLE detail_bl DROP CONSTRAINT IF EXISTS detail_bl_nfact_fkey;
ALTER TABLE detail_bl ADD CONSTRAINT detail_bl_nfact_fkey FOREIGN KEY (nfact) REFERENCES bl(nfact) ON DELETE CASCADE;

-- Detail BL -> Article
ALTER TABLE detail_bl DROP CONSTRAINT IF EXISTS detail_bl_narticle_fkey;
ALTER TABLE detail_bl ADD CONSTRAINT detail_bl_narticle_fkey FOREIGN KEY (narticle) REFERENCES article(narticle);

-- Detail Prof -> Prof
ALTER TABLE detail_fprof DROP CONSTRAINT IF EXISTS detail_fprof_nfact_fkey;
ALTER TABLE detail_fprof ADD CONSTRAINT detail_fprof_nfact_fkey FOREIGN KEY (nfact) REFERENCES fprof(nfact) ON DELETE CASCADE;

-- Detail Prof -> Article
ALTER TABLE detail_fprof DROP CONSTRAINT IF EXISTS detail_fprof_narticle_fkey;
ALTER TABLE detail_fprof ADD CONSTRAINT detail_fprof_narticle_fkey FOREIGN KEY (narticle) REFERENCES article(narticle);

-- Fachat Detail -> Fachat
ALTER TABLE fachat_detail DROP CONSTRAINT IF EXISTS fachat_detail_nfact_fkey;
ALTER TABLE fachat_detail ADD CONSTRAINT fachat_detail_nfact_fkey FOREIGN KEY (nfact) REFERENCES fachat(nfact) ON DELETE CASCADE;

-- Fachat Detail -> Article
ALTER TABLE fachat_detail DROP CONSTRAINT IF EXISTS fachat_detail_narticle_fkey;
ALTER TABLE fachat_detail ADD CONSTRAINT fachat_detail_narticle_fkey FOREIGN KEY (narticle) REFERENCES article(narticle);

-- Article -> Famille
ALTER TABLE article DROP CONSTRAINT IF EXISTS article_famille_fkey;
ALTER TABLE article ADD CONSTRAINT article_famille_fkey FOREIGN KEY (famille) REFERENCES famille_art(famille);

-- Create Bachat tables (Purchase Delivery Notes) if not exists
CREATE TABLE IF NOT EXISTS bachat (
    nfact SERIAL PRIMARY KEY,
    nfournisseur VARCHAR(10) REFERENCES fournisseur(nfournisseur),
    date_fact DATE NOT NULL,
    montant_ht NUMERIC(15, 2) NOT NULL,
    timbre NUMERIC(15, 2) NOT NULL,
    tva NUMERIC(15, 2) NOT NULL,
    autre_taxe NUMERIC(15, 2) NOT NULL,
    banq VARCHAR(255),
    ncheque VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS bachat_detail (
    id SERIAL PRIMARY KEY,
    nfact INTEGER NOT NULL REFERENCES bachat(nfact) ON DELETE CASCADE,
    narticle VARCHAR(10) NOT NULL REFERENCES article(narticle),
    qte INTEGER NOT NULL,
    tva NUMERIC(5, 2),
    prix NUMERIC(15, 2) NOT NULL,
    total_ligne NUMERIC(15, 2) NOT NULL,
    facturer BOOLEAN DEFAULT FALSE
);

-- Force Schema Refresh
NOTIFY pgrst, 'reload config';
