// Test direct des fonctions RPC de modification de BL
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg';

async function testRPCFunctionsDirect() {
  console.log('🧪 Test direct des fonctions RPC...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // 1. Test de la fonction update_bl
  console.log('\n📋 1. Test update_bl:');
  try {
    const result = await supabase.rpc('update_bl', {
      p_tenant: '2025_bu01',
      p_nfact: 5,
      p_nclient: '415',
      p_date_fact: '2025-12-21',
      p_montant_ht: 2000, // Changer de 1000 à 2000
      p_tva: 380,         // Changer de 190 à 380
      p_montant_ttc: 2380 // Changer de 1190 à 2380
    });
    
    if (result.error) {
      console.error('❌ Erreur update_bl:', result.error);
    } else {
      console.log('✅ update_bl réussi:', result.data);
    }
  } catch (error) {
    console.error('❌ Exception update_bl:', error);
  }
  
  // 2. Test de la fonction delete_bl_details
  console.log('\n🗑️ 2. Test delete_bl_details:');
  try {
    const result = await supabase.rpc('delete_bl_details', {
      p_tenant: '2025_bu01',
      p_nfact: 5
    });
    
    if (result.error) {
      console.error('❌ Erreur delete_bl_details:', result.error);
    } else {
      console.log('✅ delete_bl_details réussi:', result.data);
    }
  } catch (error) {
    console.error('❌ Exception delete_bl_details:', error);
  }
  
  // 3. Test de la fonction insert_bl_detail
  console.log('\n➕ 3. Test insert_bl_detail:');
  try {
    const result = await supabase.rpc('insert_bl_detail', {
      p_tenant: '2025_bu01',
      p_nfact: 5,
      p_narticle: '142',
      p_qte: 15, // Nouvelle quantité
      p_prix: 200,
      p_tva: 19,
      p_total_ligne: 3570 // 15 * 200 * 1.19 = 3570
    });
    
    if (result.error) {
      console.error('❌ Erreur insert_bl_detail:', result.error);
    } else {
      console.log('✅ insert_bl_detail réussi:', result.data);
    }
  } catch (error) {
    console.error('❌ Exception insert_bl_detail:', error);
  }
  
  // 4. Vérifier le résultat final
  console.log('\n🔍 4. Vérification finale:');
  try {
    const result = await supabase.rpc('get_bl_by_id', {
      p_tenant: '2025_bu01',
      p_nfact: 5
    });
    
    if (result.error) {
      console.error('❌ Erreur get_bl_by_id:', result.error);
    } else {
      const bl = result.data;
      console.log('📋 BL après modifications RPC:', {
        nbl: bl.nbl,
        montant_ht: bl.montant_ht,
        tva: bl.tva,
        montant_ttc: bl.montant_ttc,
        details_count: bl.details?.length || 0
      });
      
      if (bl.details && bl.details.length > 0) {
        console.log('📦 Premier article:', bl.details[0]);
      }
    }
  } catch (error) {
    console.error('❌ Exception get_bl_by_id:', error);
  }
}

testRPCFunctionsDirect().catch(console.error);