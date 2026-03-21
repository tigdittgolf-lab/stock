import { NextRequest, NextResponse } from 'next/server';
import { calculateBalance } from '@/lib/database/payment-adapter';

// GET /api/payments/balance?documentType=delivery_note&documentId=123
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentType = searchParams.get('documentType');
    const documentId = searchParams.get('documentId');
    const tenantId = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = (request.headers.get('X-Database-Type') as any) || 'supabase';

    if (!documentType || !documentId) {
      return NextResponse.json({ success: false, error: 'Missing documentType or documentId' }, { status: 400 });
    }

    // Récupérer le montant total du document via nos propres routes (qui ont le fallback Supabase)
    let totalAmount = 0;
    const origin = request.nextUrl.origin;

    try {
      let docUrl = '';
      if (documentType === 'delivery_note') {
        docUrl = `${origin}/api/sales/delivery-notes/${documentId}`;
      } else if (documentType === 'invoice') {
        docUrl = `${origin}/api/sales/invoices/${documentId}`;
      }

      if (docUrl) {
        const res = await fetch(docUrl, {
          headers: { 'X-Tenant': tenantId, 'X-Database-Type': dbType },
          signal: AbortSignal.timeout(10000)
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            const doc = result.data;
            const ht = parseFloat(doc.montant_ht?.toString() || '0') || 0;
            const tva = parseFloat(doc.tva?.toString() || '0') || 0;
            totalAmount = parseFloat(doc.montant_ttc?.toString() || '0') || (ht + tva);
          }
        }
      }
    } catch {
      // totalAmount reste 0 — on calcule quand même le solde des paiements
    }

    const balanceData = await calculateBalance(tenantId, documentType, parseInt(documentId), totalAmount, dbType);

    return NextResponse.json({ success: true, data: balanceData });
  } catch (error: any) {
    console.error('❌ Error in GET /api/payments/balance:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
