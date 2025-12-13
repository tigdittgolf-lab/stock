import { supabaseAdmin } from './src/supabaseClient.js';

async function createTestDataSimple() {
  console.log('📝 Creating test data using RPC functions...');
  
  try {
    // Test BU01 - Create delivery note using existing RPC function
    console.log('\n🏢 Testing BU01 (ÉLECTRO PLUS SARL)...');
    
    const { data: bu01Result, error: bu01Error } = await supabaseAdmin.rpc('create_delivery_note', {
      p_tenant: '2025_bu01',
      p_client_id: '001',
      p_items: [
        {
          narticle: '121',
          qte: 2,
          prix: 285.60,
          tva: 19
        }
      ]
    });
    
    if (bu01Error) {
      console.log('❌ BU01 error:', bu01Error.message);
    } else {
      console.log('✅ BU01 delivery note created:', bu01Result);
    }
    
    // Test BU02 - Create delivery note using existing RPC function
    console.log('\n🏢 Testing BU02 (DISTRIB FOOD SPA)...');
    
    const { data: bu02Result, error: bu02Error } = await supabaseAdmin.rpc('create_delivery_note', {
      p_tenant: '2025_bu02',
      p_client_id: '001',
      p_items: [
        {
          narticle: '112',
          qte: 1,
          prix: 77.35,
          tva: 19
        }
      ]
    });
    
    if (bu02Error) {
      console.log('❌ BU02 error:', bu02Error.message);
    } else {
      console.log('✅ BU02 delivery note created:', bu02Result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestDataSimple().catch(console.error);