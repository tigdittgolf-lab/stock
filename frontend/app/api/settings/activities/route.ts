import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    console.log(`🔍 Récupération activité pour le tenant: ${tenant}`);

    try {
      const { data, error } = await supabase.rpc('get_tenant_activite', {
        p_tenant: tenant
      });

      console.log(`📊 Résultat RPC get_tenant_activite:`, { 
        error: error, 
        dataType: typeof data,
        dataContent: data,
        tenant: tenant 
      });

      if (!error && data) {
        let activity = data;
        if (typeof data === 'string') {
          try {
            activity = JSON.parse(data);
          } catch (parseError) {
            console.log('⚠️ Failed to parse JSON:', parseError);
            activity = null;
          }
        }
        
        console.log(`✅ Activité récupérée via RPC`);
        return NextResponse.json({
          success: true,
          data: activity,
          debug: {
            tenant: tenant,
            method: 'rpc_function',
            function: 'get_tenant_activite'
          }
        });
      } else if (error) {
        console.log(`❌ Erreur RPC:`, error);
        return NextResponse.json({
          success: true,
          data: null,
          debug: {
            tenant: tenant,
            error: error.message,
            function: 'get_tenant_activite'
          }
        });
      }
    } catch (rpcError) {
      console.log('⚠️ RPC function failed:', rpcError);
      return NextResponse.json({
        success: true,
        data: null,
        debug: {
          tenant: tenant,
          error: rpcError instanceof Error ? rpcError.message : 'RPC Error',
          function: 'get_tenant_activite'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: null
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

export async function POST(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const body = await request.json();
    
    console.log(`🔍 Mise à jour activité pour le tenant: ${tenant}`, body);

    try {
      const { data, error } = await supabase.rpc('update_tenant_activite', {
        p_tenant: tenant,
        p_data: body
      });

      console.log(`📊 Résultat RPC update_tenant_activite:`, { 
        error: error, 
        data: data,
        tenant: tenant,
        body: body
      });

      if (!error) {
        return NextResponse.json({
          success: true,
          message: 'Activité mise à jour avec succès',
          data: data,
          debug: {
            tenant: tenant,
            function: 'update_tenant_activite',
            input: body
          }
        });
      } else {
        console.log(`❌ Erreur RPC update:`, error);
        return NextResponse.json({
          success: false,
          error: error.message,
          debug: {
            tenant: tenant,
            function: 'update_tenant_activite',
            input: body,
            rpcError: error
          }
        }, { status: 400 });
      }
    } catch (rpcError) {
      console.log(`❌ Exception RPC update:`, rpcError);
      return NextResponse.json({
        success: false,
        error: 'Fonction RPC update_tenant_activite non disponible',
        debug: {
          tenant: tenant,
          exception: rpcError instanceof Error ? rpcError.message : 'Unknown error'
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erreur mise à jour activité:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}