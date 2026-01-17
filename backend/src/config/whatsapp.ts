/**
 * WhatsApp Business API Configuration
 * Handles WhatsApp SDK initialization and configuration management
 * Requirements: 7.1, 5.3
 */

import { WhatsApp } from 'whatsapp-mdf';

export interface WhatsAppConfig {
  businessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  webhookVerifyToken: string;
  apiVersion?: string;
  baseUrl?: string;
}

export interface TenantWhatsAppConfig extends WhatsAppConfig {
  tenantId: string;
  isActive: boolean;
  dailyMessageLimit: number;
}

export class WhatsAppManager {
  private static instances: Map<string, WhatsAppManager> = new Map();
  private whatsappClient: WhatsApp;
  private config: WhatsAppConfig;

  private constructor(config: WhatsAppConfig) {
    this.config = config;
    this.whatsappClient = new WhatsApp({
      accessToken: config.accessToken,
      businessAccountId: config.businessAccountId,
      phoneNumberId: config.phoneNumberId,
      webhookVerifyToken: config.webhookVerifyToken,
      apiVersion: config.apiVersion || 'v18.0',
      baseUrl: config.baseUrl
    });
  }

  /**
   * Get WhatsApp manager instance for a specific tenant
   */
  public static getInstance(tenantId: string, config?: WhatsAppConfig): WhatsAppManager {
    const key = `tenant:${tenantId}`;
    
    if (!WhatsAppManager.instances.has(key)) {
      if (!config) {
        throw new Error(`WhatsApp configuration required for tenant ${tenantId}`);
      }
      WhatsAppManager.instances.set(key, new WhatsAppManager(config));
    }
    
    return WhatsAppManager.instances.get(key)!;
  }

  /**
   * Get default WhatsApp manager instance from environment variables
   */
  public static getDefaultInstance(): WhatsAppManager {
    const config: WhatsAppConfig = {
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!,
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0'
    };

    // Validate required configuration
    const requiredFields = ['businessAccountId', 'phoneNumberId', 'accessToken', 'webhookVerifyToken'];
    const missingFields = requiredFields.filter(field => !config[field as keyof WhatsAppConfig]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required WhatsApp configuration: ${missingFields.join(', ')}`);
    }

    return WhatsAppManager.getInstance('default', config);
  }

  /**
   * Get the WhatsApp client instance
   */
  public getClient(): WhatsApp {
    return this.whatsappClient;
  }

  /**
   * Get current configuration
   */
  public getConfig(): WhatsAppConfig {
    return { ...this.config };
  }

  /**
   * Update configuration and reinitialize client
   */
  public updateConfig(newConfig: Partial<WhatsAppConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize client with new config
    this.whatsappClient = new WhatsApp({
      accessToken: this.config.accessToken,
      businessAccountId: this.config.businessAccountId,
      phoneNumberId: this.config.phoneNumberId,
      webhookVerifyToken: this.config.webhookVerifyToken,
      apiVersion: this.config.apiVersion || 'v18.0',
      baseUrl: this.config.baseUrl
    });
  }

  /**
   * Test WhatsApp API connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      console.log(`🔍 Testing WhatsApp API connection...`);
      
      // Try to get business profile to test connection
      const response = await this.whatsappClient.getBusinessProfile();
      
      if (response) {
        console.log(`✅ WhatsApp API connection successful`);
        return true;
      } else {
        console.log(`❌ WhatsApp API connection failed - no response`);
        return false;
      }
    } catch (error) {
      console.error('❌ WhatsApp connection test failed:', error);
      
      // Check for specific error types
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('unauthorized') || errorMessage.includes('invalid token')) {
          console.error('❌ WhatsApp API authentication failed - check access token');
        } else if (errorMessage.includes('not found') || errorMessage.includes('phone number')) {
          console.error('❌ WhatsApp phone number ID not found - check configuration');
        } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
          console.error('❌ WhatsApp API network error - check connectivity');
        }
      }
      
      return false;
    }
  }

  /**
   * Validate phone number format for WhatsApp
   */
  public static validatePhoneNumber(phoneNumber: string): {
    isValid: boolean;
    formattedNumber?: string;
    error?: string;
  } {
    try {
      console.log(`📞 Validating phone number: ${phoneNumber}`);
      
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

      // Format as international number (add + if not present)
      let formattedNumber = cleanNumber;
      
      if (!phoneNumber.startsWith('+')) {
        // Handle common country codes and formats
        if (cleanNumber.startsWith('0')) {
          // Handle French numbers (06, 07) and other European formats
          if (cleanNumber.startsWith('06') || cleanNumber.startsWith('07')) {
            // French mobile numbers
            formattedNumber = `+33${cleanNumber.substring(1)}`;
          } else if (cleanNumber.startsWith('01') || cleanNumber.startsWith('02') || 
                     cleanNumber.startsWith('03') || cleanNumber.startsWith('04') || 
                     cleanNumber.startsWith('05') || cleanNumber.startsWith('08') || 
                     cleanNumber.startsWith('09')) {
            // French landline numbers
            formattedNumber = `+33${cleanNumber.substring(1)}`;
          } else {
            // Other countries with leading 0
            formattedNumber = `+${cleanNumber.substring(1)}`;
          }
        } else {
          // No leading zero, assume international format without +
          formattedNumber = `+${cleanNumber}`;
        }
      } else {
        // Already has +, just clean the number
        formattedNumber = `+${cleanNumber}`;
      }

      // Additional validation for common formats
      if (formattedNumber.length < 11 || formattedNumber.length > 16) {
        return {
          isValid: false,
          error: 'Invalid international phone number format'
        };
      }

      console.log(`✅ Phone number formatted: ${phoneNumber} -> ${formattedNumber}`);
      
      return {
        isValid: true,
        formattedNumber
      };
    } catch (error) {
      console.error('❌ Error validating phone number:', error);
      return {
        isValid: false,
        error: 'Phone number validation failed'
      };
    }
  }

  /**
   * Get file size limit for WhatsApp (16MB)
   */
  public static getFileSizeLimit(): number {
    return 16 * 1024 * 1024; // 16MB in bytes
  }

  /**
   * Check if file size is within WhatsApp limits
   */
  public static isFileSizeValid(sizeInBytes: number): boolean {
    return sizeInBytes <= WhatsAppManager.getFileSizeLimit();
  }

  /**
   * Remove instance from cache (useful for testing or config changes)
   */
  public static removeInstance(tenantId: string): void {
    const key = `tenant:${tenantId}`;
    WhatsAppManager.instances.delete(key);
  }

  /**
   * Clear all instances (useful for testing)
   */
  public static clearAllInstances(): void {
    WhatsAppManager.instances.clear();
  }
}

// Export utility functions
export const validatePhoneNumber = WhatsAppManager.validatePhoneNumber;
export const getFileSizeLimit = WhatsAppManager.getFileSizeLimit;
export const isFileSizeValid = WhatsAppManager.isFileSizeValid;

// Export default manager getter
export const getWhatsAppManager = (tenantId: string, config?: WhatsAppConfig) => 
  WhatsAppManager.getInstance(tenantId, config);

export default WhatsAppManager;