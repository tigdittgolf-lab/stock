import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readTable } from '@/lib/supabase-rpc';

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

    const registeredSchemas = new Set((businessUnits || []).map((bu: any) => bu.schema_name));

    // Also discover schemas that exist in Supabase but are not registered
    let unregisteredBUs: any[] = [];
    try {
      const { data: schemas } = await sb.rpc('discover_tenant_schemas', {});
      const schemaList: string[] = Array.isArray(schemas) ? schemas : JSON.parse(schemas || '[]');
      for (const schema of schemaList) {
        if (!registeredSchemas.has(schema) && /^\d{4}_bu\d{2}$/.test(schema)) {
          // Try to get activite data for this schema
          let activiteData: any = {};
          try {
            const rows = await readTable(schema, 'activite');
            if (rows.length > 0) activiteData = rows[0];
          } catch {}
          const fv = (...keys: string[]) => { for (const k of keys) { const found = Object.keys(activiteData).find(ak => ak.toLowerCase() === k.toLowerCase()); if (found && activiteData[found]) return activiteData[found]; } return ''; };
          const year = parseInt(schema.split('_')[0]) || new Date().getFullYear();
          unregisteredBUs.push({
            schema_name: schema,
            bu_code: schema.split('_')[1]?.toUpperCase() || '',
            year,
            nom_entreprise: fv('nom_entreprise', 'nom') || schema,
            adresse: fv('adresse'), commune: fv('commune'), wilaya: fv('wilaya'),
            telephone: fv('telephone', 'tel_fixe'), tel_port: fv('tel_port'),
            email: fv('email', 'e_mail'),
            nif: fv('nif', 'ident_fiscal'), rc: fv('rc', 'nrc'), nart: fv('nart', 'art'),
            activite: fv('activite', 'sous_domaine'), slogan: fv('slogan'),
            active: true, created_at: null,
            _unregistered: true, // flag to show "Add to registry" button
          });
        }
      }
    } catch { /* discover is optional */ }

    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
    const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const enrichedBUs = await Promise.all(
      (businessUnits || []).map(async (bu: any) => {
        try {
          // Read activite table directly via REST — handles any column casing
          const res = await fetch(`${SUPA_URL}/rest/v1/activite?select=*&limit=1`, {
            headers: {
              'apikey': SUPA_KEY,
              'Authorization': `Bearer ${SUPA_KEY}`,
              'Accept-Profile': bu.schema_name,
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(5000),
          });

          if (!res.ok) return bu;
          const rows = await res.json();
          if (!Array.isArray(rows) || rows.length === 0) return bu;

          const r = rows[0];
          const keys = Object.keys(r);
          const fv = (...names: string[]) => {
            for (const n of names) {
              const k = keys.find(k => k.toLowerCase() === n.toLowerCase());
              if (k !== undefined && r[k] !== null && r[k] !== undefined && r[k] !== '') return r[k];
            }
            return '';
          };

          return {
            ...bu,
            nom_entreprise: fv('nom_entreprise', 'nom') || bu.nom_entreprise || '',
            adresse: fv('adresse', 'address') || bu.adresse || '',
            commune: fv('commune') || bu.commune || '',
            wilaya: fv('wilaya') || bu.wilaya || '',
            telephone: fv('telephone', 'tel_fixe', 'tel', 'phone') || bu.telephone || '',
            tel_port: fv('tel_port', 'gsm', 'mobile') || bu.tel_port || '',
            email: fv('email', 'e_mail', 'mail') || bu.email || '',
            nif: fv('nif', 'ident_fiscal') || bu.nif || '',
            rc: fv('rc', 'nrc') || bu.rc || '',
            nart: fv('nart', 'art') || bu.nart || '',
            nis: fv('nis') || bu.nis || '',
            activite: fv('activite', 'sous_domaine', 'domaine_activite') || bu.activite || '',
            slogan: fv('slogan') || bu.slogan || '',
          };
        } catch {
          return bu;
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: [...enrichedBUs, ...unregisteredBUs]
    });
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
