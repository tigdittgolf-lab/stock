/**
 * WhatsApp API Routes
 * Handles WhatsApp document sending, contact management, and configuration
 * Requirements: 1.1, 1.2, 2.1, 3.1, 4.1, 7.1, 8.1
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import WhatsAppService from '../services/whatsappService.js';
import ContactManager from '../services/contactManager.js';
import QueueManager from '../services/queueManager.js';
import { BackendDatabaseService } from '../services/databaseService.js';
import { validatePhoneNumber } from '../config/whatsapp.js';

const app = new Hono();

// Enable CORS
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

/**
 * Send document via WhatsApp
 * POST /api/whatsapp/send-document
 */
app.post('/send-document', async (c) => {
  try {
    const body = await c.req.json();
    const { 
      tenantId, 
      documentId, 
      documentType, 
      filename, 
      recipients, 
      customMessage 
    } = body;

    console.log('📱 WhatsApp send-document request:', { tenantId, documentId, documentType, filename, recipientsCount: recipients?.length });

    // Validate required fields
    if (!tenantId || !documentId || !documentType || !filename || !recipients) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, 400);
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return c.json({ 
        success: false, 
        error: 'Recipients must be a non-empty array' 
      }, 400);
    }

    // Get the PDF service
    const dbService = BackendDatabaseService.getInstance();
    const pdfService = dbService.getPDFService();
    
    let documentBuffer: Buffer;
    
    try {
      // Generate the actual PDF based on document type
      console.log('📄 Generating PDF for WhatsApp...');
      
      if (documentType === 'delivery_note') {
        // Get BL data
        const blData = await dbService.getBLById(documentId);
        if (!blData) {
          throw new Error(`Delivery note ${documentId} not found`);
        }
        
        // Generate PDF (using "complet" format by default)
        documentBuffer = await pdfService.generateDeliveryNotePDF(blData, 'complet');
        console.log('✅ BL PDF generated:', documentBuffer.length, 'bytes');
        
      } else if (documentType === 'invoice') {
        // Get invoice data
        const invoiceData = await dbService.getInvoiceById(documentId);
        if (!invoiceData) {
          throw new Error(`Invoice ${documentId} not found`);
        }
        
        // Generate PDF
        documentBuffer = await pdfService.generateInvoicePDF(invoiceData);
        console.log('✅ Invoice PDF generated:', documentBuffer.length, 'bytes');
        
      } else if (documentType === 'proforma') {
        // Get proforma data
        const proformaData = await dbService.getProformaById(documentId);
        if (!proformaData) {
          throw new Error(`Proforma ${documentId} not found`);
        }
        
        // Generate PDF
        documentBuffer = await pdfService.generateProformaPDF(proformaData);
        console.log('✅ Proforma PDF generated:', documentBuffer.length, 'bytes');
        
      } else {
        throw new Error(`Unknown document type: ${documentType}`);
      }
      
    } catch (pdfError) {
      console.error('❌ Error generating PDF:', pdfError);
      return c.json({ 
        success: false, 
        error: `Failed to generate PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}` 
      }, 500);
    }

    const documentMetadata = {
      id: documentId,
      type: documentType as 'invoice' | 'delivery_note' | 'proforma',
      filename,
      size: documentBuffer.length,
      createdAt: new Date()
    };

    // Initialize WhatsApp service
    const whatsappService = new WhatsAppService(tenantId);

    // Send document
    console.log('📤 Sending document via WhatsApp to', recipients.length, 'recipients...');
    const result = await whatsappService.sendDocument({
      tenantId,
      document: documentBuffer,
      filename,
      recipients,
      customMessage,
      documentMetadata
    });

    // Log the send attempt
    console.log(`📝 WhatsApp send completed: ${result.results.length} attempts, ${result.results.filter(r => r.success).length} successful`);

    return c.json({
      success: result.success,
      results: result.results,
      summary: {
        total: recipients.length,
        sent: result.results.filter(r => r.success).length,
        queued: result.queuedCount,
        failed: result.failedCount
      }
    });

  } catch (error) {
    console.error('❌ Error sending WhatsApp document:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 500);
  }
});

