// Test de diagnostic Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

async function testSupabaseDiagnostic() {
  console.log('🧪 Diagnostic Supabase - Début des tests...\n');

  // Test 1: Ping de base vers l'URL
  console.log('1️⃣ Test de ping vers l\'URL Supabase...');
  try {
    const response = await fetch(SUPABASE_URL);
    console.log(`✅ Ping réussi - Status: ${response.status}`);
  } catch (error) {
    console.log(`❌ Ping échoué: ${error.message}`);
    return;
  }

  // Test 2: Test de l'API REST Supabase
  console.log('\n2️⃣ Test de l\'API REST Supabase...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log(`✅ API REST accessible - Status: ${response.status}`);
  } catch (error) {
    console.log(`❌ API REST échouée: ${error.message}`);
  }

  // Test 3: Création du client Supabase
  console.log('\n3️⃣ Test de création du client Supabase...');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Client Supabase créé avec succès');

    // Test 4: Test d'une requête RPC simple
    console.log('\n4️⃣ Test d\'une requête RPC...');
    const { data, error } = await supabase.rpc('get_articles_by_tenant', { 
      p_tenant: '2025_bu01' 
    });
    
    if (error) {
      if (error.message.includes('function') || error.message.includes('does not exist')) {
        console.log('✅ Connexion OK (fonction RPC non trouvée mais connexion valide)');
        console.log(`ℹ️  Détail: ${error.message}`);
      } else {
        console.log(`⚠️  Erreur RPC: ${error.message}`);
      }
    } else {
      console.log(`✅ RPC réussie - Données: ${data?.length || 0} éléments`);
    }

    // Test 5: Test d'une requête simple sur une table système
    console.log('\n5️⃣ Test d\'une requête sur table système...');
    const { data: schemas, error: schemaError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .limit(1);
    
    if (schemaError) {
      console.log(`⚠️  Erreur table système: ${schemaError.message}`);
    } else {
      console.log('✅ Requête table système réussie');
    }

  } catch (error) {
    console.log(`❌ Erreur client Supabase: ${error.message}`);
  }

  console.log('\n🏁 Diagnostic terminé');
}

// Exécuter le diagnostic
testSupabaseDiagnostic().catch(console.error);