-- Migration: 004_add_notes_to_bl
-- Description: Ajouter colonne notes dans table bl
-- Date: 2025-02-09

-- Ajouter la colonne notes
ALTER TABLE bl 
ADD COLUMN IF NOT EXISTS notes TEXT NULL 
COMMENT 'Notes additionnelles sur le bon de livraison';
