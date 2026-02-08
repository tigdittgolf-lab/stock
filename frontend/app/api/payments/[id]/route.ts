// API Route: /api/payments/[id]
// Handles: GET (detail), PUT (update), DELETE (delete)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/payments/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('X-Tenant') || '2025_bu01';

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
  } catch (error: any) {
    console.error('Error in GET /api/payments/[id]:', error);
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

    // Validation
    if (body.amount !== undefined && body.amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be greater than zero'
      }, { status: 400 });
    }

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.paymentDate !== undefined) updateData.payment_date = body.paymentDate;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.paymentMethod !== undefined) updateData.payment_method = body.paymentMethod;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('tenant_id', tenantId)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error('Error in PUT /api/payments/[id]:', error);
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

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', parseInt(id));

    if (error) {
      console.error('Error deleting payment:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/payments/[id]:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
