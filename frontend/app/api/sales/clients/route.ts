import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    console.log(`🔍 Récupération des clients pour le tenant: ${tenant}`);

    // Essayer avec la fonction RPC
    try {
      const { data, error } = await supabase.rpc('get_clients', {
        p_tenant: tenant
      });

      if (!error && data) {
        console.log(`✅ Clients récupérés via RPC:`, data.length);
        return NextResponse.json({
          success: true,
          data: data || []
        });
      }
    } catch (rpcError) {
      console.log('⚠️ RPC function not available, trying direct query');
    }

    // Requête directe sur le schéma tenant
    try {
      const { data: clientData, error: clientError } = await supabase
        .from(`${tenant}.client`)
        .select('*')
        .order('nclient');

      if (!clientError && clientData) {
        console.log(`✅ Clients récupérés via requête directe:`, clientData.length);
        return NextResponse.json({
          success: true,
          data: clientData
        });
      }
    } catch (directError) {
      console.log('⚠️ Direct query failed:', directError);
    }

    // Fallback : données vides
    console.log('⚠️ Aucune donnée trouvée, retour de tableau vide');
    return NextResponse.json({
      success: true,
      data: []
    });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}