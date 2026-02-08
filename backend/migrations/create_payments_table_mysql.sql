-- Migration: Create payments table for MySQL
-- Feature: client-payment-tracking
-- Task: 1.1 - Create payments table migration with all required columns and constraints

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
    
    -- Indexes for performance
    INDEX idx_tenant_document (tenant_id, document_type, document_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_tenant_id (tenant_id),
    
    -- Constraints
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_document_type CHECK (document_type IN ('delivery_note', 'invoice'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
