import { NextRequest, NextResponse } from 'next/server';

// GET /api/sales/payments/summary
// Retourne un map {document_type::document_id: total_paid} en UNE SEULE requête
export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';

    const backendUrl = process.env.BACKEND_URL
      ? `${process.env.BACKEND_URL}/api`
      : 'http://localhost:3005/api';

    const response = await fetch(`${backendUrl}/sales/payments/summary`, {
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `Backend error: ${response.status}` }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
  }
}
