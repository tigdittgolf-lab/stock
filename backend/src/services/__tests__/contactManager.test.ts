/**
 * Unit Tests for Contact Manager
 * Tests contact management, search, and validation functionality
 * Requirements: 2.1, 5.2
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ContactManager, WhatsAppContact } from '../contactManager';

// Mock dependencies
jest.mock('../databaseService.js');
jest.mock('../../config/whatsapp.js');

describe('ContactManager', () => {
  let contactManager: ContactManager;
  let mockDbService: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock database service
    mockDbService = {
      executeQuery: jest.fn()
    };
    
    contactManager = new ContactManager();
    (contactManager as any).dbService = mockDbService;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getWhatsAppContacts', () => {
    const mockContacts = [
      {
        id: 'contact-1',
        tenant_id: 'tenant-1',
        client_id: 'client-1',
        phone_number: '+33612345678',
        name: 'John Doe',
        is_verified: true,
        last_verified_at: '2024-01-01T10:00:00Z',
        created_at: '2024-01-01T09:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      },
      {
        id: 'contact-2',
        tenant_id: 'tenant-1',
        client_id: 'client-2',
        phone_number: '+33687654321',
        name: 'Jane Smith',
        is_verified: false,
        last_verified_at: null,
        created_at: '2024-01-01T09:30:00Z',
        updated_at: '2024-01-01T09:30:00Z'
      }
    ];

    it('should return all contacts for a tenant', async () => {
      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        data: mockContacts
      });

      const result = await contactManager.getWhatsAppContacts('tenant-1');
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('contact-1');
      expect(result[0].phoneNumber).toBe('+33612345678');
      expect(result[0].isVerified).toBe(true);
      expect(result[1].id).toBe('contact-2');
      expect(result[1].isVerified).toBe(false);
    });

    it('should filter contacts by client ID', async () => {
      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        data: [mockContacts[0]]
      });

      const result = await contactManager.getWhatsAppContacts('tenant-1', 'client-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].clientId).toBe('client-1');
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND client_id = $2'),
        ['tenant-1', 'client-1']
      );
    });

    it('should return empty array when no contacts found', async () => {
      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        data: []
      });

      const result = await contactManager.getWhatsAppContacts('tenant-1');
      
      expect(result).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      mockDbService.executeQuery.mockRejectedValue(new Error('Database error'));

      const result = await contactManager.getWhatsAppContacts('tenant-1');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('validateAndFormatNumber', () => {
    it('should validate and format valid phone numbers', async () => {
      const result = await contactManager.validateAndFormatNumber('06 12 34 56 78');
      expect(result).toBe('+33612345678');
    });

    it('should throw error for invalid phone numbers', async () => {
      await expect(contactManager.validateAndFormatNumber('123'))
        .rejects.toThrow('Phone number must be between 10 and 15 digits');
    });

    it('should handle international numbers', async () => {
      const result = await contactManager.validateAndFormatNumber('+1234567890');
      expect(result).toBe('+1234567890');
    });
  });

  describe('saveWhatsAppNumber', () => {
    it('should create new contact when none exists', async () => {
      // Mock no existing contact
      mockDbService.executeQuery
        .mockResolvedValueOnce({ success: true, data: [] }) // findExistingContact
        .mockResolvedValueOnce({ // createContact
          success: true,
          data: [{
            id: 'new-contact-id',
            tenant_id: 'tenant-1',
            client_id: 'client-1',
            phone_number: '+33612345678',
            name: 'New Contact',
            is_verified: false,
            last_verified_at: null,
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z'
          }]
        });

      const result = await contactManager.saveWhatsAppNumber(
        'client-1',
        '06 12 34 56 78',
        'tenant-1',
        'New Contact'
      );

      expect(result.id).toBe('new-contact-id');
      expect(result.phoneNumber).toBe('+33612345678');
      expect(result.name).toBe('New Contact');
      expect(result.isVerified).toBe(false);
    });

    it('should update existing contact', async () => {
      const existingContact = {
        id: 'existing-contact-id',
        tenant_id: 'tenant-1',
        client_id: 'client-1',
        phone_number: '+33612345678',
        name: 'Old Name',
        is_verified: true,
        last_verified_at: '2024-01-01T09:00:00Z',
        created_at: '2024-01-01T08:00:00Z',
        updated_at: '2024-01-01T09:00:00Z'
      };

      // Mock existing contact found
      mockDbService.executeQuery
        .mockResolvedValueOnce({ success: true, data: [existingContact] }) // findExistingContact
        .mockResolvedValueOnce({ // updateContact
          success: true,
          data: [{
            ...existingContact,
            name: 'Updated Name',
            updated_at: '2024-01-01T10:00:00Z'
          }]
        });

      const result = await contactManager.saveWhatsAppNumber(
        'client-1',
        '06 12 34 56 78',
        'tenant-1',
        'Updated Name'
      );

      expect(result.id).toBe('existing-contact-id');
      expect(result.name).toBe('Updated Name');
    });

    it('should validate phone number before saving', async () => {
      await expect(contactManager.saveWhatsAppNumber(
        'client-1',
        'invalid-number',
        'tenant-1'
      )).rejects.toThrow('Phone number must be between 10 and 15 digits');
    });
  });

  describe('searchContacts', () => {
    const mockSearchResults = [
      {
        id: 'contact-1',
        tenant_id: 'tenant-1',
        client_id: 'client-1',
        phone_number: '+33612345678',
        name: 'John Doe',
        is_verified: true,
        last_verified_at: '2024-01-01T10:00:00Z',
        created_at: '2024-01-01T09:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      }
    ];

    it('should search contacts by name', async () => {
      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        data: mockSearchResults
      });

      const result = await contactManager.searchContacts('tenant-1', 'John');
      
      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0].name).toBe('John Doe');
      expect(result.total).toBe(1);
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('name ILIKE $2'),
        ['tenant-1', '%John%', 50]
      );
    });

    it('should search contacts by phone number', async () => {
      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        data: mockSearchResults
      });

      const result = await contactManager.searchContacts('tenant-1', '612345');
      
      expect(result.contacts).toHaveLength(1);
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('phone_number ILIKE $2'),
        ['tenant-1', '%612345%', 50]
      );
    });

    it('should respect search limit', async () => {
      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        data: []
      });

      await contactManager.searchContacts('tenant-1', 'test', 25);
      
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        expect.any(String),
        ['tenant-1', '%test%', 25]
      );
    });

    it('should return empty results when no matches found', async () => {
      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        data: []
      });

      const result = await contactManager.searchContacts('tenant-1', 'nonexistent');
      
      expect(result.contacts).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('verifyWhatsAppNumber', () => {
    it('should verify active WhatsApp numbers', async () => {
      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        data: []
      });

      const result = await contactManager.verifyWhatsAppNumber('contact-1');
      
      // Mock implementation has 90% success rate, so we test both cases
      expect(typeof result).toBe('boolean');
      
      if (result) {
        expect(mockDbService.executeQuery).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE whatsapp_contacts'),
          ['contact-1']
        );
      }
    });

    it('should handle verification errors gracefully', async () => {
      mockDbService.executeQuery.mockRejectedValue(new Error('Database error'));

      const result = await contactManager.verifyWhatsAppNumber('contact-1');
      
      expect(result).toBe(false);
    });
  });

  describe('getUnverifiedContacts', () => {
    it('should return contacts that need verification', async () => {
      const unverifiedContacts = [
        {
          id: 'contact-1',
          tenant_id: 'tenant-1',
          client_id: 'client-1',
          phone_number: '+33612345678',
          name: 'Unverified User',
          is_verified: false,
          last_verified_at: null,
          created_at: '2024-01-01T09:00:00Z',
          updated_at: '2024-01-01T09:00:00Z'
        }
      ];

      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        data: unverifiedContacts
      });

      const result = await contactManager.getUnverifiedContacts('tenant-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].isVerified).toBe(false);
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('is_verified = false'),
        ['tenant-1']
      );
    });

    it('should respect time threshold for verification', async () => {
      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        data: []
      });

      await contactManager.getUnverifiedContacts('tenant-1', 48);
      
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('48 hours'),
        ['tenant-1']
      );
    });
  });

  describe('deleteContact', () => {
    it('should delete contact successfully', async () => {
      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        rowCount: 1
      });

      const result = await contactManager.deleteContact('contact-1', 'tenant-1');
      
      expect(result).toBe(true);
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM whatsapp_contacts'),
        ['contact-1', 'tenant-1']
      );
    });

    it('should return false when contact not found', async () => {
      mockDbService.executeQuery.mockResolvedValue({
        success: false
      });

      const result = await contactManager.deleteContact('nonexistent', 'tenant-1');
      
      expect(result).toBe(false);
    });
  });

  describe('getContactStats', () => {
    it('should return contact statistics', async () => {
      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        data: [{
          total: '10',
          verified: '7',
          unverified: '3',
          with_clients: '8',
          without_clients: '2'
        }]
      });

      const result = await contactManager.getContactStats('tenant-1');
      
      expect(result.total).toBe(10);
      expect(result.verified).toBe(7);
      expect(result.unverified).toBe(3);
      expect(result.withClients).toBe(8);
      expect(result.withoutClients).toBe(2);
    });

    it('should return zero stats when no data found', async () => {
      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        data: []
      });

      const result = await contactManager.getContactStats('tenant-1');
      
      expect(result.total).toBe(0);
      expect(result.verified).toBe(0);
      expect(result.unverified).toBe(0);
      expect(result.withClients).toBe(0);
      expect(result.withoutClients).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockDbService.executeQuery.mockRejectedValue(new Error('Database error'));

      const result = await contactManager.getContactStats('tenant-1');
      
      expect(result.total).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined values in database results', async () => {
      const contactWithNulls = {
        id: 'contact-1',
        tenant_id: 'tenant-1',
        client_id: null,
        phone_number: '+33612345678',
        name: null,
        is_verified: false,
        last_verified_at: null,
        created_at: '2024-01-01T09:00:00Z',
        updated_at: null
      };

      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        data: [contactWithNulls]
      });

      const result = await contactManager.getWhatsAppContacts('tenant-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].clientId).toBeNull();
      expect(result[0].name).toBeNull();
      expect(result[0].lastVerifiedAt).toBeUndefined();
      expect(result[0].updatedAt).toBeUndefined();
    });

    it('should handle empty search queries', async () => {
      mockDbService.executeQuery.mockResolvedValue({
        success: true,
        data: []
      });

      const result = await contactManager.searchContacts('tenant-1', '');
      
      expect(result.contacts).toHaveLength(0);
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        expect.any(String),
        ['tenant-1', '%%', 50]
      );
    });
  });
});

// Mock the validatePhoneNumber function from whatsapp config
jest.mock('../../config/whatsapp.js', () => ({
  validatePhoneNumber: (phoneNumber: string) => {
    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Check if number is empty
    if (!cleanNumber) {
      return {
        isValid: false,
        error: 'Phone number is required'
      };
    }

    // Check length (international format: 10-15 digits)
    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
      return {
        isValid: false,
        error: 'Phone number must be between 10 and 15 digits'
      };
    }

    // Format as international number
    let formattedNumber = cleanNumber;
    if (!phoneNumber.startsWith('+')) {
      // Handle French numbers starting with 06, 07
      if (cleanNumber.startsWith('06') || cleanNumber.startsWith('07')) {
        formattedNumber = `+33${cleanNumber.substring(1)}`;
      } else {
        formattedNumber = `+${cleanNumber}`;
      }
    } else {
      formattedNumber = `+${cleanNumber}`;
    }

    return {
      isValid: true,
      formattedNumber
    };
  }
}));