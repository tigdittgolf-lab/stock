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
    console.log('🔍 Test direct de la table business_units...');
    console.log('📊 Supabase URL:', supabaseUrl);
    console.log('🔑 Service Key présente:', !!supabaseServiceKey);

    // Test 1: Accès direct à la table
    const { data: tableData, error: tableError } = await supabase
      .from('business_units')
      .select('*');

    console.log('📊 Résultat accès table:', { 
      error: tableError, 
      dataLength: tableData?.length || 0,
      data: tableData 
    });

    // Test 2: RPC function
    let rpcData = null;
    let rpcError = null;
    try {
      const rpcResult = await supabase.rpc('get_available_exercises');
      rpcData = rpcResult.data;
      rpcError = rpcResult.error;
    } catch (error) {
      rpcError = error;
    }

    console.log('📊 Résultat RPC:', { 
      error: rpcError, 
      dataType: typeof rpcData,
      data: rpcData 
    });

    // Test 3: Vérifier les permissions
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    return NextResponse.json({
      success: true,
      tests: {
        table_access: {
          success: !tableError,
          error: tableError?.message,
          data: tableData,
          count: tableData?.length || 0
        },
        rpc_access: {
          success: !rpcError,
          error: rpcError instanceof Error ? rpcError.message : (rpcError as any)?.message || String(rpcError),
          data: rpcData,
          dataType: typeof rpcData
        },
        auth_check: {
          success: !authError,
          error: authError?.message,
          user: authData?.user?.id || null
        }
      },
      environment: {
        supabaseUrl: supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        serviceKeyLength: supabaseServiceKey?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur test:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}