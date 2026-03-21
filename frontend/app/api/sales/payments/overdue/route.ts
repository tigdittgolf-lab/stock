import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api';

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const days = request.nextUrl.searchParams.get('days') || '30';

  try {
    const res = await fetch(getBackendUrl(`sales/overdue?days=${days}`), {
      headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType }
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur connexion backend' }, { status: 500 });
  }
}
