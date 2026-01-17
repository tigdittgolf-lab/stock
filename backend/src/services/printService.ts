/**
 * Print Service Extension for WhatsApp Integration
 * Extends existing PDF service to support WhatsApp document sending
 * Requirements: 1.2, 1.4
 */

import { jsPDF } from 'jspdf';
import WhatsAppService from './whatsappService.js';
import ContactManager from './contactManager.js';
import { getDatabaseConnection } from './databaseService.js';

export interface DocumentMetadata {
  id: string;
  type: 'invoice' | 'delivery_note' | 'proforma';
  filename: string;
  size: number;
  clientId?: string;
  createdAt: Date;
}

export interface PrintOptions {
  includeWhatsApp?: boolean;
  whatsappContacts?: string[]; // Phone numbers
  customMessage?: string;
}

export class PrintService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Generate PDF for WhatsApp sending
   */
  async generatePDFForWhatsApp(documentId: string, documentType: string): Promise<Buffer> {
    console.log(`📄 Generating PDF for WhatsApp: ${documentId} (${documentType})`);
    
    try {
      // Get document data from database
      const db = await getDatabaseConnection();
      let documentData;
      
      switch (documentType) {
        case 'invoice':
          documentData = await this.getInvoiceData(db, documentId);
          break;
        case 'delivery_note':
          documentData = await this.getDeliveryNoteData(db, documentId);
          break;
        case 'proforma':
          documentData = await this.getProformaData(db, documentId);
          break;
        default:
          throw new Error(`Unsupported document type: ${documentType}`);
      }

      if (!documentData) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Generate PDF using existing PDF service logic
      const pdf = await this.generatePDF(documentData, documentType);
      
      // Convert to buffer
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
      
      console.log(`✅ PDF generated for WhatsApp: ${pdfBuffer.length} bytes`);
      return pdfBuffer;
      
    } catch (error) {
      console.error('❌ Error generating PDF for WhatsApp:', error);
      throw new Error('Failed to generate PDF for WhatsApp');
    }
  }

  /**
   * Get document metadata
   */
  async getDocumentMetadata(documentId: string, documentType: string): Promise<DocumentMetadata> {
    console.log(`📋 Getting document metadata: ${documentId} (${documentType})`);
    
    try {
      const db = await getDatabaseConnection();
      let query: string;
      let tableName: string;
      
      switch (documentType) {
        case 'invoice':
          tableName = 'factures';
          query = `
            SELECT nfact as id, date_fact, client_id, 
                   CONCAT('Facture_', nfact, '_', TO_CHAR(date_fact, 'YYYY-MM-DD'), '.pdf') as filename
            FROM ${tableName} 
            WHERE nfact = $1 AND tenant_id = $2
          `;
          break;
        case 'delivery_note':
          tableName = 'bons_livraison';
          query = `
            SELECT nfact as id, date_fact, client_id,
                   CONCAT('BL_', nfact, '_', TO_CHAR(date_fact, 'YYYY-MM-DD'), '.pdf') as filename
            FROM ${tableName} 
            WHERE nfact = $1 AND tenant_id = $2
          `;
          break;
        case 'proforma':
          tableName = 'proformas';
          query = `
            SELECT nfact as id, date_fact, client_id,
                   CONCAT('Proforma_', nfact, '_', TO_CHAR(date_fact, 'YYYY-MM-DD'), '.pdf') as filename
            FROM ${tableName} 
            WHERE nfact = $1 AND tenant_id = $2
          `;
          break;
        default:
          throw new Error(`Unsupported document type: ${documentType}`);
      }

      const result = await db.query(query, [documentId, this.tenantId]);
      
      if (result.rows.length === 0) {
        throw new Error(`Document not found: ${documentId}`);
      }

      const row = result.rows[0];
      
      // Generate PDF to get size
      const pdfBuffer = await this.generatePDFForWhatsApp(documentId, documentType);
      
      return {
        id: documentId,
        type: documentType as 'invoice' | 'delivery_note' | 'proforma',
        filename: row.filename,
        size: pdfBuffer.length,
        clientId: row.client_id,
        createdAt: new Date(row.date_fact)
      };
      
    } catch (error) {
      console.error('❌ Error getting document metadata:', error);
      throw new Error('Failed to get document metadata');
    }
  }

  /**
   * Print document with WhatsApp option
   */
  async printWithWhatsApp(
    documentId: string, 
    documentType: string, 
    options: PrintOptions = {}
  ): Promise<{
    success: boolean;
    pdfGenerated: boolean;
    whatsappSent?: boolean;
    whatsappResults?: any[];
    error?: string;
  }> {
    console.log(`🖨️ Printing document with WhatsApp option: ${documentId}`);
    
    try {
      // Generate PDF
      const pdfBuffer = await this.generatePDFForWhatsApp(documentId, documentType);
      const metadata = await this.getDocumentMetadata(documentId, documentType);
      
      let whatsappResults: any[] = [];
      let whatsappSent = false;

      // Send via WhatsApp if requested
      if (options.includeWhatsApp && options.whatsappContacts && options.whatsappContacts.length > 0) {
        console.log(`📱 Sending via WhatsApp to ${options.whatsappContacts.length} contacts`);
        
        const whatsappService = new WhatsAppService(this.tenantId);
        
        // Convert phone numbers to contact objects
        const recipients = options.whatsappContacts.map(phone => ({
          phoneNumber: phone,
          clientId: metadata.clientId
        }));

        const sendResult = await whatsappService.sendDocument({
          tenantId: this.tenantId,
          document: pdfBuffer,
          filename: metadata.filename,
          recipients,
          customMessage: options.customMessage,
          documentMetadata: metadata
        });

        whatsappResults = sendResult.results;
        whatsappSent = sendResult.success;
      }

      return {
        success: true,
        pdfGenerated: true,
        whatsappSent,
        whatsappResults
      };

    } catch (error) {
      console.error('❌ Error printing with WhatsApp:', error);
      return {
        success: false,
        pdfGenerated: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get contacts for a client (for WhatsApp sending)
   */
  async getClientWhatsAppContacts(clientId: string): Promise<any[]> {
    try {
      const db = await getDatabaseConnection();
      const contactManager = new ContactManager(db);
      
      return await contactManager.getContactsByClient(this.tenantId, clientId);
    } catch (error) {
      console.error('❌ Error getting client WhatsApp contacts:', error);
      return [];
    }
  }

  // Private methods for data retrieval and PDF generation
  private async getInvoiceData(db: any, documentId: string): Promise<any> {
    // Implementation would call existing invoice data retrieval logic
    // This is a placeholder - you would integrate with your existing invoice system
    const query = `
      SELECT f.*, c.raison_sociale, c.adresse, c.nif, c.rc
      FROM factures f
      LEFT JOIN clients c ON f.client_id = c.id
      WHERE f.nfact = $1 AND f.tenant_id = $2
    `;
    
    const result = await db.query(query, [documentId, this.tenantId]);
    return result.rows[0];
  }

  private async getDeliveryNoteData(db: any, documentId: string): Promise<any> {
    // Implementation would call existing delivery note data retrieval logic
    const query = `
      SELECT bl.*, c.raison_sociale, c.adresse
      FROM bons_livraison bl
      LEFT JOIN clients c ON bl.client_id = c.id
      WHERE bl.nfact = $1 AND bl.tenant_id = $2
    `;
    
    const result = await db.query(query, [documentId, this.tenantId]);
    return result.rows[0];
  }

  private async getProformaData(db: any, documentId: string): Promise<any> {
    // Implementation would call existing proforma data retrieval logic
    const query = `
      SELECT p.*, c.raison_sociale, c.adresse, c.nif, c.rc
      FROM proformas p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.nfact = $1 AND p.tenant_id = $2
    `;
    
    const result = await db.query(query, [documentId, this.tenantId]);
    return result.rows[0];
  }

  private async generatePDF(documentData: any, documentType: string): Promise<jsPDF> {
    // This would integrate with your existing PDF generation logic
    // For now, create a simple PDF as placeholder
    const pdf = new jsPDF();
    
    pdf.setFontSize(16);
    pdf.text(`${documentType.toUpperCase()} #${documentData.nfact || documentData.id}`, 20, 30);
    
    pdf.setFontSize(12);
    pdf.text(`Date: ${documentData.date_fact}`, 20, 50);
    pdf.text(`Client: ${documentData.raison_sociale}`, 20, 70);
    
    // Add more content based on document type
    if (documentType === 'invoice') {
      pdf.text(`Montant HT: ${documentData.montant_ht || 0}`, 20, 90);
      pdf.text(`TVA: ${documentData.tva || 0}`, 20, 110);
    }
    
    return pdf;
  }
}

export default PrintService;