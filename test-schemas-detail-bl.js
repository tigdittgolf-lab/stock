// Test pour trouver dans quel schéma se trouve detail_bl
async function testSchemasDetailBL() {
  console.log('🧪 Testing schemas for detail_bl table...');
  
  const SUPABASE_URL = 'https://szgodrjglbpzkrksnroi.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';
  
  try {
    // Test 1: Lister tous les schémas
    console.log('\n1️⃣ Listing all schemas...');
    const schemasResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        sql: "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast') ORDER BY schema_name;"
      })
    });
    
    if (schemasResponse.ok) {
      const schemasData = await schemasResponse.json();
      console.log('✅ Available schemas:', schemasData);
    }
    
    // Test 2: Chercher detail_bl dans tous les schémas
    console.log('\n2️⃣ Finding detail_bl in all schemas...');
    const tablesResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        sql: "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'detail_bl' ORDER BY table_schema;"
      })
    });
    
    if (tablesResponse.ok) {
      const tablesData = await tablesResponse.json();
      console.log('✅ detail_bl found in schemas:', tablesData);
      
      // Test 3: Pour chaque schéma trouvé, compter les enregistrements
      if (tablesData && tablesData.length > 0) {
        for (const table of tablesData) {
          const schema = table.table_schema;
          console.log(`\n3️⃣ Checking data in ${schema}.detail_bl...`);
          
          const dataResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              sql: `SELECT COUNT(*) as total FROM "${schema}".detail_bl;`
            })
          });
          
          if (dataResponse.ok) {
            const dataCount = await dataResponse.json();
            console.log(`✅ ${schema}.detail_bl count:`, dataCount);
            
            // Si il y a des données, récupérer quelques exemples
            if (dataCount && dataCount[0] && dataCount[0].total > 0) {
              const sampleResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                  'apikey': SUPABASE_KEY,
                  'Authorization': `Bearer ${SUPABASE_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                  sql: `SELECT d.*, a.designation FROM "${schema}".detail_bl d LEFT JOIN "${schema}".article a ON d.narticle = a.narticle LIMIT 5;`
                })
              });
              
              if (sampleResponse.ok) {
                const sampleData = await sampleResponse.json();
                console.log(`✅ Sample data from ${schema}.detail_bl:`, sampleData);
              }
              
              // Vérifier spécifiquement BL 5
              const bl5Response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                  'apikey': SUPABASE_KEY,
                  'Authorization': `Bearer ${SUPABASE_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                  sql: `SELECT d.*, a.designation FROM "${schema}".detail_bl d LEFT JOIN "${schema}".article a ON d.narticle = a.narticle WHERE d.nfact = 5;`
                })
              });
              
              if (bl5Response.ok) {
                const bl5Data = await bl5Response.json();
                console.log(`🔍 BL 5 details in ${schema}:`, bl5Data);
                
                if (bl5Data && bl5Data.length > 0) {
                  console.log('🎉 FOUND REAL DATA FOR BL 5!');
                  console.log('📦 Real articles for BL 5:', bl5Data.map(item => ({
                    narticle: item.narticle,
                    designation: item.designation,
                    qte: item.qte,
                    prix: item.prix,
                    total_ligne: item.total_ligne
                  })));
                }
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSchemasDetailBL();