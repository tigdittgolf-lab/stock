// Créer une fonction RPC simple pour lister les BL
import { supabaseAdmin } from './src/supabaseClient.js';

async function createSimpleBLListFunction() {
  console.log('🔧 Creating simple BL list function...');
  
  const functionSQL = `
-- Fonction simple pour lister les BL
CREATE OR REPLACE FUNCTION get_bl_list_for_tenant(p_tenant TEXT)
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
  EXECUTE format('SELECT nfact, nclient, date_fact, montant_ht, tva, created_at FROM %I.bl ORDER BY nfact DESC', p_tenant);
END;
$$;

GRANT EXECUTE ON FUNCTION get_bl_list_for_tenant TO anon, authenticated;
`;

  try {
    // Essayer de créer la fonction via une requête directe
    const { data, error } = await supabaseAdmin
      .from('_dummy_table_that_does_not_exist')
      .select('*')
      .limit(0);
    
    // Cette requête va échouer, mais nous permet de tester la connexion
    console.log('Database connection test completed');
    
    // Maintenant testons si nous pouvons accéder directement aux données
    console.log('🧪 Testing direct access to BL data for tenant 2025_bu01...');
    
    // Test 1: Vérifier si la table bl existe
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', '2025_bu01')
      .eq('table_name', 'bl');
    
    if (tableError) {
      console.log('❌ Cannot access information_schema:', tableError);
    } else {
      console.log('✅ Table check result:', tableCheck);
    }
    
    // Test 2: Essayer d'accéder directement aux données via une fonction existante
    const { data: blTest, error: blTestError } = await supabaseAdmin.rpc('get_next_bl_number_simple', {
      p_tenant: '2025_bu01'
    });
    
    if (blTestError) {
      console.log('❌ get_next_bl_number_simple failed:', blTestError);
    } else {
      console.log('✅ get_next_bl_number_simple works, next number would be:', blTest);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createSimpleBLListFunction();