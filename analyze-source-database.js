// Analyser la structure complète de la base source Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
  console.log('🔍 Analyse complète de la base source Supabase...\n');
  
  try {
    // 1. Lister tous les schémas
    console.log('=== SCHEMAS DISPONIBLES ===');
    const { data: schemas, error: schemaError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name ~ '^\\d{4}_bu\\d{2}$'
        ORDER BY schema_name
      `
    });
    
    if (schemaError) {
      console.error('Erreur récupération schémas:', schemaError);
      return;
    }
    
    console.log('Schémas trouvés:', schemas?.map(s => s.schema_name) || []);
    
    // 2. Pour chaque schéma, lister toutes les tables
    const testSchema = '2025_bu01'; // Commencer par un schéma test
    console.log(`\n=== TABLES DANS ${testSchema} ===`);
    
    const { data: tables, error: tableError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema = '${testSchema}'
        ORDER BY table_name
      `
    });
    
    if (tableError) {
      console.error('Erreur récupération tables:', tableError);
      return;
    }
    
    console.log('Tables trouvées:');
    tables?.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`);
    });
    
    // 3. Pour chaque table, analyser la structure et les données
    if (tables) {
      for (const table of tables) {
        const tableName = table.table_name;
        console.log(`\n--- ANALYSE TABLE ${tableName} ---`);
        
        // Structure de la table
        const { data: columns, error: columnError } = await supabase.rpc('exec_sql', {
          sql_query: `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = '${testSchema}' AND table_name = '${tableName}'
            ORDER BY ordinal_position
          `
        });
        
        if (!columnError && columns) {
          console.log('Colonnes:');
          columns.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
          });
        }
        
        // Nombre d'enregistrements
        const { data: count, error: countError } = await supabase.rpc('exec_sql', {
          sql_query: `SELECT COUNT(*) as total FROM "${testSchema}".${tableName}`
        });
        
        if (!countError && count) {
          console.log(`Nombre d'enregistrements: ${count[0]?.total || 0}`);
        }
        
        // Échantillon de données (5 premiers enregistrements)
        if (count && count[0]?.total > 0) {
          const { data: sample, error: sampleError } = await supabase.rpc('exec_sql', {
            sql_query: `SELECT * FROM "${testSchema}".${tableName} LIMIT 5`
          });
          
          if (!sampleError && sample && sample.length > 0) {
            console.log('Échantillon de données:');
            console.log(JSON.stringify(sample, null, 2));
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Erreur analyse:', error);
  }
}

analyzeDatabase();