// Créer une fonction get_bl_list qui fonctionne vraiment
import { supabaseAdmin } from './src/supabaseClient.js';

async function createWorkingGetBLList() {
  console.log('🔧 Creating working get_bl_list function...');
  
  // Utiliser la même approche que get_next_bl_number_simple qui fonctionne
  const functionSQL = `
-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS get_bl_list_working(TEXT);

-- Créer une nouvelle fonction qui fonctionne
CREATE OR REPLACE FUNCTION get_bl_list_working(p_tenant TEXT)
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
  -- Utiliser la même approche que get_next_bl_number_simple
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

-- Permissions
GRANT EXECUTE ON FUNCTION get_bl_list_working TO anon, authenticated;
`;

  try {
    // Créer la fonction en utilisant la même méthode que les autres fonctions qui marchent
    console.log('📝 Creating function via SQL...');
    
    // Simuler la création (nous ne pouvons pas exécuter de SQL directement)
    console.log('✅ Function SQL prepared');
    console.log('📋 Function content:');
    console.log(functionSQL);
    
    // Tester si nous pouvons au moins récupérer des données via une approche alternative
    console.log('🧪 Testing alternative approach...');
    
    // Essayer d'utiliser get_clients_by_tenant qui fonctionne pour voir la structure
    const { data: clientsTest, error: clientsError } = await supabaseAdmin.rpc('get_clients_by_tenant', {
      p_tenant: '2025_bu01'
    });
    
    if (clientsError) {
      console.log('❌ get_clients_by_tenant failed:', clientsError);
    } else {
      console.log('✅ get_clients_by_tenant works, found clients:', clientsTest?.length || 0);
      if (clientsTest && clientsTest.length > 0) {
        console.log('📄 Sample client:', clientsTest[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createWorkingGetBLList();