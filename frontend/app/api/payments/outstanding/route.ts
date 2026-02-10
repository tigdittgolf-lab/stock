// API Route: /api/payments/outstanding
// Returns all documents with outstanding balances
// Supports: Supabase, MySQL, PostgreSQL

import { NextRequest, NextResponse } from 'next/server';
import { getActiveDatabaseType } from '@/lib/database/payment-adapter';
import { createClient } from '@supabase/supabase-js';

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

/**
 * Récupère les documents impayés depuis MySQL
 */
async function getOutstandingDocumentsMySQL(tenantId: string): Promise<OutstandingDocument[]> {
  const config = {
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '',
    database: tenantId // Utiliser le tenant comme nom de base
  };

  const outstandingDocs: OutstandingDocument[] = [];

  try {
    // Récupérer les BLs avec leurs paiements
    const blSql = `
      SELECT 
        bl.nfact as document_id,
        'delivery_note' as document_type,
        bl.date_bl as document_date,
        bl.nclient,
        COALESCE(client.nom, bl.nclient) as client_name,
        COALESCE(bl.total_ttc, bl.montant_ht + bl.tva, 0) as total_amount,
        COALESCE(
          (SELECT SUM(amount) 
           FROM stock_management.payments 
           WHERE document_type = 'delivery_note' 
             AND document_id = bl.nfact 
             AND tenant_id = ?), 
          0
        ) as paid_amount
      FROM bl
      LEFT JOIN client ON client.nclient = bl.nclient
      ORDER BY bl.date_bl DESC
    `;

    const blResponse = await fetch('http://localhost:3000/api/database/mysql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config,
        sql: blSql,
        params: [tenantId]
      })
    });

    const blResult = await blResponse.json();
    
    if (blResult.success && blResult.data) {
      blResult.data.forEach((row: any) => {
        const totalAmount = parseFloat(row.total_amount || '0');
        const paidAmount = parseFloat(row.paid_amount || '0');
        const balance = totalAmount - paidAmount;

        // Seulement les documents avec un solde > 0
        if (balance > 0.01) {
          let status: 'paid' | 'partially_paid' | 'unpaid' | 'overpaid';
          if (paidAmount === 0) {
            status = 'unpaid';
          } else if (paidAmount < totalAmount) {
            status = 'partially_paid';
          } else if (paidAmount === totalAmount) {
            status = 'paid';
          } else {
            status = 'overpaid';
          }

          outstandingDocs.push({
            documentType: 'delivery_note',
            documentId: row.document_id,
            documentNumber: row.document_id.toString(),
            documentDate: row.document_date,
            clientCode: row.nclient,
            clientName: row.client_name,
            totalAmount,
            totalPaid: paidAmount,
            balance,
            status
          });
        }
      });
    }

    // Récupérer les factures avec leurs paiements
    const invSql = `
      SELECT 
        facture.nfact as document_id,
        'invoice' as document_type,
        facture.date_fact as document_date,
        facture.nclient,
        COALESCE(client.nom, facture.nclient) as client_name,
        COALESCE(facture.total_ttc, facture.montant_ht + facture.tva, 0) as total_amount,
        COALESCE(
          (SELECT SUM(amount) 
           FROM stock_management.payments 
           WHERE document_type = 'invoice' 
             AND document_id = facture.nfact 
             AND tenant_id = ?), 
          0
        ) as paid_amount
      FROM facture
      LEFT JOIN client ON client.nclient = facture.nclient
      ORDER BY facture.date_fact DESC
    `;

    const invResponse = await fetch('http://localhost:3000/api/database/mysql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config,
        sql: invSql,
        params: [tenantId]
      })
    });

    const invResult = await invResponse.json();
    
    if (invResult.success && invResult.data) {
      invResult.data.forEach((row: any) => {
        const totalAmount = parseFloat(row.total_amount || '0');
        const paidAmount = parseFloat(row.paid_amount || '0');
        const balance = totalAmount - paidAmount;

        // Seulement les documents avec un solde > 0
        if (balance > 0.01) {
          let status: 'paid' | 'partially_paid' | 'unpaid' | 'overpaid';
          if (paidAmount === 0) {
            status = 'unpaid';
          } else if (paidAmount < totalAmount) {
            status = 'partially_paid';
          } else if (paidAmount === totalAmount) {
            status = 'paid';
          } else {
            status = 'overpaid';
          }

          outstandingDocs.push({
            documentType: 'invoice',
            documentId: row.document_id,
            documentNumber: row.document_id.toString(),
            documentDate: row.document_date,
            clientCode: row.nclient,
            clientName: row.client_name,
            totalAmount,
            totalPaid: paidAmount,
            balance,
            status
          });
        }
      });
    }

  } catch (error) {
    console.error('❌ Error fetching outstanding documents from MySQL:', error);
  }

  // Trier par solde décroissant
  outstandingDocs.sort((a, b) => b.balance - a.balance);

  return outstandingDocs;
}

/**
 * Récupère les documents impayés depuis Supabase
 */
async function getOutstandingDocumentsSupabase(tenantId: string): Promise<OutstandingDocument[]> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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

  // Get client names
  let clientMap = new Map<string, string>();
  
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('nclient, raison_sociale')
    .eq('tenant_id', tenantId);

  if (!clientsError && clients) {
    clients.forEach(client => {
      clientMap.set(client.nclient, client.raison_sociale || client.nclient);
    });
  } else {
    const { data: clientAlt, error: clientAltError } = await supabase
      .from('client')
      .select('nclient, raison_sociale')
      .eq('tenant_id', tenantId);

    if (!clientAltError && clientAlt) {
      clientAlt.forEach(client => {
        clientMap.set(client.nclient, client.raison_sociale || client.nclient);
      });
    }
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

    if (balance > 0.01) {
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

    if (balance > 0.01) {
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

  // Sort by balance descending
  outstandingDocuments.sort((a, b) => b.balance - a.balance);

  return outstandingDocuments;
}

// GET /api/payments/outstanding
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = getActiveDatabaseType();

    console.log('📊 Fetching outstanding documents:', { tenantId, dbType });

    let outstandingDocuments: OutstandingDocument[];

    if (dbType === 'mysql') {
      outstandingDocuments = await getOutstandingDocumentsMySQL(tenantId);
    } else {
      outstandingDocuments = await getOutstandingDocumentsSupabase(tenantId);
    }

    console.log('✅ Outstanding documents fetched:', outstandingDocuments.length);

    return NextResponse.json({
      success: true,
      data: outstandingDocuments
    });
  } catch (error: any) {
    console.error('❌ Error in GET /api/payments/outstanding:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
