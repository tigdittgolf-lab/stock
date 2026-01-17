/**
 * WhatsApp Service - Core functionality for document sending
 * Requirements: 3.1, 2.2, 2.5, 3.2, 3.5
 */

import { WhatsAppManager, validatePhoneNumber } from '../config/whatsapp.js';
import { getRedisManager } from '../config/redis.js';

export interface SendDocumentRequest {
  tenantId: string;
  document: Buffer;
  filename: string;
  recipients: WhatsAppContact[];
  customMessage?: string;
  documentMetadata: DocumentMetadata;
}

export interface WhatsAppContact {
  phoneNumber: string;
  name?: string;
  clientId?: string;
}

export interface DocumentMetadata {
  id: string;
  type: 'invoice' | 'delivery_note' | 'proforma';
  filename: string;
  size: number;
  clientId?: string;
  createdAt: Date;
}

export interface SendDocumentResponse {
  success: boolean;
  results: ContactSendResult[];
  queuedCount: number;
  failedCount: number;
}

export interface ContactSendResult {
  contact: WhatsAppContact;
  success: boolean;
  messageId?: string;
  error?: string;
  status: 'sent' | 'queued' | 'failed';
}

export class WhatsAppService {
  private whatsappManager: WhatsAppManager;
  private redisManager = getRedisManager();

  constructor(tenantId: string, config?: any) {
    this.whatsappManager = WhatsAppManager.getInstance(tenantId, config);
  }

  /**
   * Send document to multiple WhatsApp contacts
   */
  async sendDocument(request: SendDocumentRequest): Promise<SendDocumentResponse> {
    console.log(`📤 Sending document to ${request.recipients.length} recipients`);
    
    const results: ContactSendResult[] = [];
    let queuedCount = 0;
    let failedCount = 0;

    // Validate file size
    if (!WhatsAppManager.isFileSizeValid(request.document.length)) {
      const error = `File size ${request.document.length} bytes exceeds WhatsApp limit of ${WhatsAppManager.getFileSizeLimit()} bytes`;
      console.error(`❌ ${error}`);
      
      return {
        success: false,
        results: request.recipients.map(contact => ({
          contact,
          success: false,
          error,
          status: 'failed' as const
        })),
        queuedCount: 0,
        failedCount: request.recipients.length
      };
    }

    // Process each recipient
    for (const contact of request.recipients) {
      try {
        // Validate phone number
        const validation = validatePhoneNumber(contact.phoneNumber);
        if (!validation.isValid) {
          results.push({
            contact,
            success: false,
            error: validation.error,
            status: 'failed'
          });
          failedCount++;
          continue;
        }

        // Try to send immediately
        const result = await this.sendToContact(
          contact,
          request.document,
          request.filename,
          request.customMessage,
          request.documentMetadata
        );

        if (result.success) {
          results.push({
            contact,
            success: true,
            messageId: result.messageId,
            status: 'sent'
          });
        } else {
          // Queue for retry if immediate send fails
          await this.queueSend(request, contact);
          results.push({
            contact,
            success: false,
            error: result.error,
            status: 'queued'
          });
          queuedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing contact ${contact.phoneNumber}:`, error);
        results.push({
          contact,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed'
        });
        failedCount++;
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`📊 Send results: ${successCount} sent, ${queuedCount} queued, ${failedCount} failed`);

    return {
      success: successCount > 0 || queuedCount > 0,
      results,
      queuedCount,
      failedCount
    };
  }

  /**
   * Send document to a single contact
   */
  private async sendToContact(
    contact: WhatsAppContact,
    document: Buffer,
    filename: string,
    customMessage?: string,
    metadata?: DocumentMetadata
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const client = this.whatsappManager.getClient();
      
      // Upload media first
      console.log(`📤 Uploading document for ${contact.phoneNumber}`);
      const mediaResult = await client.uploadMedia({
        file: document,
        type: 'document',
        filename: filename
      });

      if (!mediaResult || !mediaResult.id) {
        throw new Error('Failed to upload media to WhatsApp');
      }

      // Send document message
      const message = customMessage || `Document: ${filename}`;
      const sendResult = await client.sendDocument({
        to: validatePhoneNumber(contact.phoneNumber).formattedNumber!,
        document: {
          id: mediaResult.id,
          filename: filename,
          caption: message
        }
      });

      if (sendResult && sendResult.messages && sendResult.messages[0]) {
        const messageId = sendResult.messages[0].id;
        console.log(`✅ Document sent to ${contact.phoneNumber}, message ID: ${messageId}`);
        
        return {
          success: true,
          messageId
        };
      } else {
        throw new Error('No message ID returned from WhatsApp API');
      }
    } catch (error) {
      console.error(`❌ Failed to send to ${contact.phoneNumber}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Queue send for later processing
   */
  private async queueSend(request: SendDocumentRequest, contact: WhatsAppContact): Promise<void> {
    const queueData = {
      tenantId: request.tenantId,
      contact,
      document: request.document.toString('base64'),
      filename: request.filename,
      customMessage: request.customMessage,
      documentMetadata: request.documentMetadata
    };

    await this.redisManager.enqueue('whatsapp_send_queue', queueData, {
      attempts: 3,
      delay: 5000 // 5 second delay
    });

    console.log(`📋 Queued send for ${contact.phoneNumber}`);
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string) {
    return validatePhoneNumber(phoneNumber);
  }

  /**
   * Test WhatsApp connection
   */
  async testConnection(): Promise<boolean> {
    return await this.whatsappManager.testConnection();
  }
}

export default WhatsAppService;