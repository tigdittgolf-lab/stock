import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface Column {
  name: string;
  type: string;
  notNull: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { schemaName, tableName, columns } = await request.json();
    
    console.log(`🧪 TEST: Création de la table ${schemaName}.${tableName}`);
    
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
      throw new Error(`Le schéma ${schemaName} n'existe pas`);
    }
    steps.push(`✅ Schéma ${schemaName} existe`);
    
    // ÉTAPE 2: Générer le SQL CREATE TABLE
    steps.push('2️⃣ Génération du SQL CREATE TABLE...');
    const columnDefs = (columns as Column[]).map(col => {
      const notNull = col.notNull ? ' NOT NULL' : '';
      return `"${col.name}" ${col.type}${notNull}`;
    }).join(',\n  ');
    
    const createTableSQL = `CREATE TABLE IF NOT EXISTS "${schemaName}"."${tableName}" (\n  ${columnDefs}\n)`;
    steps.push(`📝 SQL généré:\n${createTableSQL}`);
    
    // ÉTAPE 3: Exécuter le CREATE TABLE via exec_sql
    steps.push('3️⃣ Exécution CREATE TABLE via exec_sql...');
    const { data: execData, error: execError } = await client.rpc('exec_sql', {
      sql_query: createTableSQL,
      params: []
    });
    
    if (execError) {
      steps.push(`❌ Erreur exec_sql: ${execError.message}`);
      throw new Error(`Erreur exec_sql: ${execError.message}`);
    }
    
    steps.push(`✅ exec_sql retourné: ${JSON.stringify(execData)}`);
    
    // ÉTAPE 4: VÉRIFICATION CRITIQUE - La table existe-t-elle vraiment?
    steps.push('4️⃣ VÉRIFICATION CRITIQUE: La table existe-t-elle vraiment?');
    
    // Attendre un peu pour que Supabase synchronise
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: tables, error: tablesError } = await client.rpc('discover_schema_tables', {
      p_schema_name: schemaName
    });
    
    if (tablesError) {
      steps.push(`❌ Erreur vérification: ${tablesError.message}`);
      throw new Error(`Erreur vérification: ${tablesError.message}`);
    }
    
    const tableList = Array.isArray(tables) ? tables : JSON.parse(tables || '[]');
    const tableExists = tableList.some((t: any) => t.table_name === tableName);
    
    if (!tableExists) {
      steps.push(`❌ ÉCHEC CRITIQUE: La table ${schemaName}.${tableName} N'EXISTE PAS après création!`);
      steps.push(`💡 CAUSE: La fonction exec_sql ne peut pas créer de tables`);
      steps.push(`💡 RAISON: Restrictions de permissions SECURITY DEFINER dans Supabase`);
      steps.push(`📋 Tables existantes: ${tableList.map((t: any) => t.table_name).join(', ')}`);
      
      return NextResponse.json({
        success: false,
        error: `La table ${schemaName}.${tableName} n'a pas été créée malgré le succès de exec_sql`,
        schemaName,
        tableName,
        steps,
        execResult: execData,
        existingTables: tableList.map((t: any) => t.table_name)
      });
    }
    
    steps.push(`✅ CONFIRMÉ: La table ${schemaName}.${tableName} EXISTE dans Supabase!`);
    
    // ÉTAPE 5: Lister toutes les tables pour confirmation
    steps.push('5️⃣ Liste de toutes les tables du schéma...');
    steps.push(`📋 Tables trouvées: ${tableList.map((t: any) => t.table_name).join(', ')}`);
    
    return NextResponse.json({
      success: true,
      created: true,
      schemaName,
      tableName,
      steps,
      allTables: tableList.map((t: any) => t.table_name)
    });
    
  } catch (error) {
    console.error('❌ Erreur test création table:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
