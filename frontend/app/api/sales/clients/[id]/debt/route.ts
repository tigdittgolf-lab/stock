import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = request.headers.get('x-tenant') || '2009_bu02';
    const dbType = request.headers.get('x-database-type') || 'supabase';

    // 1. Try backend
    if (process.env.BACKEND_URL) {
      try {
        const response = await fetch(`${process.env.BACKEND_URL}/api/sales/clients/${id}/debt`, {
          headers: {
            'X-Tenant': tenant,
            'X-Database-Type': dbType,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          signal: AbortSignal.timeout(4000)
        });
        if (response.ok) return NextResponse.json(await response.json());
        // Backend responded with error — fall through to Supabase
      } catch { /* network error — fall through to Supabase */ }
    }

    // 2. Supabase direct fallback
    if (dbType !== 'supabase') {
      return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
    }

    // Fetch client base info
    const clientUrl = `${SUPABASE_URL}/rest/v1/client?nclient=eq.${id}&select=*&limit=1`;
    const clientRes = await fetch(clientUrl, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Accept-Profile': tenant,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!clientRes.ok) {
      return NextResponse.json({ success: false, error: `Client ${id} introuvable` }, { status: 404 });
    }

    const clientRows = await clientRes.json();
    if (!Array.isArray(clientRows) || clientRows.length === 0) {
      return NextResponse.json({ success: false, error: `Client ${id} introuvable` }, { status: 404 });
    }

    const client = clientRows[0];
    const keys = Object.keys(client);
    const findVal = (...names: string[]) => {
      for (const n of names) {
        const k = keys.find(k => k.toLowerCase() === n.toLowerCase());
        if (k !== undefined && client[k] !== null && client[k] !== undefined) return client[k];
      }
      return undefined;
    };

    return NextResponse.json({
      success: true,
      data: {
        nclient: findVal('nclient'),
        raison_sociale: findVal('raison_sociale', 'nom', 'client_name'),
        adresse: findVal('adresse', 'address'),
        telephone: findVal('telephone', 'tel', 'phone'),
        solde: parseFloat(findVal('solde', 'dette', 'balance') ?? '0') || 0,
        chiffre_affaire: parseFloat(findVal('chiffre_affaire', 'ca_total') ?? '0') || 0,
        c_affaire_fact: parseFloat(findVal('c_affaire_fact', 'ca_fact') ?? '0') || 0,
        c_affaire_bl: parseFloat(findVal('c_affaire_bl', 'ca_bl') ?? '0') || 0,
      },
      source: 'supabase_direct'
    });

  } catch (error) {
    console.error('❌ Error in client debt proxy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client debt' },
      { status: 500 }
    );
  }
}
