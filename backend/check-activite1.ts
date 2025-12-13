import { supabaseAdmin } from './src/supabaseClient.js';

async function checkActivite1() {
  console.log('🔍 Vérification de la table activite1...');
  
  try {
    // 1. Vérifier si la table activite1 existe
    console.log('\n📋 Vérification de l\'existence de la table activite1...');
    
    const { data: tableExists, error: tableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activite1';
      `
    });
    
    if (tableError) {
      console.error('❌ Erreur lors de la vérification:', tableError);
      return;
    }
    
    if (!tableExists || tableExists.length === 0) {
      console.log('❌ La table activite1 n\'existe pas dans le schéma public');
      
      // Vérifier s'il y a des tables similaires
      console.log('\n🔍 Recherche de tables similaires...');
      const { data: similarTables } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name LIKE '%activite%';
        `
      });
      
      if (similarTables && similarTables.length > 0) {
        console.log('   Tables trouvées contenant "activite":');
        similarTables.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
      } else {
        console.log('   Aucune table contenant "activite" trouvée');
      }
      
      return;
    }
    
    console.log('✅ La table activite1 existe');
    
    // 2. Vérifier la structure de la table
    console.log('\n📊 Structure de la table activite1:');
    
    const { data: structure } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activite1'
        ORDER BY ordinal_position;
      `
    });
    
    if (structure && structure.length > 0) {
      structure.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    // 3. Vérifier le contenu de la table
    console.log('\n📈 Contenu de la table activite1:');
    
    const { data: count } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'SELECT COUNT(*) as total FROM public.activite1;'
    });
    
    console.log(`   Nombre de lignes: ${count?.[0]?.total || 0}`);
    
    if (count?.[0]?.total > 0) {
      // Afficher les premières lignes
      const { data: sample } = await supabaseAdmin.rpc('exec_sql', {
        sql: 'SELECT * FROM public.activite1 LIMIT 3;'
      });
      
      if (sample && sample.length > 0) {
        console.log('\n   Échantillon des données:');
        sample.forEach((row, index) => {
          console.log(`   Ligne ${index + 1}:`);
          Object.keys(row).forEach(key => {
            if (row[key] !== null && row[key] !== '') {
              console.log(`     ${key}: ${row[key]}`);
            }
          });
          console.log('');
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkActivite1();