/**
 * Get WhatsApp contacts
 * GET /api/whatsapp/contacts
 */
app.get('/contacts', async (c) => {
  try {
    const tenantId = c.req.query('tenantId');
    const clientId = c.req.query('clientId');
    const query = c.req.query('query');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50;

    if (!tenantId) {
      return c.json({ 
        success: false, 
        error: 'tenantId is required' 
      }, 400);
    }

    const dbService = BackendDatabaseService.getInstance();
    // Simplified contact retrieval - return mock data for now
    const contacts = [
      { phoneNumber: '+33612345678', name: 'Contact Test 1', isVerified: true },
      { phoneNumber: '+33687654321', name: 'Contact Test 2', isVerified: false }
    ];

    return c.json({
      success: true,
      contacts
    });

  } catch (error) {
    console.error('Error getting WhatsApp contacts:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

/**
 * Add WhatsApp contact
 * POST /api/whatsapp/contacts
 */
app.post('/contacts', async (c) => {
  try {
    const body = await c.req.json();
    const { tenantId, clientId, phoneNumber, name } = body;

    if (!tenantId || !phoneNumber) {
      return c.json({ 
        success: false, 
        error: 'tenantId and phoneNumber are required' 
      }, 400);
    }

    const dbService = BackendDatabaseService.getInstance();
    // Simplified contact creation - just validate and return success
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      return c.json({ 
        success: false, 
        error: validation.error 
      }, 400);
    }

    const contact = {
      id: 'mock-id',
      phoneNumber: validation.formattedNumber,
      name,
      tenantId,
      clientId,
      isVerified: false,
      createdAt: new Date()
    };

    return c.json({
      success: true,
      contact
    });

  } catch (error) {
    console.error('Error adding WhatsApp contact:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

/**
 * Validate phone number
 * POST /api/whatsapp/validate-phone
 */
app.post('/validate-phone', async (c) => {
  try {
    const body = await c.req.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return c.json({ 
        success: false, 
        error: 'phoneNumber is required' 
      }, 400);
    }

    const validation = validatePhoneNumber(phoneNumber);

    return c.json({
      success: true,
      validation
    });

  } catch (error) {
    console.error('Error validating phone number:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

/**
 * Get WhatsApp send history
 * GET /api/whatsapp/history
 */
app.get('/history', async (c) => {
  try {
    const tenantId = c.req.query('tenantId');
    const documentId = c.req.query('documentId');
    const status = c.req.query('status');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0;

    if (!tenantId) {
      return c.json({ 
        success: false, 
        error: 'tenantId is required' 
      }, 400);
    }

    const dbService = BackendDatabaseService.getInstance();
    // Simplified history - return mock data
    const history = [
      {
        id: 'mock-1',
        documentId,
        documentType: 'invoice',
        recipientPhone: '+33612345678',
        recipientName: 'Test Client',
        status: 'sent',
        createdAt: new Date()
      }
    ];

    return c.json({
      success: true,
      history,
      pagination: {
        limit,
        offset,
        total: history.length
      }
    });

  } catch (error) {
    console.error('Error getting WhatsApp history:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

/**
 * Test WhatsApp connection
 * GET /api/whatsapp/test-connection
 */
app.get('/test-connection', async (c) => {
  try {
    const tenantId = c.req.query('tenantId') || 'default';

    const whatsappService = new WhatsAppService(tenantId);
    const isConnected = await whatsappService.testConnection();

    return c.json({
      success: true,
      connected: isConnected,
      message: isConnected ? 'WhatsApp API connection successful' : 'WhatsApp API connection failed'
    });

  } catch (error) {
    console.error('Error testing WhatsApp connection:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection test failed' 
    }, 500);
  }
});

/**
 * Get queue status
 * GET /api/whatsapp/queue-status
 */
app.get('/queue-status', async (c) => {
  try {
    const queueManager = new QueueManager();
    const stats = await queueManager.getQueueStats();

    return c.json({
      success: true,
      queue: stats
    });

  } catch (error) {
    console.error('Error getting queue status:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

export default app;