-- Migration: Create WhatsApp Document Sharing Tables
-- Description: Creates all necessary tables for WhatsApp document sharing functionality
-- Date: 2026-01-17
-- Requirements: 7.1, 5.3

-- Enable UUID extension if not already enabled (PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WhatsApp Configuration per Tenant
CREATE TABLE IF NOT EXISTS whatsapp_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  business_account_id VARCHAR(255) NOT NULL,
  phone_number_id VARCHAR(255) NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  webhook_verify_token_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  daily_message_limit INTEGER DEFAULT 1000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

-- Create index for tenant lookup
CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_tenant ON whatsapp_configs(tenant_id);

-- 2. WhatsApp Send History
CREATE TABLE IF NOT EXISTS whatsapp_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  document_id UUID NOT NULL,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('invoice', 'delivery_note', 'proforma')),
  recipient_phone VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(255),
  client_id UUID,
  message_id VARCHAR(255), -- WhatsApp message ID
  custom_message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  file_size INTEGER,
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_sends_tenant_document ON whatsapp_sends(tenant_id, document_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sends_status_created ON whatsapp_sends(status, created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sends_message_id ON whatsapp_sends(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sends_tenant_status ON whatsapp_sends(tenant_id, status);

-- 3. WhatsApp Contacts
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  client_id UUID,
  phone_number VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  is_verified BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create unique constraint and indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_contacts_unique ON whatsapp_contacts(tenant_id, client_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_tenant_phone ON whatsapp_contacts(tenant_id, phone_number);

-- 4. WhatsApp Queue for Background Processing
CREATE TABLE IF NOT EXISTS whatsapp_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  job_data JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status_scheduled ON whatsapp_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_tenant_status ON whatsapp_queue(tenant_id, status);

-- Add comments for documentation
COMMENT ON TABLE whatsapp_configs IS 'WhatsApp Business API configuration per tenant';
COMMENT ON TABLE whatsapp_sends IS 'History of all WhatsApp document sends with status tracking';
COMMENT ON TABLE whatsapp_contacts IS 'WhatsApp contact information linked to clients';
COMMENT ON TABLE whatsapp_queue IS 'Background job queue for WhatsApp message processing';

-- Grant permissions (adjust based on your database user setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_configs TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_sends TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_contacts TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_queue TO your_app_user;