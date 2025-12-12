-- Fix foreign key relationships for Supabase schema cache
-- The current tables don't have tenant_id columns, so we'll use simple foreign keys
-- and handle tenant isolation at the application level

-- Add foreign key constraints for sales tables to client
ALTER TABLE fact ADD CONSTRAINT fk_fact_client
FOREIGN KEY (Nclient) REFERENCES client(Nclient) ON DELETE RESTRICT;

ALTER TABLE bl ADD CONSTRAINT fk_bl_client
FOREIGN KEY (Nclient) REFERENCES client(Nclient) ON DELETE RESTRICT;

ALTER TABLE fprof ADD CONSTRAINT fk_fprof_client
FOREIGN KEY (Nclient) REFERENCES client(Nclient) ON DELETE RESTRICT;

-- Add foreign key constraints for detail tables to articles
-- Note: Since articles have tenant_id and year, we need to handle this differently
-- For now, we'll skip these constraints and handle validation in application code

-- Add foreign key constraints for detail tables to their parent tables
-- Note: Since NFact is not globally unique, we'll skip these too
-- The application handles the relationships via business logic

-- Add foreign key constraints for purchase tables to fournisseur
ALTER TABLE fachat ADD CONSTRAINT fk_fachat_fournisseur
FOREIGN KEY (Nfournisseur) REFERENCES fournisseur(Nfournisseur) ON DELETE RESTRICT;

ALTER TABLE bachat ADD CONSTRAINT fk_bachat_fournisseur
FOREIGN KEY (Nfournisseur) REFERENCES fournisseur(Nfournisseur) ON DELETE RESTRICT;