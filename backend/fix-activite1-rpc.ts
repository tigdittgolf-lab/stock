import { supabaseAdmin } from './src/supabaseClient.js';

async function fixActivite1RPC() {
  console.log('🔧 Correction des fonctions RPC pour activite1...');
  
  try {
    // 1. D'abord, découvrir la vraie structure de activite1
    console.log('\n🔍 Découverte de la structure réelle de activite1...');
    
    const discoverStructureSQL = `
      CREATE OR REPLACE FUNCTION discover_activite1_structure()
      RETURNS TEXT
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        col_info RECORD;
        result_text TEXT := '';
      BEGIN
        FOR col_info IN 
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'activite1'
          ORDER BY ordinal_position
        LOOP
          result_text := result_text || col_info.column_name || ':' || col_info.data_type || ';';
        END LOOP;
        
        RETURN result_text;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERREUR: ' || SQLERRM;
      END;
      $$;
    `;
    
    await supabaseAdmin.rpc('exec_sql', { sql: discoverStructureSQL });
    
    const { data: structureInfo } = await supabaseAdmin.rpc('discover_activite1_structure');
    console.log('   Structure découverte:', structureInfo);
    
    // 2. Créer une fonction RPC simplifiée pour lire activite1
    console.log('\n📋 Création de la fonction get_activite1_simple...');
    
    const createSimpleFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_activite1_simple()
      RETURNS TEXT
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        result_text TEXT := '';
        rec RECORD;
      BEGIN
        -- Essayer de sélectionner toutes les colonnes disponibles
        FOR rec IN 
          SELECT * FROM public.activite1 LIMIT 1
        LOOP
          result_text := 'DATA_FOUND:';
          -- Construire une chaîne avec toutes les valeurs
          result_text := result_text || 'raison_sociale=' || COALESCE(rec.raison_sociale, 'NULL') || ';';
          result_text := result_text || 'adresse=' || COALESCE(rec.adresse, 'NULL') || ';';
          result_text := result_text || 'tel_fixe=' || COALESCE(rec.tel_fixe, 'NULL') || ';';
          result_text := result_text || 'e_mail=' || COALESCE(rec.e_mail, 'NULL') || ';';
        END LOOP;
        
        IF result_text = '' THEN
          result_text := 'NO_DATA_FOUND';
        END IF;
        
        RETURN result_text;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERREUR: ' || SQLERRM;
      END;
      $$;
    `;
    
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createSimpleFunctionSQL
    });
    
    if (createError) {
      console.error('❌ Erreur lors de la création:', createError);
      return;
    }
    
    console.log('✅ Fonction get_activite1_simple créée');
    
    // 3. Tester la nouvelle fonction
    console.log('\n🧪 Test de la nouvelle fonction...');
    
    const { data: testResult, error: testError } = await supabaseAdmin.rpc('get_activite1_simple');
    
    if (testError) {
      console.error('❌ Erreur lors du test:', testError);
    } else {
      console.log('✅ Résultat du test:', testResult);
      
      if (testResult && testResult.includes('DATA_FOUND')) {
        // Parser les données
        const dataParts = testResult.split(';');
        console.log('\n📊 Données trouvées dans activite1:');
        dataParts.forEach(part => {
          if (part.includes('=')) {
            const [key, value] = part.split('=');
            if (value !== 'NULL' && value !== '') {
              console.log(`   ${key}: ${value}`);
            }
          }
        });
      }
    }
    
    // 4. Créer une fonction de copie corrigée
    console.log('\n📋 Création de la fonction copy_activite1_fixed...');
    
    const createCopyFixedSQL = `
      CREATE OR REPLACE FUNCTION copy_activite1_fixed(p_tenant TEXT)
      RETURNS TEXT
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        source_record RECORD;
        result_text TEXT := '';
      BEGIN
        -- Supprimer les données existantes dans le tenant (avec WHERE pour éviter l'erreur)
        EXECUTE format('DELETE FROM %I.activite WHERE id > 0 OR id IS NULL', p_tenant);
        result_text := result_text || 'Données existantes supprimées. ';
        
        -- Copier les données de activite1 vers le tenant
        FOR source_record IN 
          SELECT * FROM public.activite1 LIMIT 1
        LOOP
          EXECUTE format('
            INSERT INTO %I.activite (
              raison_sociale, adresse, commune, wilaya, 
              tel_fixe, tel_port, e_mail, nrc, nis, nif, rc,
              domaine_activite, sous_domaine, ident_fiscal, banq
            ) VALUES (
              %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L
            )',
            p_tenant,
            COALESCE(source_record.raison_sociale, ''),
            COALESCE(source_record.adresse, ''),
            COALESCE(source_record.commune, ''),
            COALESCE(source_record.wilaya, ''),
            COALESCE(source_record.tel_fixe, ''),
            COALESCE(source_record.tel_port, ''),
            COALESCE(source_record.e_mail, ''),
            COALESCE(source_record.nrc, ''),
            COALESCE(source_record.nis, ''),
            COALESCE(source_record.nif, ''),
            COALESCE(source_record.rc, ''),
            COALESCE(source_record.domaine_activite, ''),
            COALESCE(source_record.sous_domaine, ''),
            COALESCE(source_record.ident_fiscal, ''),
            COALESCE(source_record.banq, '')
          );
          
          result_text := result_text || 'Données copiées pour: ' || COALESCE(source_record.raison_sociale, 'N/A');
        END LOOP;
        
        RETURN result_text;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERREUR: ' || SQLERRM;
      END;
      $$;
    `;
    
    const { error: createCopyFixedError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createCopyFixedSQL
    });
    
    if (createCopyFixedError) {
      console.error('❌ Erreur lors de la création de copy_activite1_fixed:', createCopyFixedError);
      return;
    }
    
    console.log('✅ Fonction copy_activite1_fixed créée');
    
    console.log('\n🎉 Fonctions RPC corrigées !');
    console.log('Vous pouvez maintenant tester avec: bun run test-copy-fixed.ts');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

fixActivite1RPC();