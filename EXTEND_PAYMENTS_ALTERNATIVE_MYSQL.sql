-- Alternative pour MySQL: Recréer la table payments avec la nouvelle contrainte
-- À utiliser si la modification de la contrainte ne fonctionne pas

-- ATTENTION: Cette méthode supprime et recrée la table
-- Assurez-vous d'avoir une sauvegarde de vos données!

-- Étape 1: Sauvegarder les données existantes
CREATE TABLE payments_backup AS SELECT * FROM payments;

-- Étape 2: Supprimer l'ancienne table
DROP TABLE payments;

-- Étape 3: Recréer la table avec la nouvelle contrainte
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    document_type VARCHAR(20) NOT NULL,
    document_id BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT,
    
    -- Contraintes
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_document_type CHECK (document_type IN (
        'delivery_note',
        'invoice',
        'purchase_delivery_note',
        'purchase_invoice'
    )),
    
    -- Index
    INDEX idx_payments_tenant_document (tenant_id, document_type, document_id),
    INDEX idx_payments_payment_date (payment_date),
    INDEX idx_payments_tenant_id (tenant_id)
);

-- Étape 4: Restaurer les données
INSERT INTO payments 
SELECT * FROM payments_backup;

-- Étape 5: Vérifier
SELECT 
    'Table recreated successfully!' as status,
    COUNT(*) as total_payments
FROM payments;

-- Étape 6: Supprimer la sauvegarde (optionnel)
-- DROP TABLE payments_backup;
