// Test des fonctions RPC Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRPC() {
  console.log('🧪 Test des fonctions RPC Supabase...\n');
  
  const tenant = '2009_bu02';
  
  // Test 1: get_bl_list (BL de vente)
  console.log('1️⃣ Test get_bl_list (BL de vente)...');
  try {
    const { data, error } = await supabase.rpc('get_bl_list', {
      p_tenant: tenant
    });
    
    if (error) {
      console.error('❌ Erreur:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
    } else {
      console.log('✅ Succès! Nombre de BL:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('   Premier BL:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
  
  console.log('\n2️⃣ Test get_purchase_bl_list (BL d\'achat)...');
  try {
    const { data, error } = await supabase.rpc('get_purchase_bl_list', {
      p_tenant: tenant
    });
    
    if (error) {
      console.error('❌ Erreur:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
    } else {
      console.log('✅ Succès! Nombre de BL:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('   Premier BL:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
  
  console.log('\n3️⃣ Test get_articles_by_tenant...');
  try {
    const { data, error } = await supabase.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });
    
    if (error) {
      console.error('❌ Erreur:', error.message);
    } else {
      console.log('✅ Succès! Nombre d\'articles:', data?.length || 0);
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

testRPC().then(() => {
  console.log('\n✅ Tests terminés');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Erreur fatale:', err);
  process.exit(1);
});
