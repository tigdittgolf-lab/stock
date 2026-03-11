// Test de récupération des BLs depuis Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Test 1: Essayer la fonction RPC get_bl_list_by_tenant...');
const { data: rpcData, error: rpcError } = await supabase.rpc('get_bl_list_by_tenant', {
  p_tenant: '2025_bu01'
});

if (rpcError) {
  console.log('❌ RPC échoue:', rpcError.message);
  
  console.log('\n🔍 Test 2: Essayer de lire directement la table bl...');
  const { data: tableData, error: tableError } = await supabase
    .from('2025_bu01.bl')
    .select('*')
    .limit(5);
  
  if (tableError) {
    console.log('❌ Lecture table échoue aussi:', tableError.message);
    
    console.log('\n🔍 Test 3: Lister les schémas disponibles...');
    const { data: schemas, error: schemaError } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE '2025%'`
      });
    
    if (schemaError) {
      console.log('❌ Impossible de lister les schémas:', schemaError.message);
    } else {
      console.log('✅ Schémas trouvés:');
      console.table(schemas);
    }
  } else {
    console.log('✅ Lecture directe fonctionne!');
    console.log(`Trouvé ${tableData.length} BLs`);
    console.table(tableData);
  }
} else {
  console.log('✅ RPC fonctionne!');
  console.log(`Trouvé ${rpcData.length} BLs`);
  console.table(rpcData.slice(0, 3));
}
