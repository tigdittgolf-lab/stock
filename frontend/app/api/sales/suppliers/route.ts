import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    console.log(`🔍 Récupération des fournisseurs pour le tenant: ${tenant}`);

    // Utiliser UNIQUEMENT les fonctions RPC (pas de requête directe sur les schémas)
    try {
      const { data, error } = await supabase.rpc('get_suppliers', {
        p_tenant: tenant
      });

      console.log(`📊 Résultat RPC get_suppliers:`, { 
        error: error, 
        dataType: typeof data,
        dataContent: data,
        tenant: tenant 
      });

      if (!error && data) {
        // Parse JSON if it's a string
        let suppliers = data;
        if (typeof data === 'string') {
          try {
            suppliers = JSON.parse(data);
          } catch (parseError) {
            console.log('⚠️ Failed to parse JSON:', parseError);
            suppliers = [];
          }
        }
        
        console.log(`✅ Fournisseurs récupérés via RPC:`, suppliers?.length || 0);
        return NextResponse.json({
          success: true,
          data: suppliers || [],
          debug: {
            tenant: tenant,
            method: 'rpc_function',
            function: 'get_suppliers',
            dataType: typeof data,
            originalData: data
          }
        });
      } else if (error) {
        console.log(`❌ Erreur RPC:`, error);
        return NextResponse.json({
          success: true,
          data: [],
          debug: {
            tenant: tenant,
            error: error.message,
            function: 'get_suppliers',
            suggestion: 'Vérifiez que la fonction RPC get_suppliers existe dans Supabase'
          }
        });
      }
    } catch (rpcError) {
      console.log('⚠️ RPC function failed:', rpcError);
      return NextResponse.json({
        success: true,
        data: [],
        debug: {
          tenant: tenant,
          error: rpcError instanceof Error ? rpcError.message : 'RPC Error',
          function: 'get_suppliers',
          suggestion: 'La fonction RPC get_suppliers n\'existe pas ou a échoué'
        }
      });
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