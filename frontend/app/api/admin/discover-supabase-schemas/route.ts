import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { url, key } = await request.json();

    console.log('🔍 Découverte des schémas Supabase...');

    const client = createClient(url, key);

    // Découvrir les schémas via RPC
    const { data, error } = await client.rpc('discover_tenant_schemas', {});

    if (error) {
      console.error('❌ Erreur découverte schémas:', error);
      return NextResponse.json({
        success: false,
        error: `Erreur découverte: ${error.message}`
      }, { status: 500 });
    }

    const schemaList = Array.isArray(data) ? data : JSON.parse(data || '[]');
    console.log(`✅ ${schemaList.length} schémas découverts`);

    // Récupérer les infos de chaque schéma
    const tenantDatabases = [];
    const otherDatabases = [];

    for (const schemaName of schemaList) {
      try {
        // Récupérer les tables du schéma
        const { data: tables, error: tablesError } = await client.rpc('discover_schema_tables', {
          p_schema_name: schemaName
        });

        if (tablesError) {
          console.warn(`⚠️ Erreur tables ${schemaName}:`, tablesError);
          continue;
        }

        const tableList = Array.isArray(tables) ? tables : JSON.parse(tables || '[]');
        
        // Estimer le nombre d'enregistrements
        let estimatedRows = 0;
        for (const table of tableList.slice(0, 3)) { // Limiter à 3 tables pour la vitesse
          try {
            const { data: structure } = await client.rpc('discover_table_structure', {
              p_schema_name: schemaName,
              p_table_name: table.table_name
            });
            
            if (structure) {
              const structureObj = typeof structure === 'string' ? JSON.parse(structure) : structure;
              estimatedRows += structureObj.record_count || 0;
            }
          } catch (e) {
            // Ignorer les erreurs
          }
        }

        const dbInfo = {
          name: schemaName,
          type: schemaName.match(/^\d{4}_bu\d{2}$/) ? 'tenant' as const : 'other' as const,
          tableCount: tableList.length,
          estimatedRows
        };

        if (dbInfo.type === 'tenant') {
          tenantDatabases.push(dbInfo);
        } else {
          otherDatabases.push(dbInfo);
        }
      } catch (error) {
        console.warn(`⚠️ Erreur analyse ${schemaName}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      databases: {
        tenant: tenantDatabases,
        other: otherDatabases,
        total: tenantDatabases.length + otherDatabases.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur découverte Supabase:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
