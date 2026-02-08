// API Route: /api/payments/outstanding
// Returns all documents with outstanding balances

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface OutstandingDocument {
  documentType: 'delivery_note' | 'invoice';
  documentId: number;
  documentNumber: string;
  documentDate: string;
  clientCode: string;
  clientName: string;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  status: 'paid' | 'partially_paid' | 'unpaid' | 'overpaid';
}

// GET /api/payments/outstanding
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant') || '2025_bu01';
    const outstandingDocuments: OutstandingDocument[] = [];

    // Get all delivery notes
    const { data: deliveryNotes, error: dnError } = await supabase
      .from('bons_livraison')
      .select('nbl, date_fact, nclient, montant_ht, tva, montant_ttc')
      .eq('tenant_id', tenantId)
      .order('date_fact', { ascending: false });

    if (dnError) {
      console.error('Error fetching delivery notes:', dnError);
    }

    // Get all invoices
    const { data: invoices, error: invError } = await supabase
      .from('factures')
      .select('nfacture, date_fact, nclient, montant_ht, tva, montant_ttc')
      .eq('tenant_id', tenantId)
      .order('date_fact', { ascending: false });

    if (invError) {
      console.error('Error fetching invoices:', invError);
    }

    // Get all payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('document_type, document_id, amount')
      .eq('tenant_id', tenantId);

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    }

    // Calculate payments by document
    const paymentsByDocument = new Map<string, number>();
    payments?.forEach(payment => {
      const key = `${payment.document_type}_${payment.document_id}`;
      const current = paymentsByDocument.get(key) || 0;
      paymentsByDocument.set(key, current + parseFloat(payment.amount.toString()));
    });

    // Get client names - try multiple possible table names
    let clientMap = new Map<string, string>();
    
    // Try 'clients' table first
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('nclient, raison_sociale')
      .eq('tenant_id', tenantId);

    if (!clientsError && clients) {
      clients.forEach(client => {
        clientMap.set(client.nclient, client.raison_sociale || client.nclient);
      });
    } else {
      // If 'clients' table doesn't exist, try 'client' table
      const { data: clientAlt, error: clientAltError } = await supabase
        .from('client')
        .select('nclient, raison_sociale')
        .eq('tenant_id', tenantId);

      if (!clientAltError && clientAlt) {
        clientAlt.forEach(client => {
          clientMap.set(client.nclient, client.raison_sociale || client.nclient);
        });
      }
      // If neither table exists, we'll just use the client code as the name
    }

    // Process delivery notes
    deliveryNotes?.forEach(dn => {
      let totalAmount = 0;
      if (dn.montant_ttc) {
        totalAmount = parseFloat(dn.montant_ttc.toString());
      } else {
        const montantHT = parseFloat(dn.montant_ht?.toString() || '0');
        const tva = parseFloat(dn.tva?.toString() || '0');
        totalAmount = montantHT + tva;
      }

      const key = `delivery_note_${dn.nbl}`;
      const totalPaid = paymentsByDocument.get(key) || 0;
      const balance = totalAmount - totalPaid;

      // Only include if there's an outstanding balance
      if (balance > 0.01) { // Small threshold to handle floating point precision
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

        outstandingDocuments.push({
          documentType: 'delivery_note',
          documentId: dn.nbl,
          documentNumber: dn.nbl.toString(),
          documentDate: dn.date_fact,
          clientCode: dn.nclient,
          clientName: clientMap.get(dn.nclient) || dn.nclient,
          totalAmount,
          totalPaid,
          balance,
          status
        });
      }
    });

    // Process invoices
    invoices?.forEach(inv => {
      let totalAmount = 0;
      if (inv.montant_ttc) {
        totalAmount = parseFloat(inv.montant_ttc.toString());
      } else {
        const montantHT = parseFloat(inv.montant_ht?.toString() || '0');
        const tva = parseFloat(inv.tva?.toString() || '0');
        totalAmount = montantHT + tva;
      }

      const key = `invoice_${inv.nfacture}`;
      const totalPaid = paymentsByDocument.get(key) || 0;
      const balance = totalAmount - totalPaid;

      // Only include if there's an outstanding balance
      if (balance > 0.01) { // Small threshold to handle floating point precision
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

        outstandingDocuments.push({
          documentType: 'invoice',
          documentId: inv.nfacture,
          documentNumber: inv.nfacture.toString(),
          documentDate: inv.date_fact,
          clientCode: inv.nclient,
          clientName: clientMap.get(inv.nclient) || inv.nclient,
          totalAmount,
          totalPaid,
          balance,
          status
        });
      }
    });

    // Sort by balance descending (highest unpaid first)
    outstandingDocuments.sort((a, b) => b.balance - a.balance);

    return NextResponse.json({
      success: true,
      data: outstandingDocuments
    });
  } catch (error: any) {
    console.error('Error in GET /api/payments/outstanding:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
