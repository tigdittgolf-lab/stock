import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    console.log(`🔍 Récupération infos entreprise pour le tenant: ${tenant}`);

    try {
      const { data, error } = await supabase.rpc('get_tenant_activite', {
        p_tenant: tenant
      });

      if (!error && data) {
        return NextResponse.json({
          success: true,
          data: data
        });
      } else {
        return NextResponse.json({
          success: true,
          data: {
            nom_entreprise: 'ETS BENAMAR BOUZID MENOUAR',
            adresse: '10, Rue Belhandouz A.E.K, Mostaganem',
            telephone: '(213)045.42.35.20',
            email: 'outillagesaada@gmail.com'
          }
        });
      }
    } catch (rpcError) {
      return NextResponse.json({
        success: true,
        data: {
          nom_entreprise: 'ETS BENAMAR BOUZID MENOUAR',
          adresse: '10, Rue Belhandouz A.E.K, Mostaganem',
          telephone: '(213)045.42.35.20',
          email: 'outillagesaada@gmail.com'
        }
      });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}