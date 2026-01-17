-- Migration: Add WhatsApp logs table for enhanced monitoring and debugging
-- Requirements: Task 2.3 - Enhanced error handling and logging
-- Created: 2024-01-15

-- PostgreSQL version
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  log_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_whatsapp_logs_tenant_type (tenant_id, log_type),
  INDEX idx_whatsapp_logs_created (created_at),
  INDEX idx_whatsapp_logs_type (log_type)
);

-- Add comments for documentation
COMMENT ON TABLE whatsapp_logs IS 'Enhanced logging for WhatsApp operations - file size violations, upload errors, send summaries, critical errors';
COMMENT ON COLUMN whatsapp_logs.log_type IS 'Type of log entry: file_size_violation, upload_error, upload_failure, send_summary, critical_error';
COMMENT ON COLUMN whatsapp_logs.metadata IS 'Additional structured data related to the log entry';

-- MySQL version (alternative)
-- CREATE TABLE IF NOT EXISTS whatsapp_logs (
--   id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
--   tenant_id VARCHAR(36) NOT NULL,
--   log_type VARCHAR(50) NOT NULL,
--   message TEXT NOT NULL,
--   metadata JSON,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   
--   INDEX idx_whatsapp_logs_tenant_type (tenant_id, log_type),
--   INDEX idx_whatsapp_logs_created (created_at),
--   INDEX idx_whatsapp_logs_type (log_type)
-- );