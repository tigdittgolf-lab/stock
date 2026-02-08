-- Migration: Create payments table for Supabase (PostgreSQL)
-- Feature: client-payment-tracking
-- Task: 1.1 - Create payments table migration with all required columns and constraints
-- Supabase URL: https://szgodrjglbpzkrksnroi.supabase.co

-- Drop table if exists (for clean reinstall)
DROP TABLE IF EXISTS payments CASCADE;

-- Create payments table
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
    
    -- Constraints
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_document_type CHECK (document_type IN ('delivery_note', 'invoice'))
);

-- Create indexes for performance
CREATE INDEX idx_payments_tenant_document ON payments(tenant_id, document_type, document_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Enable Row Level Security (RLS) for multi-tenant isolation
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
-- Note: Adjust this policy based on your authentication setup
CREATE POLICY tenant_isolation_policy ON payments
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', TRUE));

-- Grant permissions
GRANT ALL ON payments TO authenticated;
GRANT ALL ON payments TO service_role;
GRANT USAGE, SELECT ON SEQUENCE payments_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE payments_id_seq TO service_role;

-- Insert test comment to verify table creation
COMMENT ON TABLE payments IS 'Table for tracking client payments on delivery notes and invoices';
COMMENT ON COLUMN payments.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN payments.document_type IS 'Type of document: delivery_note or invoice';
COMMENT ON COLUMN payments.document_id IS 'ID of the associated document';
COMMENT ON COLUMN payments.payment_date IS 'Date when the payment was made';
COMMENT ON COLUMN payments.amount IS 'Payment amount in local currency';
COMMENT ON COLUMN payments.payment_method IS 'Method used for payment (cash, check, bank_transfer, etc.)';

-- Verification query
SELECT 
    'Table created successfully!' as status,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'payments';
