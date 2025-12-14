import { supabaseAdmin } from './src/supabaseClient.js';

async function analyzeTableStructures() {
  console.log('🔍 ANALYSE DES STRUCTURES DE TABLES');
  console.log('=====================================\n');
  
  try {
    // 1. Analyser la structure de activite1 (public) - SOURCE
    console.log('📋 Structure de la table SOURCE: public.activite1');
    console.log('------------------------------------------------');
    
    const getActivite1StructureSQL = `
      CREATE OR REPLACE FUNCTION get_activite1_structure()
      RETURNS TABLE (
        column_name TEXT,
        data_type TEXT,
        is_nullable TEXT,
        column_default TEXT
      )
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          c.column_name::TEXT,
          c.data_type::TEXT,
          c.is_nullable::TEXT,
          c.column_default::TEXT
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' 
        AND c.table_name = 'activite1'
        ORDER BY c.ordinal_position;
      END;
      $$;
    `;
    
    await supabaseAdmin.rpc('exec_sql', { sql: getActivite1StructureSQL });
    
    const { data: activite1Structure, error: error1 } = await supabaseAdmin.rpc('get_activite1_structure');
    
    if (error1) {
      console.error('❌ Erreur structure activite1:', error1);
      return;
    }
    
    console.log('Colonnes dans public.activite1:');
    activite1Structure?.forEach((col, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 2. Analyser la structure de activite (2025_bu01) - DESTINATION
    console.log('\n📋 Structure de la table DESTINATION: "2025_bu01".activite');
    console.log('----------------------------------------------------');
    
    const getActiviteStructureSQL = `
      CREATE OR REPLACE FUNCTION get_activite_structure()
      RETURNS TABLE (
        column_name TEXT,
        data_type TEXT,
        is_nullable TEXT,
        column_default TEXT
      )
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          c.column_name::TEXT,
          c.data_type::TEXT,
          c.is_nullable::TEXT,
          c.column_default::TEXT
        FROM information_schema.columns c
        WHERE c.table_schema = '2025_bu01' 
        AND c.table_name = 'activite'
        ORDER BY c.ordinal_position;
      END;
      $$;
    `;
    
    await supabaseAdmin.rpc('exec_sql', { sql: getActiviteStructureSQL });
    
    const { data: activiteStructure, error: error2 } = await supabaseAdmin.rpc('get_activite_structure');
    
    if (error2) {
      console.error('❌ Erreur structure activite:', error2);
      return;
    }
    
    console.log('Colonnes dans "2025_bu01".activite:');
    activiteStructure?.forEach((col, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 3. Comparer les structures
    console.log('\n🔄 COMPARAISON DES STRUCTURES');
    console.log('=============================');
    
    const sourceColumns = activite1Structure?.map(col => col.column_name) || [];
    const destColumns = activiteStructure?.map(col => col.column_name) || [];
    
    // Colonnes communes
    const commonColumns = sourceColumns.filter(col => destColumns.includes(col));
    console.log('\n✅ Colonnes COMMUNES (copie directe possible):');
    commonColumns.forEach(col => {
      console.log(`   - ${col}`);
    });
    
    // Colonnes seulement dans la source
    const sourceOnlyColumns = sourceColumns.filter(col => !destColumns.includes(col));
    console.log('\n⚠️ Colonnes SEULEMENT dans activite1 (seront ignorées):');
    if (sourceOnlyColumns.length > 0) {
      sourceOnlyColumns.forEach(col => {
        console.log(`   - ${col}`);
      });
    } else {
      console.log('   Aucune');
    }
    
    // Colonnes seulement dans la destination
    const destOnlyColumns = destColumns.filter(col => !sourceColumns.includes(col));
    console.log('\n❓ Colonnes SEULEMENT dans "2025_bu01".activite (besoin de valeurs par défaut):');
    if (destOnlyColumns.length > 0) {
      destOnlyColumns.forEach(col => {
        const colInfo = activiteStructure?.find(c => c.column_name === col);
        const hasDefault = colInfo?.column_default !== null;
        console.log(`   - ${col} (${colInfo?.data_type}) ${hasDefault ? '[a une valeur par défaut]' : '[BESOIN DE VALEUR]'}`);
      });
    } else {
      console.log('   Aucune');
    }
    
    // 4. Récupérer un échantillon des données source
    console.log('\n📊 ÉCHANTILLON DES DONNÉES SOURCE');
    console.log('=================================');
    
    const getSampleDataSQL = `
      CREATE OR REPLACE FUNCTION get_activite1_sample()
      RETURNS TEXT
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        sample_record RECORD;
        result_text TEXT := '';
      BEGIN
        FOR sample_record IN 
          SELECT * FROM public.activite1 LIMIT 1
        LOOP
          result_text := 'SAMPLE_DATA:';
          -- Construire une chaîne avec les valeurs non nulles
          FOR i IN 1..array_length(array(SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activite1'), 1)
          LOOP
            -- Cette approche sera remplacée par une version plus simple
          END LOOP;
        END LOOP;
        
        IF result_text = '' THEN
          result_text := 'NO_DATA';
        END IF;
        
        RETURN result_text;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR: ' || SQLERRM;
      END;
      $$;
    `;
    
    // Version simplifiée pour récupérer les données
    const getSimpleSampleSQL = `
      CREATE OR REPLACE FUNCTION get_simple_sample()
      RETURNS TEXT
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        rec RECORD;
        result TEXT := '';
      BEGIN
        SELECT * INTO rec FROM public.activite1 LIMIT 1;
        
        IF FOUND THEN
          result := 'Données trouvées dans activite1';
        ELSE
          result := 'Aucune donnée dans activite1';
        END IF;
        
        RETURN result;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERREUR: ' || SQLERRM;
      END;
      $$;
    `;
    
    await supabaseAdmin.rpc('exec_sql', { sql: getSimpleSampleSQL });
    
    const { data: sampleResult } = await supabaseAdmin.rpc('get_simple_sample');
    console.log('Statut des données:', sampleResult);
    
    console.log('\n📝 QUESTIONS POUR VOUS ORIENTER');
    console.log('===============================');
    
    if (destOnlyColumns.length > 0) {
      console.log('\n❓ Pour les colonnes qui existent seulement dans la destination,');
      console.log('   comment voulez-vous les remplir ?');
      console.log('');
      
      destOnlyColumns.forEach(col => {
        const colInfo = activiteStructure?.find(c => c.column_name === col);
        if (!colInfo?.column_default) {
          console.log(`   • ${col} (${colInfo?.data_type}): `);
          console.log(`     - Laisser NULL ?`);
          console.log(`     - Utiliser une valeur par défaut ?`);
          console.log(`     - Mapper depuis une autre colonne ?`);
          console.log('');
        }
      });
    }
    
    console.log('🎯 PRÊT POUR LA COPIE');
    console.log('=====================');
    console.log('Une fois que vous me donnez vos instructions pour les colonnes manquantes,');
    console.log('je créerai la fonction de copie optimale.');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

analyzeTableStructures();