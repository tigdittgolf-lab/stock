// Vérifier la structure Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Essayer de lire depuis public.bl avec tenant_id
const { data, error } = await supabase
  .from('bl')
  .select('*')
  .eq('tenant_id', '2025_bu01')
  .limit(1);

if (error) {
  console.log('❌ Erreur:', error.message);
} else if (data && data.length > 0) {
  console.log('✅ Structure Supabase confirmée: table public.bl avec tenant_id');
  console.log('\nColonnes:');
  console.log(Object.keys(data[0]));
  console.log('\nPremier BL:');
  console.log(data[0]);
} else {
  console.log('⚠️ Aucun BL trouvé pour tenant 2025_bu01');
}
