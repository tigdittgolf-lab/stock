import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAdapter } from '../../../../lib/database/adapters/supabase-adapter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supabaseConfig, schemaName, tableName } = body;

    console.log('🔍 Test adaptateur Supabase pour discover_table_structure...');

    // Créer l'adaptateur Supabase
    const supabaseAdapter = new SupabaseAdapter(supabaseConfig);
    const connected = await supabaseAdapter.connect();

    if (!connected) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de se connecter à Supabase'
      });
    }

    // Tester la fonction discover_table_structure via l'adaptateur
    console.log(`🔍 Test discover_table_structure pour ${schemaName}.${tableName}...`);
    
    const structureResult = await supabaseAdapter.executeRPC('discover_table_structure', {
      p_schema_name: schemaName,
      p_table_name: tableName
    });

    console.log('📋 Résultat brut de l\'adaptateur:', {
      success: structureResult.success,
      dataType: typeof structureResult.data,
      isArray: Array.isArray(structureResult.data),
      dataLength: Array.isArray(structureResult.data) ? structureResult.data.length : 'N/A',
      error: structureResult.error
    });

    if (structureResult.success && structureResult.data) {
      console.log('📋 Données détaillées:');
      
      if (Array.isArray(structureResult.data)) {
        console.log(`  📊 Tableau de ${structureResult.data.length} éléments`);
        if (structureResult.data.length > 0) {
          const firstElement = structureResult.data[0];
          console.log('  📋 Premier élément:', typeof firstElement);
          console.log('  📋 Colonnes dans premier élément:', firstElement?.columns?.length || 'N/A');
        }
      } else {
        console.log('  📋 Objet unique');
        console.log('  📋 Colonnes dans objet:', structureResult.data?.columns?.length || 'N/A');
      }
    }

    await supabaseAdapter.disconnect();

    return NextResponse.json({
      success: true,
      message: 'Test adaptateur terminé',
      result: {
        success: structureResult.success,
        dataType: typeof structureResult.data,
        isArray: Array.isArray(structureResult.data),
        dataLength: Array.isArray(structureResult.data) ? structureResult.data.length : 'N/A',
        hasColumns: structureResult.data?.columns?.length || (Array.isArray(structureResult.data) && structureResult.data[0]?.columns?.length) || 0,
        error: structureResult.error
      }
    });

  } catch (error) {
    console.error('❌ Erreur test adaptateur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur test adaptateur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Endpoint de test adaptateur disponible',
    usage: 'POST avec supabaseConfig, schemaName, tableName'
  });
}