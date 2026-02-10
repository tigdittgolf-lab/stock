-- =====================================================
-- CONFIGURATION MYSQL LOCAL COMPLÈTE
-- Création de la base stock_management et table payments
-- =====================================================

-- 1. Créer la base de données
CREATE DATABASE IF NOT EXISTS stock_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 2. Utiliser la base
USE stock_management;

-- 3. Créer la table payments
CREATE TABLE IF NOT EXISTS payments (
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
    
    -- Indexes pour performance
    INDEX idx_tenant_document (tenant_id, document_type, document_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_tenant_id (tenant_id),
    
    -- Contraintes
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_document_type CHECK (document_type IN ('delivery_note', 'invoice'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Vérification
SELECT 'Base de données créée avec succès!' AS message;
SELECT 'Table payments créée avec succès!' AS message;

-- 5. Afficher la structure
DESCRIBE payments;

-- 6. Afficher les bases disponibles
SHOW DATABASES;

-- 7. Afficher les tables dans stock_management
SHOW TABLES FROM stock_management;
