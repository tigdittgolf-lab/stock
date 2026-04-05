import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

export async function GET(request: NextRequest) {
  try {
    const sb = getSupabase();
    const { data: businessUnits, error } = await sb
      .from('business_units')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const enrichedBUs = await Promise.all(
      (businessUnits || []).map(async (bu) => {
        try {
          const { data: activiteData } = await sb.rpc('get_tenant_activite', { p_tenant: bu.schema_name });
          return {
            ...bu,
            nom_entreprise: activiteData?.nom_entreprise || bu.nom_entreprise || '',
            adresse: activiteData?.adresse || '',
            commune: activiteData?.commune || '',
            wilaya: activiteData?.wilaya || '',
            telephone: activiteData?.telephone || activiteData?.tel_fixe || '',
            tel_port: activiteData?.tel_port || '',
            email: activiteData?.email || activiteData?.e_mail || '',
            nif: activiteData?.nif || '',
            rc: activiteData?.rc || activiteData?.nrc || '',
            nart: activiteData?.nart || '',
            activite: activiteData?.activite || activiteData?.sous_domaine || '',
            slogan: activiteData?.slogan || ''
          };
        } catch {
          return bu;
        }
      })
    );

    return NextResponse.json({ success: true, data: enrichedBUs || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Erreur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sb = getSupabase();
    const { data, error } = await sb.from('business_units').insert([body]).select().single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data, message: 'Business unit créée avec succès' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur interne' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { schema_name, ...updateData } = body;
    const sb = getSupabase();

    const { data: buData, error: buError } = await sb
      .from('business_units')
      .update({ bu_code: updateData.bu_code, year: updateData.year, active: updateData.active })
      .eq('schema_name', schema_name)
      .select()
      .single();

    if (buError) return NextResponse.json({ success: false, error: buError.message }, { status: 400 });

    try {
      await sb.rpc('update_tenant_activite', {
        p_tenant: schema_name,
        p_data: {
          nom_entreprise: updateData.nom_entreprise, adresse: updateData.adresse,
          commune: updateData.commune, wilaya: updateData.wilaya,
          telephone: updateData.telephone, tel_port: updateData.tel_port,
          email: updateData.email, nif: updateData.nif,
          rc: updateData.rc, nrc: updateData.nrc, nart: updateData.nart,
          banq: updateData.banq, activite: updateData.activite, slogan: updateData.slogan
        }
      });
    } catch { /* non critique */ }

    return NextResponse.json({ success: true, data: { ...buData, ...updateData }, message: 'Business unit mise à jour' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur interne' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const schema = url.pathname.split('/').pop();
    const sb = getSupabase();
    const { error } = await sb.from('business_units').delete().eq('schema_name', schema);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, message: 'Business unit supprimée' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur interne' }, { status: 500 });
  }
}
