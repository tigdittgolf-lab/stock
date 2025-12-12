-- 1. Ensure Unique Constraints on Parent Tables
-- Foreign keys require the referenced columns to be unique (Primary Key or Unique Constraint).
-- We will alter the tables to ensure 'nfact' and 'narticle' are proper Primary Keys.

-- Fact Table
ALTER TABLE fact DROP CONSTRAINT IF EXISTS fact_pkey CASCADE;
ALTER TABLE fact ADD PRIMARY KEY (nfact);

-- BL Table
ALTER TABLE bl DROP CONSTRAINT IF EXISTS bl_pkey CASCADE;
ALTER TABLE bl ADD PRIMARY KEY (nfact);

-- Fprof Table
ALTER TABLE fprof DROP CONSTRAINT IF EXISTS fprof_pkey CASCADE;
ALTER TABLE fprof ADD PRIMARY KEY (nfact);

-- Fachat Table
ALTER TABLE fachat DROP CONSTRAINT IF EXISTS fachat_pkey CASCADE;
ALTER TABLE fachat ADD PRIMARY KEY (nfact);

-- Article Table
ALTER TABLE article DROP CONSTRAINT IF EXISTS article_pkey CASCADE;
ALTER TABLE article ADD PRIMARY KEY (narticle);


-- 2. Re-Apply Foreign Keys (Now that Primary Keys are guaranteed)

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

-- Detail Prof -> Fprof
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


-- 3. Force Refresh
NOTIFY pgrst, 'reload config';
