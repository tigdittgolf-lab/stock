import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tenantId, 
      documentId, 
      documentType, 
      filename, 
      recipients, 
      customMessage 
    } = body;

    console.log('📱 WhatsApp send request:', { tenantId, documentId, documentType, recipients });

    // Validate required fields
    if (!tenantId || !documentId || !documentType || !filename || !recipients) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Recipients must be a non-empty array' 
      }, { status: 400 });
    }

    // WhatsApp API configuration
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v18.0';

    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error('❌ WhatsApp configuration missing');
      return NextResponse.json({ 
        success: false, 
        error: 'WhatsApp configuration not found' 
      }, { status: 500 });
    }

    const results = [];
    let sentCount = 0;
    let failedCount = 0;

    // Send to each recipient
    for (const recipient of recipients) {
      try {
        const phoneNumber = recipient.phoneNumber.replace(/^\+/, ''); // Remove + prefix
        const message = customMessage || `Voici votre document ${filename}`;

        console.log(`📱 Sending to: ${phoneNumber}`);

        const response = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'text',
            text: {
              body: message
            }
          })
        });

        const data = await response.json();

        if (response.ok) {
          console.log(`✅ Message sent to ${phoneNumber}:`, data.messages[0].id);
          results.push({
            phoneNumber: recipient.phoneNumber,
            success: true,
            messageId: data.messages[0].id,
            whatsappId: data.contacts[0].wa_id
          });
          sentCount++;
        } else {
          console.error(`❌ Failed to send to ${phoneNumber}:`, data);
          results.push({
            phoneNumber: recipient.phoneNumber,
            success: false,
            error: data.error?.message || 'Unknown error'
          });
          failedCount++;
        }
      } catch (error) {
        console.error(`❌ Error sending to ${recipient.phoneNumber}:`, error);
        results.push({
          phoneNumber: recipient.phoneNumber,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failedCount++;
      }
    }

    return NextResponse.json({
      success: sentCount > 0,
      results,
      summary: {
        total: recipients.length,
        sent: sentCount,
        failed: failedCount,
        queued: 0
      }
    });

  } catch (error) {
    console.error('❌ WhatsApp API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}