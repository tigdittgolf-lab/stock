import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { schemaName } = await request.json();
    
    console.log(`🗑️ CLEANUP: Suppression du schéma ${schemaName}`);
    
    // Configuration Supabase
    const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';
    
    const client = createClient(supabaseUrl, supabaseKey);
    
    const steps: string[] = [];
    
    // ÉTAPE 1: Vérifier que le schéma existe
    steps.push('1️⃣ Vérification existence schéma...');
    const { data: schemas, error: schemaError } = await client.rpc('discover_tenant_schemas', {});
    
    if (schemaError) {
      throw new Error(`Erreur vérification schéma: ${schemaError.message}`);
    }
    
    const schemaList = Array.isArray(schemas) ? schemas : JSON.parse(schemas || '[]');
    if (!schemaList.includes(schemaName)) {
      steps.push(`⚠️ Le schéma ${schemaName} n'existe pas (déjà supprimé?)`);
      return NextResponse.json({
        success: true,
        alreadyDeleted: true,
        schemaName,
        steps
      });
    }
    steps.push(`✅ Schéma ${schemaName} existe`);
    
    // ÉTAPE 2: Lister les tables avant suppression
    steps.push('2️⃣ Liste des tables avant suppression...');
    const { data: tables, error: tablesError } = await client.rpc('discover_schema_tables', {
      p_schema_name: schemaName
    });
    
    if (!tablesError && tables) {
      const tableList = Array.isArray(tables) ? tables : JSON.parse(tables || '[]');
      steps.push(`📋 ${tableList.length} tables trouvées: ${tableList.map((t: any) => t.table_name).join(', ')}`);
    }
    
    // ÉTAPE 3: Supprimer le schéma avec CASCADE
    steps.push('3️⃣ Suppression du schéma avec CASCADE...');
    const dropSQL = `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`;
    steps.push(`📝 SQL: ${dropSQL}`);
    
    const { data: dropData, error: dropError } = await client.rpc('exec_sql', {
      sql_query: dropSQL,
      params: []
    });
    
    if (dropError) {
      steps.push(`❌ Erreur suppression: ${dropError.message}`);
      throw new Error(`Erreur suppression: ${dropError.message}`);
    }
    
    steps.push(`✅ exec_sql retourné: ${JSON.stringify(dropData)}`);
    
    // ÉTAPE 4: VÉRIFICATION - Le schéma a-t-il été supprimé?
    steps.push('4️⃣ VÉRIFICATION: Le schéma a-t-il été supprimé?');
    
    // Attendre un peu pour que Supabase synchronise
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: verifySchemas, error: verifyError } = await client.rpc('discover_tenant_schemas', {});
    
    if (verifyError) {
      steps.push(`⚠️ Erreur vérification: ${verifyError.message}`);
    } else {
      const verifyList = Array.isArray(verifySchemas) ? verifySchemas : JSON.parse(verifySchemas || '[]');
      
      if (verifyList.includes(schemaName)) {
        steps.push(`❌ ÉCHEC: Le schéma ${schemaName} existe toujours!`);
        steps.push(`💡 La suppression n'a pas fonctionné`);
        
        return NextResponse.json({
          success: false,
          error: `Le schéma ${schemaName} n'a pas été supprimé`,
          schemaName,
          steps,
          remainingSchemas: verifyList
        });
      }
      
      steps.push(`✅ CONFIRMÉ: Le schéma ${schemaName} a été supprimé!`);
      steps.push(`📋 Schémas restants: ${verifyList.join(', ')}`);
    }
    
    return NextResponse.json({
      success: true,
      deleted: true,
      schemaName,
      steps
    });
    
  } catch (error) {
    console.error('❌ Erreur suppression schéma:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
