// Créer un adaptateur Supabase qui utilise des requêtes SQL directes
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const supabase = createClient(supabaseUrl, supabaseKey);

class DirectSupabaseAdapter {
  constructor() {
    this.supabase = supabase;
  }

  // Exécuter une requête SQL directe
  async executeSQL(sql) {
    try {
      console.log('🔍 Exécution SQL:', sql.substring(0, 100) + '...');
      
      // Essayer avec différentes méthodes
      const methods = [
        () => this.supabase.rpc('exec_sql', { sql_query: sql }),
        () => this.supabase.rpc('execute_sql', { query: sql }),
        () => this.supabase.rpc('run_sql', { sql: sql }),
        () => this.supabase.rpc('sql', { query: sql })
      ];
      
      for (const method of methods) {
        try {
          const result = await method();
          if (!result.error) {
            console.log('✅ Requête réussie');
            return { success: true, data: result.data };
          }
        } catch (e) {
          // Continuer avec la méthode suivante
        }
      }
      
      // Si aucune méthode ne fonctionne, essayer une approche différente
      throw new Error('Aucune méthode SQL directe disponible');
      
    } catch (error) {
      console.error('❌ Erreur SQL:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Découvrir les schémas réels
  async discoverSchemas() {
    console.log('🔍 Découverte des schémas...');
    
    const queries = [
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name ~ '^\\d{4}_bu\\d{2}$' ORDER BY schema_name`,
      `SELECT nspname as schema_name FROM pg_namespace WHERE nspname ~ '^\\d{4}_bu\\d{2}$' ORDER BY nspname`
    ];
    
    for (const query of queries) {
      const result = await this.executeSQL(query);
      if (result.success && result.data) {
        return result.data.map(row => row.schema_name || row.nspname);
      }
    }
    
    // Fallback: schémas par défaut
    return ['2025_bu01', '2026_bu01', '2024_bu01', '2025_bu02'];
  }

  // Découvrir les tables dans un schéma
  async discoverTables(schema) {
    console.log(`🔍 Découverte des tables dans ${schema}...`);
    
    const query = `
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = '${schema}' 
      ORDER BY table_name
    `;
    
    const result = await this.executeSQL(query);
    if (result.success && result.data) {
      return result.data.map(row => row.table_name);
    }
    
    return [];
  }

  // Récupérer les données d'une table
  async getTableData(schema, table) {
    console.log(`📊 Récupération données ${schema}.${table}...`);
    
    const query = `SELECT * FROM "${schema}".${table} ORDER BY 1 LIMIT 1000`;
    
    const result = await this.executeSQL(query);
    if (result.success) {
      console.log(`✅ ${result.data?.length || 0} enregistrements récupérés`);
      return result.data || [];
    }
    
    console.log(`❌ Erreur récupération ${schema}.${table}: ${result.error}`);
    return [];
  }

  // Analyser la structure d'une table
  async getTableStructure(schema, table) {
    console.log(`🔧 Analyse structure ${schema}.${table}...`);
    
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = '${schema}' AND table_name = '${table}'
      ORDER BY ordinal_position
    `;
    
    const result = await this.executeSQL(query);
    if (result.success && result.data) {
      return result.data;
    }
    
    return [];
  }
}

// Test de l'adaptateur direct
async function testDirectAdapter() {
  console.log('🧪 TEST DE L\'ADAPTATEUR DIRECT SUPABASE');
  console.log('==========================================\n');
  
  const adapter = new DirectSupabaseAdapter();
  
  // 1. Découvrir les schémas
  const schemas = await adapter.discoverSchemas();
  console.log('📋 Schémas trouvés:', schemas);
  
  // 2. Pour chaque schéma, découvrir les tables
  for (const schema of schemas.slice(0, 2)) { // Tester les 2 premiers schémas
    console.log(`\n=== SCHÉMA: ${schema} ===`);
    
    const tables = await adapter.discoverTables(schema);
    console.log(`📊 Tables trouvées (${tables.length}):`, tables);
    
    // 3. Pour chaque table, récupérer un échantillon de données
    for (const table of tables.slice(0, 5)) { // Tester les 5 premières tables
      console.log(`\n--- Table: ${table} ---`);
      
      // Structure
      const structure = await adapter.getTableStructure(schema, table);
      if (structure.length > 0) {
        console.log('🔧 Colonnes:');
        structure.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
      }
      
      // Données
      const data = await adapter.getTableData(schema, table);
      if (data.length > 0) {
        console.log('📋 Premier enregistrement:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('📭 Table vide');
      }
    }
  }
}

testDirectAdapter();