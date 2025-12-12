-- 1. Fix Client Table Case Sensitivity
-- Supabase/PostgreSQL is case sensitive. We need to ensure columns are lowercase or quoted.
-- The error "column client.Nclient does not exist" suggests a mismatch.

ALTER TABLE IF EXISTS client RENAME COLUMN "Nclient" TO nclient;
ALTER TABLE IF EXISTS client RENAME COLUMN "Raison_sociale" TO raison_sociale;
ALTER TABLE IF EXISTS client RENAME COLUMN "C_affaire_fact" TO c_affaire_fact;
ALTER TABLE IF EXISTS client RENAME COLUMN "C_affaire_bl" TO c_affaire_bl;
ALTER TABLE IF EXISTS client RENAME COLUMN "NRC" TO nrc;
ALTER TABLE IF EXISTS client RENAME COLUMN "Date_RC" TO date_rc;
ALTER TABLE IF EXISTS client RENAME COLUMN "Lieu_RC" TO lieu_rc;
ALTER TABLE IF EXISTS client RENAME COLUMN "I_Fiscal" TO i_fiscal;
ALTER TABLE IF EXISTS client RENAME COLUMN "N_article" TO n_article;
ALTER TABLE IF EXISTS client RENAME COLUMN "Tel" TO tel;
ALTER TABLE IF EXISTS client RENAME COLUMN "Commentaire" TO commentaire;

-- 2. Fix Article Table Case Sensitivity
ALTER TABLE IF EXISTS article RENAME COLUMN "Narticle" TO narticle;
ALTER TABLE IF EXISTS article RENAME COLUMN "Nfournisseur" TO nfournisseur;

-- 3. Fix Fournisseur Table Case Sensitivity
ALTER TABLE IF EXISTS fournisseur RENAME COLUMN "Nfournisseur" TO nfournisseur;
ALTER TABLE IF EXISTS fournisseur RENAME COLUMN "Nom_fournisseur" TO nom_fournisseur;
ALTER TABLE IF EXISTS fournisseur RENAME COLUMN "Resp_fournisseur" TO resp_fournisseur;
ALTER TABLE IF EXISTS fournisseur RENAME COLUMN "Adresse_fourni" TO adresse_fourni;
ALTER TABLE IF EXISTS fournisseur RENAME COLUMN "Tel" TO tel;
ALTER TABLE IF EXISTS fournisseur RENAME COLUMN "CAF" TO caf;
ALTER TABLE IF EXISTS fournisseur RENAME COLUMN "CABL" TO cabl;
ALTER TABLE IF EXISTS fournisseur RENAME COLUMN "EMAIL" TO email;

-- 4. Fix Fact/BL/Prof Tables Case Sensitivity
ALTER TABLE IF EXISTS fact RENAME COLUMN "NFact" TO nfact;
ALTER TABLE IF EXISTS fact RENAME COLUMN "Nclient" TO nclient;
ALTER TABLE IF EXISTS fact RENAME COLUMN "TVA" TO tva;

ALTER TABLE IF EXISTS bl RENAME COLUMN "NFact" TO nfact;
ALTER TABLE IF EXISTS bl RENAME COLUMN "Nclient" TO nclient;
ALTER TABLE IF EXISTS bl RENAME COLUMN "TVA" TO tva;

ALTER TABLE IF EXISTS fprof RENAME COLUMN "NFact" TO nfact;
ALTER TABLE IF EXISTS fprof RENAME COLUMN "Nclient" TO nclient;
ALTER TABLE IF EXISTS fprof RENAME COLUMN "TVA" TO tva;

ALTER TABLE IF EXISTS fachat RENAME COLUMN "NFact" TO nfact;
ALTER TABLE IF EXISTS fachat RENAME COLUMN "Nfournisseur" TO nfournisseur;
ALTER TABLE IF EXISTS fachat RENAME COLUMN "TVA" TO tva;

-- 5. Fix Detail Tables Case Sensitivity
ALTER TABLE IF EXISTS detail_fact RENAME COLUMN "NFact" TO nfact;
ALTER TABLE IF EXISTS detail_fact RENAME COLUMN "Narticle" TO narticle;
ALTER TABLE IF EXISTS detail_fact RENAME COLUMN "Qte" TO qte;

ALTER TABLE IF EXISTS detail_bl RENAME COLUMN "NFact" TO nfact;
ALTER TABLE IF EXISTS detail_bl RENAME COLUMN "Narticle" TO narticle;
ALTER TABLE IF EXISTS detail_bl RENAME COLUMN "Qte" TO qte;

ALTER TABLE IF EXISTS detail_fprof RENAME COLUMN "NFact" TO nfact;
ALTER TABLE IF EXISTS detail_fprof RENAME COLUMN "Narticle" TO narticle;
ALTER TABLE IF EXISTS detail_fprof RENAME COLUMN "Qte" TO qte;

ALTER TABLE IF EXISTS fachat_detail RENAME COLUMN "NFact" TO nfact;
ALTER TABLE IF EXISTS fachat_detail RENAME COLUMN "Narticle" TO narticle;
ALTER TABLE IF EXISTS fachat_detail RENAME COLUMN "Qte" TO qte;


-- 6. Re-establish Relationships (Foreign Keys)
-- Supabase looks for explicit foreign key constraints to build relationships in the API.

-- Article -> Famille
ALTER TABLE article DROP CONSTRAINT IF EXISTS article_famille_fkey;
ALTER TABLE article ADD CONSTRAINT article_famille_fkey FOREIGN KEY (famille) REFERENCES famille_art(famille);

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

-- Bachat Detail -> Bachat (Warning: You might need to create bachat tables first if missing)
-- Assuming bachat exists based on error logs, if not, create it.
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
