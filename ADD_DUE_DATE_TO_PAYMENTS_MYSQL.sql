-- Ajouter les index pour la colonne due_date
-- Pour MySQL
-- Note: La colonne due_date existe déjà, on ajoute juste les index

-- Créer les index pour améliorer les performances
-- Si les index existent déjà, ignorer les erreurs
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_tenant_due ON payments(tenant_id, due_date);

-- Ajouter un commentaire à la colonne
ALTER TABLE payments MODIFY COLUMN due_date DATE NULL COMMENT 'Date d''échéance du paiement (optionnel)';
