// API Route: /api/payments
// Handles: POST (create payment), GET (list payments by document)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/payments?documentType=delivery_note&documentId=123
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentType = searchParams.get('documentType');
    const documentId = searchParams.get('documentId');
    const tenantId = request.headers.get('X-Tenant') || '2025_bu01';

    if (!documentType || !documentId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: documentType and documentId'
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('document_type', documentType)
      .eq('document_id', parseInt(documentId))
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Transform snake_case to camelCase for frontend
    const transformedData = data?.map(payment => ({
      id: payment.id,
      paymentDate: payment.payment_date,
      amount: payment.amount,
      paymentMethod: payment.payment_method,
      notes: payment.notes,
      createdAt: payment.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedData
    });
  } catch (error: any) {
    console.error('Error in GET /api/payments:', error);
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

    // Insert payment
    const { data, error } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenantId,
        document_type: documentType,
        document_id: documentId,
        payment_date: paymentDate,
        amount: amount,
        payment_method: paymentMethod || null,
        notes: notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/payments:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
