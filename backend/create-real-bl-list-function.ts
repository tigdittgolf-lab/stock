// Créer une fonction RPC pour récupérer les vraies données BL
import { supabaseAdmin } from './src/supabaseClient.js';

async function createRealBLListFunction() {
  console.log('🔧 Creating function to get REAL BL data...');
  
  const functionSQL = `
-- Fonction pour récupérer les vraies données BL
CREATE OR REPLACE FUNCTION get_real_bl_list(p_tenant TEXT)
RETURNS TABLE(
  nfact INTEGER,
  nclient VARCHAR(50),
  date_fact DATE,
  montant_ht DECIMAL(15,2),
  tva DECIMAL(15,2),
  created_at TIMESTAMP
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  EXECUTE format('
    SELECT 
      bl.nfact,
      bl.nclient,
      bl.date_fact,
      bl.montant_ht,
      bl.tva,
      bl.created_at
    FROM %I.bl bl
    ORDER BY bl.nfact DESC
  ', p_tenant);
END;
$$;

GRANT EXECUTE ON FUNCTION get_real_bl_list TO anon, authenticated;
`;

  try {
    console.log('📝 Function SQL:');
    console.log(functionSQL);
    
    // Tester si nous pouvons utiliser une approche alternative
    console.log('🧪 Testing alternative approach to get real BL data...');
    
    // Essayer d'utiliser une fonction existante qui marche pour voir la structure
    const { data: testData, error: testError } = await supabaseAdmin.rpc('get_next_bl_number_simple', {
      p_tenant: '2025_bu01'
    });
    
    if (testError) {
      console.log('❌ Test function failed:', testError);
    } else {
      console.log('✅ Test function works, next BL number:', testData);
      console.log('📋 This confirms there are', testData - 1, 'existing BL records');
    }
    
    // Maintenant essayons de créer une fonction simple qui utilise la même approche
    console.log('🔧 We need to create the RPC function in Supabase SQL Editor');
    console.log('📋 Copy this SQL to Supabase SQL Editor:');
    console.log('---');
    console.log(functionSQL);
    console.log('---');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createRealBLListFunction();