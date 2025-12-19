import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Diagnostic complet des schémas...');

    const results: any = {
      timestamp: new Date().toISOString(),
      methods: {}
    };

    // Test 1: debug_all_schemas
    try {
      const { data: debugData, error: debugError } = await supabase.rpc('debug_all_schemas');
      results.methods.debug_all_schemas = {
        success: !debugError,
        error: debugError?.message,
        dataType: typeof debugData,
        data: debugData
      };
    } catch (error) {
      results.methods.debug_all_schemas = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 2: get_available_exercises
    try {
      const { data: exerciseData, error: exerciseError } = await supabase.rpc('get_available_exercises');
      results.methods.get_available_exercises = {
        success: !exerciseError,
        error: exerciseError?.message,
        dataType: typeof exerciseData,
        data: exerciseData
      };
    } catch (error) {
      results.methods.get_available_exercises = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 3: get_tenant_schemas
    try {
      const { data: schemaData, error: schemaError } = await supabase.rpc('get_tenant_schemas');
      results.methods.get_tenant_schemas = {
        success: !schemaError,
        error: schemaError?.message,
        dataType: typeof schemaData,
        data: schemaData
      };
    } catch (error) {
      results.methods.get_tenant_schemas = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 4: Requête directe sur information_schema
    try {
      const { data: directData, error: directError } = await supabase
        .from('information_schema.schemata')
        .select('schema_name')
        .like('schema_name', '%bu%');
      
      results.methods.direct_information_schema = {
        success: !directError,
        error: directError?.message,
        dataType: typeof directData,
        data: directData
      };
    } catch (error) {
      results.methods.direct_information_schema = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      success: true,
      diagnostic: results
    });

  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur diagnostic',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}