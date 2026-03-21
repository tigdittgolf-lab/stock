import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;

const DEFAULT_SETTINGS = {
  tva_normal: 19,
  tva_reduit: 9,
  tva_super_reduit: 0,
  tap_rate: 2,
  timbre_fiscal: 0.5,
  ias_rate: 0,
  currency: 'DZD'
};

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  // Try backend first (handles both MySQL and Supabase)
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/fiscal/settings`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch (e) {
      console.warn('[fiscal/settings] Backend unavailable');
    }
  }

  // Supabase direct fallback
  if (dbType === 'supabase') {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data } = await supabase
        .from('fiscal_settings')
        .select('*')
        .eq('tenant', tenant)
        .single();

      if (data) return NextResponse.json({ success: true, data });
    } catch (e) {
      // table may not exist yet, return defaults
    }
  }

  return NextResponse.json({ success: true, data: { ...DEFAULT_SETTINGS, tenant }, source: 'defaults' });
}

export async function POST(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const body = await request.json();

  // Try backend first
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/fiscal/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant': tenant, 'X-Database-Type': dbType },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch (e) {
      console.warn('[fiscal/settings POST] Backend unavailable');
    }
  }

  // Supabase direct fallback
  if (dbType === 'supabase') {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const settings = { ...body, tenant, updated_at: new Date().toISOString() };
      const { data, error } = await supabase
        .from('fiscal_settings')
        .upsert(settings, { onConflict: 'tenant' })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } catch (e) {
      return NextResponse.json(
        { success: false, error: e instanceof Error ? e.message : 'Erreur sauvegarde' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
}
