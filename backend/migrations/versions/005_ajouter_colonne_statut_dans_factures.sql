-- Migration: 005_ajouter_colonne_statut_dans_factures
-- Description: Ajouter colonne statut dans factures
-- Table: fact
-- Date: 2026-02-09

ALTER TABLE fact 
ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'en_cours' 
COMMENT 'Statut: en_cours, validee, annulee';

