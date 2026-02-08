// API Route: /api/admin/stats
// Returns admin statistics

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    // Pour l'instant, retourner des statistiques de base
    // TODO: Implémenter les vraies statistiques depuis la base de données
    return NextResponse.json({
      success: true,
      data: {
        totalUsers: 0,
        totalArticles: 0,
        totalClients: 0,
        totalSuppliers: 0,
        totalDeliveryNotes: 0,
        totalInvoices: 0,
        tenant: tenant
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/stats:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
