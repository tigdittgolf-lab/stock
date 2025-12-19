import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    console.log(`🔍 Récupération des clients pour le tenant: ${tenant}`);

    // Utiliser UNIQUEMENT les fonctions RPC (pas de requête directe sur les schémas)
    try {
      const { data, error } = await supabase.rpc('get_clients', {
        p_tenant: tenant
      });

      console.log(`📊 Résultat RPC get_clients:`, { 
        error: error, 
        dataType: typeof data,
        dataContent: data,
        tenant: tenant 
      });

      if (!error && data) {
        // Parse JSON if it's a string
        let clients = data;
        if (typeof data === 'string') {
          try {
            clients = JSON.parse(data);
          } catch (parseError) {
            console.log('⚠️ Failed to parse JSON:', parseError);
            clients = [];
          }
        }
        
        console.log(`✅ Clients récupérés via RPC:`, clients?.length || 0);
        return NextResponse.json({
          success: true,
          data: clients || [],
          debug: {
            tenant: tenant,
            method: 'rpc_function',
            function: 'get_clients',
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
            function: 'get_clients',
            suggestion: 'Vérifiez que la fonction RPC get_clients existe dans Supabase'
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
          function: 'get_clients',
          suggestion: 'La fonction RPC get_clients n\'existe pas ou a échoué'
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