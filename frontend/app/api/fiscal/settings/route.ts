import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Default fiscal settings for Algeria
const DEFAULT_SETTINGS = {
  tva_normal: 19,
  tva_reduit: 9,
  tva_super_reduit: 0,
  tap_rate: 2,
  timbre_fiscal: 0.5,
  ias_rate: 0,
  currency: 'DZD',
  updated_at: new Date().toISOString()
};

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';

  try {
    // Store settings in public.fiscal_settings with tenant column
    const { data, error } = await supabase
      .from('fiscal_settings')
      .select('*')
      .eq('tenant', tenant)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: true, data: { ...DEFAULT_SETTINGS, tenant } });
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: true, data: { ...DEFAULT_SETTINGS, tenant } });
  }
}

export async function POST(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const body = await request.json();

  try {
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
