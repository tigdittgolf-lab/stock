-- Migration: Create Payments Table (MySQL)
-- Description: Creates payments table for tracking partial payments on delivery notes and invoices
-- Date: 2026-01-17
-- Requirements: 10.1, 10.2, 10.3, 10.5, 10.6

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
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
  
  -- Indexes
  INDEX idx_payments_tenant_document (tenant_id, document_type, document_id),
  INDEX idx_payments_payment_date (payment_date),
  INDEX idx_payments_tenant_id (tenant_id),
  
  -- Constraints
  CONSTRAINT chk_amount_positive CHECK (amount > 0),
  CONSTRAINT chk_document_type CHECK (document_type IN ('delivery_note', 'invoice'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks partial payments for delivery notes and invoices in multi-tenant system';

-- Note: Foreign key constraint on tenant_id should be added based on your tenant table structure
-- Example: ALTER TABLE payments ADD CONSTRAINT fk_payments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
