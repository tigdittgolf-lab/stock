// API Route: /api/payments
// Handles: POST (create payment), GET (list payments by document)
// Supports: Supabase, MySQL, PostgreSQL

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentsByDocument, createPayment } from '@/lib/database/payment-adapter';

// GET /api/payments?documentType=delivery_note&documentId=123
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentType = searchParams.get('documentType');
    const documentId = searchParams.get('documentId');
    const tenantId = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = (request.headers.get('X-Database-Type') as any) || 'supabase';

    if (!documentType || !documentId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: documentType and documentId'
      }, { status: 400 });
    }

    console.log('📋 Fetching payments:', { tenantId, documentType, documentId, dbType });

    const payments = await getPaymentsByDocument(
      tenantId,
      documentType,
      parseInt(documentId),
      dbType
    );

    // Transform snake_case to camelCase for frontend
    const transformedData = payments.map(payment => ({
      id: payment.id,
      paymentDate: payment.payment_date,
      amount: payment.amount,
      paymentMethod: payment.payment_method,
      notes: payment.notes,
      createdAt: payment.created_at
    }));

    console.log('✅ Payments fetched:', transformedData.length);

    return NextResponse.json({
      success: true,
      data: transformedData
    });
  } catch (error: any) {
    console.error('❌ Error in GET /api/payments:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST /api/payments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentType, documentId, paymentDate, amount, paymentMethod, notes } = body;
    const tenantId = request.headers.get('X-Tenant') || body.tenantId || '2025_bu01';
    const dbType = (request.headers.get('X-Database-Type') as any) || 'supabase';

    // Validation
    if (!documentType || !documentId || !paymentDate || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be greater than zero'
      }, { status: 400 });
    }

    console.log('💰 Creating payment:', { tenantId, documentType, documentId, amount, dbType });

    // Create payment
    const payment = await createPayment({
      tenant_id: tenantId,
      document_type: documentType,
      document_id: documentId,
      payment_date: paymentDate,
      amount: amount,
      payment_method: paymentMethod || null,
      notes: notes || null
    }, dbType);

    console.log('✅ Payment created:', payment.id);

    return NextResponse.json({
      success: true,
      data: payment
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error in POST /api/payments:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
