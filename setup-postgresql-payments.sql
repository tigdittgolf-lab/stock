-- =====================================================
-- CONFIGURATION POSTGRESQL LOCAL
-- Création de la base stock_management et table payments
-- =====================================================

-- 1. Créer la base de données (si elle n'existe pas)
-- Note: Cette commande doit être exécutée séparément
-- CREATE DATABASE stock_management WITH ENCODING 'UTF8';

-- 2. Se connecter à la base
\c stock_management

-- 3. Supprimer la table si elle existe (pour réinstallation propre)
DROP TABLE IF EXISTS payments CASCADE;

-- 4. Créer la table payments
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    document_type VARCHAR(20) NOT NULL,
    document_id BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    
    -- Contraintes
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_document_type CHECK (document_type IN ('delivery_note', 'invoice'))
);

-- 5. Créer les indexes pour performance
CREATE INDEX idx_payments_tenant_document ON payments(tenant_id, document_type, document_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);

-- 6. Créer la fonction de mise à jour automatique du updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer le trigger pour updated_at
CREATE TRIGGER trigger_update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Vérification
SELECT 'Table payments créée avec succès!' AS message;

-- 9. Afficher la structure
\d payments
