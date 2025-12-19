import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    console.log(`🔍 Récupération des familles pour le tenant: ${tenant}`);

    try {
      const { data, error } = await supabase.rpc('get_families', {
        p_tenant: tenant
      });

      console.log(`📊 Résultat RPC get_families:`, { 
        error: error, 
        dataType: typeof data,
        dataContent: data,
        tenant: tenant 
      });

      if (!error && data) {
        let families = data;
        if (typeof data === 'string') {
          try {
            families = JSON.parse(data);
          } catch (parseError) {
            console.log('⚠️ Failed to parse JSON:', parseError);
            families = [];
          }
        }
        
        console.log(`✅ Familles récupérées via RPC:`, families?.length || 0);
        return NextResponse.json({
          success: true,
          data: families || [],
          debug: {
            tenant: tenant,
            method: 'rpc_function',
            function: 'get_families',
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
            function: 'get_families',
            suggestion: 'Vérifiez que la fonction RPC get_families existe dans Supabase'
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
          function: 'get_families',
          suggestion: 'La fonction RPC get_families n\'existe pas ou a échoué'
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

export async function POST(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const body = await request.json();
    
    console.log(`🔍 Création famille pour le tenant: ${tenant}`, body);

    // Créer une famille via RPC
    try {
      const { data, error } = await supabase.rpc('create_family', {
        p_tenant: tenant,
        p_famille: body.famille
      });

      if (!error) {
        return NextResponse.json({
          success: true,
          message: 'Famille créée avec succès',
          data: data
        });
      } else {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 400 });
      }
    } catch (rpcError) {
      return NextResponse.json({
        success: false,
        error: 'Fonction RPC create_family non disponible'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erreur création famille:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const url = new URL(request.url);
    const famille = url.pathname.split('/').pop();
    
    console.log(`🔍 Suppression famille pour le tenant: ${tenant}`, famille);

    // Supprimer une famille via RPC
    try {
      const { data, error } = await supabase.rpc('delete_family', {
        p_tenant: tenant,
        p_famille: famille
      });

      if (!error) {
        return NextResponse.json({
          success: true,
          message: 'Famille supprimée avec succès'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 400 });
      }
    } catch (rpcError) {
      return NextResponse.json({
        success: false,
        error: 'Fonction RPC delete_family non disponible'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erreur suppression famille:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}