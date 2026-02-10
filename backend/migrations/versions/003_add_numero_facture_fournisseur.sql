-- Migration: 003_add_numero_facture_fournisseur
-- Description: Ajouter numéro de facture fournisseur dans bl_achat
-- Date: 2025-02-09

-- Ajouter la colonne pour le numéro de facture fournisseur
ALTER TABLE bl_achat 
ADD COLUMN IF NOT EXISTS numero_facture_fournisseur VARCHAR(50) NULL 
COMMENT 'Numéro de facture du fournisseur';

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_bl_achat_num_fact ON bl_achat(numero_facture_fournisseur);
