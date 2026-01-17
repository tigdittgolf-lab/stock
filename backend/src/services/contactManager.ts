/**
 * Contact Manager - WhatsApp contact management with multi-tenant isolation
 * Requirements: 2.1, 5.2, 5.5
 */

import { validatePhoneNumber } from '../config/whatsapp.js';

export interface WhatsAppContact {
  id?: string;
  tenantId: string;
  clientId?: string;
  phoneNumber: string;
  name?: string;
  isVerified: boolean;
  lastVerifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContactSearchOptions {
  query?: string;
  clientId?: string;
  isVerified?: boolean;
  limit?: number;
  offset?: number;
}

export class ContactManager {
  private db: any; // Database connection

  constructor(database: any) {
    this.db = database;
  }

  /**
   * Get WhatsApp contacts for a tenant
   */
  async getWhatsAppContacts(
    tenantId: string, 
    options: ContactSearchOptions = {}
  ): Promise<WhatsAppContact[]> {
    console.log(`📋 Getting WhatsApp contacts for tenant ${tenantId}`);
    
    try {
      let query = `
        SELECT id, tenant_id, client_id, phone_number, name, 
               is_verified, last_verified_at, created_at, updated_at
        FROM whatsapp_contacts 
        WHERE tenant_id = $1
      `;
      
      const params: any[] = [tenantId];
      let paramIndex = 2;

      // Add filters
      if (options.clientId) {
        query += ` AND client_id = $${paramIndex}`;
        params.push(options.clientId);
        paramIndex++;
      }

      if (options.isVerified !== undefined) {
        query += ` AND is_verified = $${paramIndex}`;
        params.push(options.isVerified);
        paramIndex++;
      }

      if (options.query) {
        query += ` AND (name ILIKE $${paramIndex} OR phone_number ILIKE $${paramIndex})`;
        params.push(`%${options.query}%`);
        paramIndex++;
      }

      // Add ordering and pagination
      query += ` ORDER BY name ASC, phone_number ASC`;
      
      if (options.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(options.limit);
        paramIndex++;
      }

      if (options.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(options.offset);
      }

      const result = await this.db.query(query, params);
      
      const contacts = result.rows.map((row: any) => ({
        id: row.id,
        tenantId: row.tenant_id,
        clientId: row.client_id,
        phoneNumber: row.phone_number,
        name: row.name,
        isVerified: row.is_verified,
        lastVerifiedAt: row.last_verified_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      console.log(`✅ Found ${contacts.length} contacts for tenant ${tenantId}`);
      return contacts;
    } catch (error) {
      console.error('❌ Error getting WhatsApp contacts:', error);
      throw new Error('Failed to retrieve WhatsApp contacts');
    }
  }

  /**
   * Save WhatsApp number for a client
   */
  async saveWhatsAppNumber(
    clientId: string, 
    phoneNumber: string, 
    tenantId: string,
    name?: string
  ): Promise<WhatsAppContact> {
    console.log(`💾 Saving WhatsApp number for client ${clientId}: ${phoneNumber}`);
    
    try {
      // Validate phone number format
      const validation = this.validateAndFormatNumber(phoneNumber);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid phone number format');
      }

      const formattedNumber = validation.formattedNumber!;

      // Check if contact already exists
      const existingQuery = `
        SELECT id FROM whatsapp_contacts 
        WHERE tenant_id = $1 AND client_id = $2 AND phone_number = $3
      `;
      const existing = await this.db.query(existingQuery, [tenantId, clientId, formattedNumber]);

      if (existing.rows.length > 0) {
        // Update existing contact
        const updateQuery = `
          UPDATE whatsapp_contacts 
          SET name = $1, updated_at = NOW()
          WHERE tenant_id = $2 AND client_id = $3 AND phone_number = $4
          RETURNING *
        `;
        const result = await this.db.query(updateQuery, [name, tenantId, clientId, formattedNumber]);
        
        console.log(`✅ Updated existing WhatsApp contact for client ${clientId}`);
        return this.mapRowToContact(result.rows[0]);
      } else {
        // Insert new contact
        const insertQuery = `
          INSERT INTO whatsapp_contacts (tenant_id, client_id, phone_number, name, is_verified, created_at, updated_at)
          VALUES ($1, $2, $3, $4, false, NOW(), NOW())
          RETURNING *
        `;
        const result = await this.db.query(insertQuery, [tenantId, clientId, formattedNumber, name]);
        
        console.log(`✅ Created new WhatsApp contact for client ${clientId}`);
        return this.mapRowToContact(result.rows[0]);
      }
    } catch (error) {
      console.error('❌ Error saving WhatsApp number:', error);
      throw new Error('Failed to save WhatsApp number');
    }
  }

  /**
   * Validate and format phone number
   */
  validateAndFormatNumber(phoneNumber: string): {
    isValid: boolean;
    formattedNumber?: string;
    error?: string;
  } {
    return validatePhoneNumber(phoneNumber);
  }

  /**
   * Search contacts with query
   */
  async searchContacts(tenantId: string, query: string): Promise<WhatsAppContact[]> {
    console.log(`🔍 Searching contacts for tenant ${tenantId} with query: ${query}`);
    
    return await this.getWhatsAppContacts(tenantId, { 
      query,
      limit: 50 
    });
  }

  /**
   * Verify WhatsApp number (mark as verified)
   */
  async verifyWhatsAppNumber(
    tenantId: string, 
    phoneNumber: string
  ): Promise<boolean> {
    try {
      const validation = this.validateAndFormatNumber(phoneNumber);
      if (!validation.isValid) {
        return false;
      }

      const query = `
        UPDATE whatsapp_contacts 
        SET is_verified = true, last_verified_at = NOW(), updated_at = NOW()
        WHERE tenant_id = $1 AND phone_number = $2
      `;
      
      const result = await this.db.query(query, [tenantId, validation.formattedNumber]);
      
      console.log(`✅ Verified WhatsApp number: ${phoneNumber}`);
      return result.rowCount > 0;
    } catch (error) {
      console.error('❌ Error verifying WhatsApp number:', error);
      return false;
    }
  }

  /**
   * Delete WhatsApp contact
   */
  async deleteContact(tenantId: string, contactId: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM whatsapp_contacts 
        WHERE tenant_id = $1 AND id = $2
      `;
      
      const result = await this.db.query(query, [tenantId, contactId]);
      
      console.log(`🗑️ Deleted WhatsApp contact: ${contactId}`);
      return result.rowCount > 0;
    } catch (error) {
      console.error('❌ Error deleting WhatsApp contact:', error);
      return false;
    }
  }

  /**
   * Get contacts by client ID
   */
  async getContactsByClient(tenantId: string, clientId: string): Promise<WhatsAppContact[]> {
    return await this.getWhatsAppContacts(tenantId, { clientId });
  }

  /**
   * Map database row to contact object
   */
  private mapRowToContact(row: any): WhatsAppContact {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      clientId: row.client_id,
      phoneNumber: row.phone_number,
      name: row.name,
      isVerified: row.is_verified,
      lastVerifiedAt: row.last_verified_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default ContactManager;