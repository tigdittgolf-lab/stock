import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}
const supabase = { get: getSupabase };

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    console.log(`🔍 Récupération des factures achat pour le tenant: ${tenant}`);

    try {
      const { data, error } = await supabase.rpc('get_purchase_invoices', {
        p_tenant: tenant
      });

      console.log(`📊 Résultat RPC get_purchase_invoices:`, { 
        error: error, 
        dataType: typeof data,
        dataContent: data,
        tenant: tenant 
      });

      if (!error && data) {
        let invoices = data;
        if (typeof data === 'string') {
          try {
            invoices = JSON.parse(data);
          } catch (parseError) {
            console.log('⚠️ Failed to parse JSON:', parseError);
            invoices = [];
          }
        }
        
        console.log(`✅ Factures achat récupérées via RPC:`, invoices?.length || 0);
        return NextResponse.json({
          success: true,
          data: invoices || [],
          debug: {
            tenant: tenant,
            method: 'rpc_function',
            function: 'get_purchase_invoices',
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
            function: 'get_purchase_invoices',
            suggestion: 'Vérifiez que la fonction RPC get_purchase_invoices existe dans Supabase'
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
          function: 'get_purchase_invoices',
          suggestion: 'La fonction RPC get_purchase_invoices n\'existe pas ou a échoué'
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