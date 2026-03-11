// Vérifier le BL 8703 et ses paiements dans Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Vérification du BL 8703 dans Supabase...\n');

// 1. Vérifier si le BL existe
console.log('1. Recherche du BL 8703 dans le schéma 2009_bu02...');
const { data: blData, error: blError } = await supabase.rpc('get_bl_list_by_tenant', {
  p_tenant: '2009_bu02'
});

if (blError) {
  console.log('❌ Erreur RPC:', blError.message);
  console.log('Essayons la conversion SQL...');
} else {
  const bl8703 = blData?.find(bl => (bl.nfact === 8703 || bl.nbl === 8703 || bl.NFact === 8703));
  if (bl8703) {
    console.log('✅ BL 8703 trouvé:');
    console.log(bl8703);
  } else {
    console.log('❌ BL 8703 NON trouvé dans les résultats');
    console.log(`Total BLs retournés: ${blData?.length || 0}`);
    if (blData && blData.length > 0) {
      console.log('Premier BL:', blData[0]);
    }
  }
}

// 2. Vérifier les paiements
console.log('\n2. Recherche des paiements pour le BL 8703...');
const { data: payments, error: payError } = await supabase
  .from('payments')
  .select('*')
  .eq('tenant_id', '2009_bu02')
  .eq('document_type', 'delivery_note')
  .eq('document_id', 8703);

if (payError) {
  console.log('❌ Erreur:', payError.message);
} else {
  console.log(`✅ Trouvé ${payments?.length || 0} paiement(s):`);
  console.table(payments);
  
  if (payments && payments.length > 0) {
    const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    console.log(`💰 Total payé: ${total} DA`);
  }
}

// 3. Vérifier tous les paiements pour 2009_bu02
console.log('\n3. Tous les paiements pour tenant 2009_bu02...');
const { data: allPayments, error: allPayError } = await supabase
  .from('payments')
  .select('*')
  .eq('tenant_id', '2009_bu02')
  .eq('document_type', 'delivery_note');

if (allPayError) {
  console.log('❌ Erreur:', allPayError.message);
} else {
  console.log(`✅ Total: ${allPayments?.length || 0} paiement(s)`);
  console.table(allPayments);
}
