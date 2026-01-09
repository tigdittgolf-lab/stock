// Test pour vérifier les vraies données de detail_bl
async function testRealDetailBL() {
  console.log('🧪 Testing real detail_bl table data...');
  
  const SUPABASE_URL = 'https://szgodrjglbpzkrksnroi.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';
  
  try {
    // Test 1: Vérifier la structure de la table detail_bl via exec_sql
    console.log('\n1️⃣ Checking detail_bl table structure...');
    const structureResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        sql: "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name = 'detail_bl' ORDER BY ordinal_position;"
      })
    });
    
    if (structureResponse.ok) {
      const structureData = await structureResponse.json();
      console.log('✅ detail_bl table structure:', structureData);
    } else {
      console.log(`❌ Structure check failed: ${structureResponse.status}`);
    }
    
    // Test 2: Compter les enregistrements dans detail_bl
    console.log('\n2️⃣ Counting records in detail_bl...');
    const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        sql: "SELECT COUNT(*) as total FROM detail_bl;"
      })
    });
    
    if (countResponse.ok) {
      const countData = await countResponse.json();
      console.log('✅ detail_bl record count:', countData);
    } else {
      console.log(`❌ Count check failed: ${countResponse.status}`);
    }
    
    // Test 3: Récupérer quelques enregistrements de detail_bl
    console.log('\n3️⃣ Getting sample records from detail_bl...');
    const sampleResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        sql: "SELECT * FROM detail_bl LIMIT 10;"
      })
    });
    
    if (sampleResponse.ok) {
      const sampleData = await sampleResponse.json();
      console.log('✅ detail_bl sample records:', sampleData);
    } else {
      console.log(`❌ Sample check failed: ${sampleResponse.status}`);
    }
    
    // Test 4: Vérifier les détails pour BL 5 spécifiquement
    console.log('\n4️⃣ Getting details for BL 5...');
    const bl5Response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        sql: "SELECT d.*, a.designation FROM detail_bl d LEFT JOIN article a ON d.narticle = a.narticle WHERE d.nfact = 5;"
      })
    });
    
    if (bl5Response.ok) {
      const bl5Data = await bl5Response.json();
      console.log('✅ Real details for BL 5:', bl5Data);
      
      if (bl5Data && bl5Data.length > 0) {
        console.log('🎉 FOUND REAL DATA! BL 5 has actual article details in the database');
        console.log('📦 Real articles:', bl5Data.map(item => ({
          narticle: item.narticle,
          designation: item.designation,
          qte: item.qte,
          prix: item.prix,
          total_ligne: item.total_ligne
        })));
      } else {
        console.log('⚠️ No details found for BL 5 in detail_bl table');
      }
    } else {
      console.log(`❌ BL 5 details check failed: ${bl5Response.status}`);
    }
    
    // Test 5: Vérifier la clé étrangère - quel champ lie detail_bl à bl?
    console.log('\n5️⃣ Checking foreign key relationship...');
    const fkResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        sql: "SELECT DISTINCT d.nfact, b.nbl FROM detail_bl d LEFT JOIN bl b ON d.nfact = b.nbl LIMIT 10;"
      })
    });
    
    if (fkResponse.ok) {
      const fkData = await fkResponse.json();
      console.log('✅ Foreign key relationship check:', fkData);
    } else {
      console.log(`❌ FK check failed: ${fkResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRealDetailBL();