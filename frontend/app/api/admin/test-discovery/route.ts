import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAdapter } from '../../../../lib/database/adapters/supabase-adapter';
import { CompleteDiscoveryService } from '../../../../lib/database/complete-discovery-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supabaseConfig } = body;

    console.log('🔍 Test de découverte Supabase...');

    // Créer l'adaptateur Supabase
    const supabaseAdapter = new SupabaseAdapter(supabaseConfig);
    const connected = await supabaseAdapter.connect();

    if (!connected) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de se connecter à Supabase'
      });
    }

    // Créer le service de découverte
    const discoveryService = new CompleteDiscoveryService(supabaseAdapter);

    // Test 1: Découvrir les schémas
    console.log('🔍 Test 1: Découverte des schémas...');
    
    // Essayer d'abord avec la fonction RPC
    let schemas: string[] = [];
    try {
      const rpcResult = await supabaseAdapter.executeRPC('discover_tenant_schemas', {});
      if (rpcResult.success) {
        const schemaData = Array.isArray(rpcResult.data) ? rpcResult.data : JSON.parse(rpcResult.data || '[]');
        schemas = schemaData;
        console.log('✅ Schémas via RPC:', schemas);
      } else {
        console.log('❌ RPC discover_tenant_schemas échoué:', rpcResult.error);
        // Fallback: tester les schémas connus
        schemas = ['2025_bu01', '2024_bu01'];
      }
    } catch (error) {
      console.log('❌ Erreur RPC:', error);
      schemas = ['2025_bu01', '2024_bu01'];
    }
    
    console.log('📋 Schémas découverts:', schemas);

    const results = {
      schemas: schemas,
      tables: {} as Record<string, any[]>,
      totalTables: 0,
      sampleStructures: {} as Record<string, any>
    };

    // Test 2: Pour chaque schéma, découvrir les tables
    for (const schema of schemas.slice(0, 2)) { // Limiter à 2 schémas pour le test
      console.log(`🔍 Test 2: Découverte des tables pour ${schema}...`);
      
      try {
        // Tester les nouvelles fonctions RPC
        const rpcResult = await supabaseAdapter.executeRPC('discover_schema_tables', { 
          p_schema_name: schema 
        });

        if (rpcResult.success) {
          const tables = Array.isArray(rpcResult.data) ? rpcResult.data : JSON.parse(rpcResult.data || '[]');
          results.tables[schema] = tables;
          results.totalTables += tables.length;
          
          console.log(`✅ ${schema}: ${tables.length} tables via RPC`);
          console.log('📋 Tables:', tables.map((t: any) => t.table_name).join(', '));
          
          // Test 3: Analyser la structure d'une table exemple
          if (tables.length > 0) {
            const firstTable = tables[0].table_name;
            console.log(`🔍 Test 3: Analyse structure de ${firstTable}...`);
            
            const structureResult = await supabaseAdapter.executeRPC('discover_table_structure', {
              p_schema_name: schema,
              p_table_name: firstTable
            });
            
            if (structureResult.success) {
              const structure = typeof structureResult.data === 'string' ? 
                JSON.parse(structureResult.data) : structureResult.data;
              
              // CORRECTION: Les données peuvent être dans un tableau
              let actualStructure = structure;
              if (Array.isArray(structure) && structure.length > 0) {
                actualStructure = structure[0];
              }
              
              results.sampleStructures[`${schema}.${firstTable}`] = actualStructure;
              console.log(`✅ Structure ${firstTable}:`, actualStructure.columns?.length, 'colonnes');
            }
          }
        } else {
          console.log(`❌ ${schema}: Erreur RPC -`, rpcResult.error);
          results.tables[schema] = [];
        }
      } catch (error) {
        console.error(`❌ Erreur découverte ${schema}:`, error);
        results.tables[schema] = [];
      }
    }

    await supabaseAdapter.disconnect();

    return NextResponse.json({
      success: true,
      message: 'Test de découverte terminé',
      results: results,
      summary: {
        schemasFound: results.schemas.length,
        totalTables: results.totalTables,
        rpcFunctionsWorking: Object.keys(results.sampleStructures).length > 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur test découverte:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur test découverte',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Endpoint de test de découverte disponible',
    usage: 'POST avec supabaseConfig pour tester la découverte'
  });
}