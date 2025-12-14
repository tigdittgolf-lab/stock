import { supabaseAdmin } from './src/supabaseClient.js';

async function compareTablesDirect() {
  console.log('🔍 COMPARAISON DIRECTE DES TABLES');
  console.log('=================================\n');
  
  try {
    // 1. Créer une fonction pour comparer les structures
    console.log('📋 Création de la fonction de comparaison...');
    
    const createCompareSQL = `
      CREATE OR REPLACE FUNCTION compare_activite_tables()
      RETURNS TEXT
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        source_cols TEXT := '';
        dest_cols TEXT := '';
        sample_data TEXT := '';
        rec RECORD;
      BEGIN
        -- Récupérer les colonnes de activite1 (source)
        FOR rec IN 
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'activite1'
          ORDER BY ordinal_position
        LOOP
          source_cols := source_cols || rec.column_name || ':' || rec.data_type || ':' || rec.is_nullable || ';';
        END LOOP;
        
        -- Récupérer les colonnes de activite (destination)
        FOR rec IN 
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = '2025_bu01' AND table_name = 'activite'
          ORDER BY ordinal_position
        LOOP
          dest_cols := dest_cols || rec.column_name || ':' || rec.data_type || ':' || rec.is_nullable || ';';
        END LOOP;
        
        -- Récupérer un échantillon de données de activite1
        FOR rec IN 
          SELECT * FROM public.activite1 LIMIT 1
        LOOP
          sample_data := 'HAS_DATA';
        END LOOP;
        
        IF sample_data = '' THEN
          sample_data := 'NO_DATA';
        END IF;
        
        RETURN 'SOURCE:' || source_cols || '|DEST:' || dest_cols || '|SAMPLE:' || sample_data;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR:' || SQLERRM;
      END;
      $$;
    `;
    
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createCompareSQL
    });
    
    if (createError) {
      console.error('❌ Erreur création fonction:', createError);
      return;
    }
    
    // Accorder les permissions
    await supabaseAdmin.rpc('exec_sql', {
      sql: 'GRANT EXECUTE ON FUNCTION compare_activite_tables() TO authenticated, anon;'
    });
    
    console.log('✅ Fonction créée, analyse en cours...');
    
    // 2. Exécuter la comparaison
    const { data: compareResult, error: compareError } = await supabaseAdmin.rpc('compare_activite_tables');
    
    if (compareError) {
      console.error('❌ Erreur comparaison:', compareError);
      return;
    }
    
    if (!compareResult) {
      console.log('❌ Aucun résultat de comparaison');
      return;
    }
    
    console.log('\n📊 RÉSULTATS DE LA COMPARAISON');
    console.log('==============================');
    
    // Parser les résultats
    const parts = compareResult.split('|');
    const sourcePart = parts.find(p => p.startsWith('SOURCE:'))?.replace('SOURCE:', '') || '';
    const destPart = parts.find(p => p.startsWith('DEST:'))?.replace('DEST:', '') || '';
    const samplePart = parts.find(p => p.startsWith('SAMPLE:'))?.replace('SAMPLE:', '') || '';
    
    // Analyser les colonnes source
    const sourceColumns = sourcePart.split(';').filter(col => col.length > 0).map(col => {
      const [name, type, nullable] = col.split(':');
      return { name, type, nullable };
    });
    
    // Analyser les colonnes destination
    const destColumns = destPart.split(';').filter(col => col.length > 0).map(col => {
      const [name, type, nullable] = col.split(':');
      return { name, type, nullable };
    });
    
    console.log('\n📋 TABLE SOURCE: public.activite1');
    console.log('----------------------------------');
    sourceColumns.forEach((col, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${col.name.padEnd(20)} | ${col.type.padEnd(15)} | ${col.nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n📋 TABLE DESTINATION: "2025_bu01".activite');
    console.log('------------------------------------------');
    destColumns.forEach((col, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${col.name.padEnd(20)} | ${col.type.padEnd(15)} | ${col.nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Analyser les différences
    console.log('\n🔄 ANALYSE DES DIFFÉRENCES');
    console.log('==========================');
    
    const sourceNames = sourceColumns.map(col => col.name);
    const destNames = destColumns.map(col => col.name);
    
    // Colonnes communes
    const commonColumns = sourceNames.filter(name => destNames.includes(name));
    console.log('\n✅ COLONNES COMMUNES (copie directe):');
    commonColumns.forEach(name => {
      console.log(`   - ${name}`);
    });
    
    // Colonnes seulement dans la source
    const sourceOnlyColumns = sourceNames.filter(name => !destNames.includes(name));
    console.log('\n⚠️ COLONNES SEULEMENT dans activite1 (seront ignorées):');
    if (sourceOnlyColumns.length > 0) {
      sourceOnlyColumns.forEach(name => {
        const col = sourceColumns.find(c => c.name === name);
        console.log(`   - ${name} (${col?.type})`);
      });
    } else {
      console.log('   Aucune');
    }
    
    // Colonnes seulement dans la destination
    const destOnlyColumns = destNames.filter(name => !sourceNames.includes(name));
    console.log('\n❓ COLONNES SEULEMENT dans "2025_bu01".activite:');
    if (destOnlyColumns.length > 0) {
      destOnlyColumns.forEach(name => {
        const col = destColumns.find(c => c.name === name);
        console.log(`   - ${name} (${col?.type}) - ${col?.nullable === 'YES' ? 'peut être NULL' : 'doit avoir une valeur'}`);
      });
    } else {
      console.log('   Aucune');
    }
    
    console.log(`\n📊 Statut des données source: ${samplePart}`);
    
    // Questions pour l'utilisateur
    console.log('\n❓ QUESTIONS POUR VOUS');
    console.log('=====================');
    
    if (destOnlyColumns.length > 0) {
      console.log('\nPour les colonnes qui existent SEULEMENT dans la destination "2025_bu01".activite,');
      console.log('comment voulez-vous les remplir ?');
      console.log('');
      
      destOnlyColumns.forEach(name => {
        const col = destColumns.find(c => c.name === name);
        console.log(`📝 Colonne: ${name} (${col?.type})`);
        
        if (col?.nullable === 'YES') {
          console.log(`   Option 1: Laisser NULL (autorisé)`);
        } else {
          console.log(`   ⚠️ Cette colonne ne peut pas être NULL !`);
        }
        
        console.log(`   Option 2: Utiliser une valeur par défaut`);
        console.log(`   Option 3: Mapper depuis une colonne de activite1`);
        console.log('');
      });
      
      console.log('Veuillez me dire pour chaque colonne manquante ce que vous voulez faire.');
    } else {
      console.log('✅ Toutes les colonnes de la destination existent dans la source !');
      console.log('   La copie peut se faire directement.');
    }
    
    console.log('\n🎯 PROCHAINES ÉTAPES');
    console.log('===================');
    console.log('1. Répondez aux questions ci-dessus');
    console.log('2. Je créerai la fonction de copie personnalisée');
    console.log('3. Nous effacerons le contenu de "2025_bu01".activite');
    console.log('4. Nous copierons les données de public.activite1');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

compareTablesDirect();