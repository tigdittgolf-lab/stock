// Test de la requête SQL des paiements
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simuler la requête SQL
console.log('Test de la requête SQL équivalente...\n');

const { data, error } = await supabase
  .from('payments')
  .select('document_id, amount')
  .eq('tenant_id', '2009_bu02')
  .eq('document_type', 'delivery_note');

if (error) {
  console.log('❌ Erreur:', error.message);
} else {
  console.log(`✅ Trouvé ${data.length} paiements`);
  console.table(data);
  
  // Grouper par document_id et calculer SUM
  const grouped = data.reduce((acc, p) => {
    if (!acc[p.document_id]) {
      acc[p.document_id] = 0;
    }
    acc[p.document_id] += parseFloat(p.amount);
    return acc;
  }, {});
  
  console.log('\nGroupé par document_id (équivalent SUM):');
  console.table(Object.entries(grouped).map(([doc_id, total]) => ({
    document_id: parseInt(doc_id),
    total_paid: total
  })));
}
