-- Migration: Create Payments Table (PostgreSQL)
-- Description: Creates payments table for tracking partial payments on delivery notes and invoices
-- Date: 2026-01-17
-- Requirements: 10.1, 10.2, 10.3, 10.5, 10.6

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  document_type VARCHAR(20) NOT NULL,
  document_id BIGINT NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by BIGINT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by BIGINT,
  
  -- Constraints
  CONSTRAINT chk_amount_positive CHECK (amount > 0),
  CONSTRAINT chk_document_type CHECK (document_type IN ('delivery_note', 'invoice'))
);

-- Create composite index for efficient document payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_tenant_document ON payments(tenant_id, document_type, document_id);

-- Create index on payment_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- Create index on tenant_id for tenant isolation queries
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Tracks partial payments for delivery notes and invoices in multi-tenant system';
COMMENT ON COLUMN payments.id IS 'Primary key - unique payment identifier';
COMMENT ON COLUMN payments.tenant_id IS 'Foreign key to tenant - enforces multi-tenant isolation';
COMMENT ON COLUMN payments.document_type IS 'Type of document: delivery_note or invoice';
COMMENT ON COLUMN payments.document_id IS 'ID of the associated document (delivery note or invoice)';
COMMENT ON COLUMN payments.payment_date IS 'Date when payment was received';
COMMENT ON COLUMN payments.amount IS 'Payment amount - must be greater than zero';
COMMENT ON COLUMN payments.payment_method IS 'Method of payment (cash, check, bank transfer, etc.)';
COMMENT ON COLUMN payments.notes IS 'Optional notes about the payment';
COMMENT ON COLUMN payments.created_at IS 'Timestamp when payment record was created';
COMMENT ON COLUMN payments.created_by IS 'User ID who created the payment record';
COMMENT ON COLUMN payments.updated_at IS 'Timestamp when payment record was last updated';
COMMENT ON COLUMN payments.updated_by IS 'User ID who last updated the payment record';

-- Note: Foreign key constraint on tenant_id should be added based on your tenant table structure
-- Example: ALTER TABLE payments ADD CONSTRAINT fk_payments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
