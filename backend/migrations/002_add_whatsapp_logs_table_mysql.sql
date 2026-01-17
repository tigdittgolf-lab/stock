-- Migration: Add WhatsApp logs table for enhanced monitoring and debugging (MySQL Version)
-- Requirements: Task 2.3 - Enhanced error handling and logging
-- Created: 2024-01-15

-- MySQL version
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  log_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_whatsapp_logs_tenant_type (tenant_id, log_type),
  INDEX idx_whatsapp_logs_created (created_at),
  INDEX idx_whatsapp_logs_type (log_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments for documentation
ALTER TABLE whatsapp_logs COMMENT = 'Enhanced logging for WhatsApp operations - file size violations, upload errors, send summaries, critical errors';