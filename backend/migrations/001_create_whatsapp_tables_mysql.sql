-- Migration: Create WhatsApp Document Sharing Tables (MySQL Version)
-- Description: Creates all necessary tables for WhatsApp document sharing functionality
-- Date: 2026-01-17
-- Requirements: 7.1, 5.3

-- 1. WhatsApp Configuration per Tenant
CREATE TABLE IF NOT EXISTS whatsapp_configs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  business_account_id VARCHAR(255) NOT NULL,
  phone_number_id VARCHAR(255) NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  webhook_verify_token_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  daily_message_limit INTEGER DEFAULT 1000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_tenant (tenant_id),
  INDEX idx_whatsapp_configs_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. WhatsApp Send History
CREATE TABLE IF NOT EXISTS whatsapp_sends (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  document_id CHAR(36) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(255),
  client_id CHAR(36),
  message_id VARCHAR(255), -- WhatsApp message ID
  custom_message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  file_size INTEGER,
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_whatsapp_sends_tenant_document (tenant_id, document_id),
  INDEX idx_whatsapp_sends_status_created (status, created_at),
  INDEX idx_whatsapp_sends_message_id (message_id),
  INDEX idx_whatsapp_sends_tenant_status (tenant_id, status),
  
  CONSTRAINT chk_document_type CHECK (document_type IN ('invoice', 'delivery_note', 'proforma')),
  CONSTRAINT chk_status CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. WhatsApp Contacts
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  client_id CHAR(36),
  phone_number VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  is_verified BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY idx_whatsapp_contacts_unique (tenant_id, client_id, phone_number),
  INDEX idx_whatsapp_contacts_tenant_phone (tenant_id, phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. WhatsApp Queue for Background Processing
CREATE TABLE IF NOT EXISTS whatsapp_queue (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  job_data JSON NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_whatsapp_queue_status_scheduled (status, scheduled_at),
  INDEX idx_whatsapp_queue_tenant_status (tenant_id, status),
  
  CONSTRAINT chk_queue_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;