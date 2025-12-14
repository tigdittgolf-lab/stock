// Script pour diagnostiquer le contenu de la base de données
import { supabaseAdmin } from './src/supabaseClient.js';

async function debugDatabase() {
  console.log('🔍 DIAGNOSTIC DE LA BASE DE DONNÉES');
  console.log('===================================\n');
  
  try {
    // 1. Vérifier la connexion et l'URL
    console.log('📡 Vérification de la connexion...');
    console.log(`   URL: ${process.env.SUPABASE_URL}`);
    console.log(`   Projet: ${process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0]}`);
    
    // 2. Lister tous les schémas
    console.log('\n📋 Schémas disponibles:');
    try {
      const { data: schemas, error: schemaError } = await supabaseAdmin
        .from('information_schema.schemata')
        .select('schema_name')
        .order('schema_name');
      
      if (schemaError) {
        console.error('❌ Erreur schémas:', schemaError.message);
      } else {
        schemas?.forEach(schema => {
          console.log(`   - ${schema.schema_name}`);
        });
      }
    } catch (e) {
      console.log('⚠️  Impossible de lister les schémas:', e.message);
    }
    
    // 3. Vérifier les tables dans le schéma public
    console.log('\n📊 Tables dans le schéma public:');
    try {
      const { data: tables, error: tableError } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');
      
      if (tableError) {
        console.error('❌ Erreur tables:', tableError.message);
      } else {
        tables?.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
      }
    } catch (e) {
      console.log('⚠️  Impossible de lister les tables:', e.message);
    }
    
    // 4. Vérifier s'il y a des articles
    console.log('\n🔍 Recherche d\'articles...');
    
    // Essayer différentes tables possibles
    const possibleTables = [
      'article',
      'articles', 
      '2025_bu01.article',
      '2025_bu02.article',
      '2024_bu01.article'
    ];
    
    for (const tableName of possibleTables) {
      try {
        console.log(`\n   Vérification: ${tableName}`);
        
        if (tableName.includes('.')) {
          // Table dans un schéma spécifique - utiliser RPC
          const [schema, table] = tableName.split('.');
          const { data, error } = await supabaseAdmin.rpc('exec_sql', {
            sql: `SELECT COUNT(*) as count FROM "${schema}".${table} LIMIT 1`
          });
          
          if (error) {
            console.log(`     ❌ ${error.message}`);
          } else {
            console.log(`     ✅ Trouvé: ${data?.[0]?.count || 0} articles`);
          }
        } else {
          // Table dans le schéma public
          const { data, error, count } = await supabaseAdmin
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.log(`     ❌ ${error.message}`);
          } else {
            console.log(`     ✅ Trouvé: ${count || 0} articles`);
          }
        }
      } catch (e) {
        console.log(`     ⚠️  ${e.message}`);
      }
    }
    
    // 5. Vérifier les utilisateurs
    console.log('\n👥 Utilisateurs dans auth.users:');
    try {
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (userError) {
        console.error('❌ Erreur utilisateurs:', userError.message);
      } else {
        console.log(`   Total: ${users.users.length} utilisateurs`);
        users.users.forEach(user => {
          console.log(`   - ${user.email} (créé: ${new Date(user.created_at).toLocaleDateString()})`);
        });
      }
    } catch (e) {
      console.log('⚠️  Impossible de lister les utilisateurs:', e.message);
    }
    
    // 6. Test de requête directe
    console.log('\n🧪 Test de requête directe...');
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/article?select=*`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log(`   Status: ${response.status}`);
      console.log(`   Réponse:`, data);
      
    } catch (e) {
      console.log('⚠️  Erreur requête directe:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

debugDatabase();