// API Route: /api/payments/balance
// Calculates the balance for a specific document

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET /api/payments/balance?documentType=delivery_note&documentId=123
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

    // Get all payments for this document from Supabase
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount')
      .eq('tenant_id', tenantId)
      .eq('document_type', documentType)
      .eq('document_id', parseInt(documentId));

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return NextResponse.json({
        success: false,
        error: paymentsError.message
      }, { status: 500 });
    }

    // Calculate total paid
    const totalPaid = payments?.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0) || 0;

    // Get document total amount from BACKEND API (not Supabase directly)
    let totalAmount = 0;
    
    if (documentType === 'delivery_note') {
      // Fetch from backend API
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3005';
      const response = await fetch(`${backendUrl}/api/sales/delivery-notes/${documentId}`, {
        headers: {
          'X-Tenant': tenantId
        }
      });

      if (!response.ok) {
        console.error('Error fetching delivery note from backend');
        return NextResponse.json({
          success: false,
          error: 'Document not found'
        }, { status: 404 });
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        return NextResponse.json({
          success: false,
          error: 'Document not found'
        }, { status: 404 });
      }

      const deliveryNote = result.data;

      // Calculate TTC if not set
      if (deliveryNote.montant_ttc) {
        totalAmount = parseFloat(deliveryNote.montant_ttc.toString());
      } else {
        const montantHT = parseFloat(deliveryNote.montant_ht?.toString() || '0');
        const tva = parseFloat(deliveryNote.tva?.toString() || '0');
        totalAmount = montantHT + tva;
      }
    } else if (documentType === 'invoice') {
      // Fetch from backend API
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3005';
      const response = await fetch(`${backendUrl}/api/sales/invoices/${documentId}`, {
        headers: {
          'X-Tenant': tenantId
        }
      });

      if (!response.ok) {
        console.error('Error fetching invoice from backend');
        return NextResponse.json({
          success: false,
          error: 'Document not found'
        }, { status: 404 });
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        return NextResponse.json({
          success: false,
          error: 'Document not found'
        }, { status: 404 });
      }

      const invoice = result.data;

      // Calculate TTC if not set
      if (invoice.montant_ttc) {
        totalAmount = parseFloat(invoice.montant_ttc.toString());
      } else {
        const montantHT = parseFloat(invoice.montant_ht?.toString() || '0');
        const tva = parseFloat(invoice.tva?.toString() || '0');
        totalAmount = montantHT + tva;
      }
    }

    // Calculate balance
    const balance = totalAmount - totalPaid;

    // Determine status
    let status: 'paid' | 'partially_paid' | 'unpaid' | 'overpaid';
    if (totalPaid === 0) {
      status = 'unpaid';
    } else if (totalPaid < totalAmount) {
      status = 'partially_paid';
    } else if (totalPaid === totalAmount) {
      status = 'paid';
    } else {
      status = 'overpaid';
    }

    return NextResponse.json({
      success: true,
      data: {
        totalAmount,
        totalPaid,
        balance,
        status
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/payments/balance:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
