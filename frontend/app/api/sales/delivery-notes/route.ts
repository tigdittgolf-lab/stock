import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    console.log(`🔍 Récupération des BL pour le tenant: ${tenant}`);

    try {
      const { data, error } = await supabase.rpc('get_delivery_notes', {
        p_tenant: tenant
      });

      console.log(`📊 Résultat RPC get_delivery_notes:`, { 
        error: error, 
        dataType: typeof data,
        dataContent: data,
        tenant: tenant 
      });

      if (!error && data) {
        let deliveryNotes = data;
        if (typeof data === 'string') {
          try {
            deliveryNotes = JSON.parse(data);
          } catch (parseError) {
            console.log('⚠️ Failed to parse JSON:', parseError);
            deliveryNotes = [];
          }
        }
        
        console.log(`✅ BL récupérés via RPC:`, deliveryNotes?.length || 0);
        return NextResponse.json({
          success: true,
          data: deliveryNotes || [],
          debug: {
            tenant: tenant,
            method: 'rpc_function',
            function: 'get_delivery_notes',
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
            function: 'get_delivery_notes',
            suggestion: 'Vérifiez que la fonction RPC get_delivery_notes existe dans Supabase'
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
          function: 'get_delivery_notes',
          suggestion: 'La fonction RPC get_delivery_notes n\'existe pas ou a échoué'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: [],
      debug: {
        tenant: tenant,
        method: 'fallback',
        message: 'Aucune méthode n\'a fonctionné'
      }
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