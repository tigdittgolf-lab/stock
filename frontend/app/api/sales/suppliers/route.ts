import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    console.log(`🔍 Récupération des fournisseurs pour le tenant: ${tenant}`);

    // Essayer avec la fonction RPC
    try {
      const { data, error } = await supabase.rpc('get_suppliers', {
        p_tenant: tenant
      });

      if (!error && data) {
        console.log(`✅ Fournisseurs récupérés via RPC:`, data.length);
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
      const { data: supplierData, error: supplierError } = await supabase
        .from(`${tenant}.fournisseur`)
        .select('*')
        .order('nfournisseur');

      if (!supplierError && supplierData) {
        console.log(`✅ Fournisseurs récupérés via requête directe:`, supplierData.length);
        return NextResponse.json({
          success: true,
          data: supplierData
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