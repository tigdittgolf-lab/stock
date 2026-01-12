// Vérifier quelles tables existent dans Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg';

async function checkTables() {
  console.log('🔍 Vérification des tables dans Supabase...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Lister toutes les tables
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%bl%'
        ORDER BY table_name;
      `
    });
    
    if (error) {
      console.error('❌ Erreur:', error);
    } else {
      console.log('📋 Tables contenant "bl":', data);
    }
    
    // Vérifier spécifiquement les tables BL
    const blTables = ['bl', '2025_bu01_bl', 'bu01_bl', 'fact'];
    
    for (const tableName of blTables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!tableError) {
          console.log(`✅ Table "${tableName}" existe`);
        } else {
          console.log(`❌ Table "${tableName}" n'existe pas:`, tableError.message);
        }
      } catch (err) {
        console.log(`❌ Table "${tableName}" erreur:`, err.message);
      }
    }
    
    // Vérifier les tables de détails
    const detailTables = ['detail_bl', '2025_bu01_detail_bl', 'bu01_detail_bl', 'detail_fact'];
    
    for (const tableName of detailTables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!tableError) {
          console.log(`✅ Table "${tableName}" existe`);
        } else {
          console.log(`❌ Table "${tableName}" n'existe pas:`, tableError.message);
        }
      } catch (err) {
        console.log(`❌ Table "${tableName}" erreur:`, err.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkTables().catch(console.error);