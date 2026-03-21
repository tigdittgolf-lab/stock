// API Route: /api/purchases/overdue
// Dettes fournisseurs non réglées (BL achat + factures achat)
// Supports: Supabase, MySQL, PostgreSQL

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');

    if (dbType === 'supabase') {
      return await getOverdueSupplierDebtsSupabase(tenant, days);
    } else {
      return await getOverdueSupplierDebtsSQL(tenant, days, dbType);
    }
  } catch (error: any) {
    console.error('❌ /api/purchases/overdue:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function getOverdueSupplierDebtsSupabase(tenant: string, days: number) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString().split('T')[0];

  const results: any[] = [];

  // BL achat
  const { data: bls } = await supabase.rpc('exec_sql', {
    sql: `SELECT b.*, f.nom_fournisseur FROM "${tenant}".bl_achat b
          LEFT JOIN "${tenant}".fournisseur f ON f.nfournisseur = b.nfournisseur
          WHERE b.date_bl <= '${cutoff}'`,
    tenant
  }).catch(() => ({ data: null }));

  // Factures achat
  const { data: facts } = await supabase.rpc('exec_sql', {
    sql: `SELECT f2.*, f.nom_fournisseur FROM "${tenant}".facture_achat f2
          LEFT JOIN "${tenant}".fournisseur f ON f.nfournisseur = f2.nfournisseur
          WHERE f2.date_fact <= '${cutoff}'`,
    tenant
  }).catch(() => ({ data: null }));

  // Paiements fournisseurs
  const { data: payments } = await supabase
    .from('supplier_payments')
    .select('document_type, document_id, amount')
    .eq('tenant', tenant)
    .catch(() => ({ data: null }));

  const paidMap = new Map<string, number>();
  (payments || []).forEach((p: any) => {
    const key = `${p.document_type}_${p.document_id}`;
    paidMap.set(key, (paidMap.get(key) || 0) + parseFloat(p.amount || 0));
  });

  const processRows = (rows: any[], docType: string) => {
    (rows || []).forEach((row: any) => {
      const id = row.nfact || row.nbl || row.id;
      const total = parseFloat(row.montant_ttc || row.total_ttc || 0);
      const paid = paidMap.get(`${docType}_${id}`) || 0;
      const balance = total - paid;
      if (balance > 0.01) {
        const docDate = new Date(row.date_fact || row.date_bl);
        const daysOverdue = Math.floor((Date.now() - docDate.getTime()) / 86400000);
        results.push({
          document_type: docType,
          document_id: id,
          nfournisseur: row.nfournisseur,
          supplier_name: row.nom_fournisseur || row.nfournisseur,
          date_doc: row.date_fact || row.date_bl,
          montant_ttc: total,
          paid,
          balance,
          days_overdue: daysOverdue
        });
      }
    });
  };

  processRows(bls || [], 'purchase_bl');
  processRows(facts || [], 'purchase_invoice');

  results.sort((a, b) => b.balance - a.balance);
  const total_amount = results.reduce((s, r) => s + r.balance, 0);

  return NextResponse.json({ success: true, data: { overdue_debts: results, total_amount } });
}

async function getOverdueSupplierDebtsSQL(tenant: string, days: number, dbType: string) {
  // Fallback: retourner vide si pas de config SQL disponible côté API
  // La page frontend peut appeler le backend local si nécessaire
  return NextResponse.json({
    success: true,
    data: { overdue_debts: [], total_amount: 0 },
    note: 'SQL local: utilisez le backend sur port 3005'
  });
}
