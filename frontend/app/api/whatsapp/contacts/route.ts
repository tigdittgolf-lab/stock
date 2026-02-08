import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const clientId = searchParams.get('clientId');

    console.log('📋 WhatsApp contacts request:', { tenantId, clientId });

    if (!tenantId) {
      return NextResponse.json({ 
        success: false, 
        error: 'tenantId is required' 
      }, { status: 400 });
    }

    // For now, return mock contacts
    // In a real implementation, you would fetch from your database
    const contacts = [
      { 
        phoneNumber: '+213792901660', 
        name: 'Contact Test 1', 
        isVerified: true,
        clientId: clientId || 'default'
      },
      { 
        phoneNumber: '+213674768390', 
        name: 'Contact Test 2', 
        isVerified: false,
        clientId: clientId || 'default'
      }
    ];

    return NextResponse.json({
      success: true,
      contacts
    });

  } catch (error) {
    console.error('❌ Error getting WhatsApp contacts:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, clientId, phoneNumber, name } = body;

    console.log('➕ Adding WhatsApp contact:', { tenantId, clientId, phoneNumber, name });

    if (!tenantId || !phoneNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'tenantId and phoneNumber are required' 
      }, { status: 400 });
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid phone number format' 
      }, { status: 400 });
    }

    const contact = {
      id: `contact-${Date.now()}`,
      phoneNumber,
      name,
      tenantId,
      clientId,
      isVerified: false,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      contact
    });

  } catch (error) {
    console.error('❌ Error adding WhatsApp contact:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}