-- Migration: 002_add_remise_to_bl
-- Description: Ajouter colonne remise (pourcentage) dans table bl
-- Date: 2025-02-09

-- Ajouter la colonne remise
ALTER TABLE bl 
ADD COLUMN IF NOT EXISTS remise DECIMAL(5,2) DEFAULT 0 
COMMENT 'Remise en pourcentage (ex: 5.00 pour 5%)';

-- Créer un index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_bl_remise ON bl(remise);
