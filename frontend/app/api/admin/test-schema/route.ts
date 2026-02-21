import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { schemaName } = await request.json();
    
    console.log(`🧪 TEST: Création du schéma ${schemaName}`);
    
    // Configuration Supabase
    const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';
    
    const client = createClient(supabaseUrl, supabaseKey);
    
    const steps: string[] = [];
    
    // ÉTAPE 1: Vérifier la connexion
    steps.push('1️⃣ Test connexion Supabase...');
    const { error: connError } = await client.from('business_units').select('count').limit(1);
    if (connError && !connError.message.includes('relation') && !connError.message.includes('does not exist')) {
      throw new Error(`Connexion échouée: ${connError.message}`);
    }
    steps.push('✅ Connexion OK');
    
    // ÉTAPE 2: Vérifier si le schéma existe déjà
    steps.push('2️⃣ Vérification existence schéma...');
    const { data: existingSchema, error: checkError } = await client.rpc('discover_tenant_schemas', {});
    
    if (checkError) {
      steps.push(`⚠️ Erreur vérification: ${checkError.message}`);
    } else {
      const schemas = Array.isArray(existingSchema) ? existingSchema : JSON.parse(existingSchema || '[]');
      if (schemas.includes(schemaName)) {
        steps.push(`⚠️ Schéma ${schemaName} existe déjà`);
        return NextResponse.json({
          success: true,
          alreadyExists: true,
          schemaName,
          steps
        });
      }
      steps.push(`✅ Schéma ${schemaName} n'existe pas encore`);
    }
    
    // ÉTAPE 3: Créer le schéma via RPC
    steps.push('3️⃣ Création schéma via RPC create_schema_if_not_exists...');
    const { data: createData, error: createError } = await client.rpc('create_schema_if_not_exists', {
      p_schema_name: schemaName
    });
    
    if (createError) {
      steps.push(`❌ Erreur RPC: ${createError.message}`);
      throw new Error(`Erreur création schéma: ${createError.message}`);
    }
    
    steps.push(`✅ RPC retourné: ${JSON.stringify(createData)}`);
    
    // ÉTAPE 4: VÉRIFICATION CRITIQUE - Le schéma existe-t-il vraiment?
    steps.push('4️⃣ VÉRIFICATION CRITIQUE: Le schéma existe-t-il vraiment?');
    
    // Attendre un peu pour que Supabase synchronise
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: verifyData, error: verifyError } = await client.rpc('discover_tenant_schemas', {});
    
    if (verifyError) {
      steps.push(`❌ Erreur vérification: ${verifyError.message}`);
      throw new Error(`Erreur vérification: ${verifyError.message}`);
    }
    
    const schemas = Array.isArray(verifyData) ? verifyData : JSON.parse(verifyData || '[]');
    
    if (!schemas.includes(schemaName)) {
      steps.push(`❌ ÉCHEC CRITIQUE: Le schéma ${schemaName} N'EXISTE PAS après création!`);
      steps.push(`💡 CAUSE: La fonction RPC create_schema_if_not_exists ne fonctionne pas`);
      steps.push(`💡 SOLUTION: Problème de permissions Supabase`);
      steps.push(`📋 Schémas existants: ${schemas.join(', ')}`);
      
      return NextResponse.json({
        success: false,
        error: `Le schéma ${schemaName} n'a pas été créé malgré le succès de la RPC`,
        schemaName,
        steps,
        rpcResult: createData,
        existingSchemas: schemas
      });
    }
    
    steps.push(`✅ CONFIRMÉ: Le schéma ${schemaName} EXISTE dans Supabase!`);
    
    // ÉTAPE 5: Lister tous les schémas pour confirmation
    steps.push('5️⃣ Liste de tous les schémas tenant...');
    steps.push(`📋 Schémas trouvés: ${schemas.join(', ')}`);
    
    return NextResponse.json({
      success: true,
      created: true,
      schemaName,
      steps,
      allSchemas: schemas
    });
    
  } catch (error) {
    console.error('❌ Erreur test création schéma:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
