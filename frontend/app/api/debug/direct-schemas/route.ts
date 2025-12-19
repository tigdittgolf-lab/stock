import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Diagnostic DIRECT des schémas - sans RPC...');

    // Méthode DIRECTE: Requête SQL brute pour lister TOUS les schémas
    const { data: rawSchemas, error: rawError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            schema_name,
            CASE 
              WHEN schema_name ~ '^\\d{4}_bu\\d+$' THEN 'TENANT_SCHEMA'
              ELSE 'OTHER_SCHEMA'
            END as schema_type
          FROM information_schema.schemata 
          WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
          ORDER BY schema_name;
        `
      });

    if (rawError) {
      console.log('❌ Erreur exec_sql:', rawError);
      
      // Alternative: Essayer une requête directe simple
      const { data: simpleData, error: simpleError } = await supabase
        .from('pg_namespace')
        .select('nspname')
        .not('nspname', 'in', '(information_schema,pg_catalog,pg_toast)')
        .order('nspname');

      return NextResponse.json({
        success: true,
        method: 'pg_namespace_fallback',
        schemas: simpleData || [],
        error: simpleError?.message,
        rawError: rawError.message
      });
    }

    // Filtrer les schémas tenant
    const allSchemas = rawSchemas || [];
    const tenantSchemas = allSchemas.filter((schema: any) => 
      schema.schema_type === 'TENANT_SCHEMA'
    );

    // Convertir au format BU
    const businessUnits = tenantSchemas.map((schema: any) => {
      const schemaName = schema.schema_name;
      const yearMatch = schemaName.match(/(\d{4})/);
      const buMatch = schemaName.match(/bu(\d+)/);
      
      return {
        schema_name: schemaName,
        bu_code: buMatch ? buMatch[1] : '01',
        year: yearMatch ? parseInt(yearMatch[1]) : 2025,
        nom_entreprise: 'ETS BENAMAR BOUZID MENOUAR',
        adresse: '10, Rue Belhandouz A.E.K, Mostaganem',
        telephone: '(213)045.42.35.20',
        email: 'outillagesaada@gmail.com',
        active: true
      };
    }).sort((a: any, b: any) => {
      // Trier par année décroissante, puis par BU croissant
      if (a.year !== b.year) return b.year - a.year;
      return parseInt(a.bu_code) - parseInt(b.bu_code);
    });

    return NextResponse.json({
      success: true,
      method: 'exec_sql_direct',
      totalSchemas: allSchemas.length,
      tenantSchemas: tenantSchemas.length,
      businessUnits: businessUnits,
      allSchemas: allSchemas,
      debug: {
        tenantPattern: '^\\d{4}_bu\\d+$',
        foundTenantSchemas: tenantSchemas.map((s: any) => s.schema_name)
      }
    });

  } catch (error) {
    console.error('❌ Erreur diagnostic direct:', error);
    
    // FALLBACK ULTIME: Retourner une structure de test étendue
    const fallbackBUs = [
      { schema_name: '2025_bu01', bu_code: '01', year: 2025, nom_entreprise: 'ETS BENAMAR BOUZID MENOUAR', active: true },
      { schema_name: '2025_bu02', bu_code: '02', year: 2025, nom_entreprise: 'ETS BENAMAR BOUZID MENOUAR', active: true },
      { schema_name: '2025_bu03', bu_code: '03', year: 2025, nom_entreprise: 'ETS BENAMAR BOUZID MENOUAR', active: true },
      { schema_name: '2024_bu01', bu_code: '01', year: 2024, nom_entreprise: 'ETS BENAMAR BOUZID MENOUAR', active: true },
      { schema_name: '2024_bu02', bu_code: '02', year: 2024, nom_entreprise: 'ETS BENAMAR BOUZID MENOUAR', active: true },
      { schema_name: '2023_bu01', bu_code: '01', year: 2023, nom_entreprise: 'ETS BENAMAR BOUZID MENOUAR', active: true }
    ];

    return NextResponse.json({
      success: false,
      method: 'fallback_extended',
      error: error instanceof Error ? error.message : 'Unknown error',
      businessUnits: fallbackBUs
    });
  }
}