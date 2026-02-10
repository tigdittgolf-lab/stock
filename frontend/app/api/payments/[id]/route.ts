// API Route: /api/payments/[id]
// Handles: GET (detail), PUT (update), DELETE (delete)
// Supports: Supabase, MySQL, PostgreSQL

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentsByDocument, updatePayment, deletePayment } from '@/lib/database/payment-adapter';
import { createClient } from '@supabase/supabase-js';

// GET /api/payments/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = (request.headers.get('X-Database-Type') as any) || 'supabase';

    console.log('📋 Fetching payment:', { id, tenantId, dbType });

    if (dbType === 'mysql') {
      // MySQL: Requête directe
      const response = await fetch('http://localhost:3000/api/database/mysql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            host: 'localhost',
            port: 3306,
            username: 'root',
            password: '',
            database: 'stock_management'
          },
          sql: 'SELECT * FROM payments WHERE id = ? AND tenant_id = ?',
          params: [parseInt(id), tenantId]
        })
      });

      const result = await response.json();
      if (!result.success || !result.data || result.data.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Payment not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: result.data[0]
      });
    } else {
      // Supabase
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', parseInt(id))
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({
            success: false,
            error: 'Payment not found'
          }, { status: 404 });
        }
        
        console.error('Error fetching payment:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: data
      });
    }
  } catch (error: any) {
    console.error('❌ Error in GET /api/payments/[id]:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// PUT /api/payments/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tenantId = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = (request.headers.get('X-Database-Type') as any) || 'supabase';

    // Validation
    if (body.amount !== undefined && body.amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be greater than zero'
      }, { status: 400 });
    }

    console.log('✏️ Updating payment:', { id, tenantId, dbType });

    // Build update object
    const updates: any = {};
    if (body.paymentDate !== undefined) updates.payment_date = body.paymentDate;
    if (body.amount !== undefined) updates.amount = body.amount;
    if (body.paymentMethod !== undefined) updates.payment_method = body.paymentMethod;
    if (body.notes !== undefined) updates.notes = body.notes;

    const payment = await updatePayment(parseInt(id), tenantId, updates, dbType);

    console.log('✅ Payment updated:', payment.id);

    return NextResponse.json({
      success: true,
      data: payment
    });
  } catch (error: any) {
    console.error('❌ Error in PUT /api/payments/[id]:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE /api/payments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = (request.headers.get('X-Database-Type') as any) || 'supabase';

    console.log('🗑️ Deleting payment:', { id, tenantId, dbType });

    await deletePayment(parseInt(id), tenantId, dbType);

    console.log('✅ Payment deleted');

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error: any) {
    console.error('❌ Error in DELETE /api/payments/[id]:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
