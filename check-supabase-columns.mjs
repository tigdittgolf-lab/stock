// Vérifier les colonnes de la table bl dans Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Essayer de lire un BL pour voir les colonnes
const { data, error } = await supabase
  .schema('2025_bu01')
  .from('bl')
  .select('*')
  .limit(1);

if (error) {
  console.log('❌ Erreur:', error.message);
} else if (data && data.length > 0) {
  console.log('✅ Colonnes de la table bl:');
  console.log(Object.keys(data[0]));
  console.log('\nPremier BL:');
  console.log(data[0]);
} else {
  console.log('⚠️ Aucun BL trouvé');
}
