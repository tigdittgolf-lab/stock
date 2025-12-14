// Test des fonctions clients après correction
// Exécuter avec: bun run test-client-functions-after-fix.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testClientFunctionsAfterFix() {
  console.log('🧪 Testing client functions after fix...\n');

  const testTenant = '2025_bu01';

  try {
    // Test 1: Récupérer tous les clients
    console.log('1️⃣ Testing get_clients_by_tenant...');
    const { data: allClients, error: allError } = await supabase.rpc('get_clients_by_tenant', {
      p_tenant: testTenant
    });

    if (allError) {
      console.error('❌ Error getting all clients:', allError);
    } else {
      console.log(`✅ Found ${allClients?.length || 0} clients`);
      if (allClients && allClients.length > 0) {
        console.log('📋 First client:', allClients[0]);
      }
    }

    // Test 2: Créer un client de test
    console.log('\n2️⃣ Testing insert_client_to_tenant...');
    const testClient = {
      p_tenant: testTenant,
      p_nclient: 'CLI_TEST',
      p_raison_sociale: 'SARL TEST CLIENT',
      p_adresse: '123 Rue de Test, Alger',
      p_contact_person: 'Ahmed Testeur',
      p_tel: '+213 21 XX XX XX',
      p_email: 'test@client.dz',
      p_nrc: '16/00-1234567',
      p_i_fiscal: '1234567890',
      p_c_affaire_fact: 0,
      p_c_affaire_bl: 0
    };

    const { data: insertResult, error: insertError } = await supabase.rpc('insert_client_to_tenant', testClient);

    if (insertError) {
      console.error('❌ Error creating client:', insertError);
    } else {
      console.log('✅ Client creation result:', insertResult);
    }

    // Test 3: Vérifier que le client a été créé
    console.log('\n3️⃣ Verifying client was created...');
    const { data: verifyClients, error: verifyError } = await supabase.rpc('get_clients_by_tenant', {
      p_tenant: testTenant
    });

    if (verifyError) {
      console.error('❌ Error verifying clients:', verifyError);
    } else {
      const testClientFound = verifyClients?.find((c: any) => c.nclient === 'CLI_TEST');
      if (testClientFound) {
        console.log('✅ Test client found:', testClientFound);
      } else {
        console.log('⚠️ Test client not found in results');
      }
      console.log(`📊 Total clients now: ${verifyClients?.length || 0}`);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Exécuter les tests
testClientFunctionsAfterFix();