import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testing BL 8703 in Supabase...\n');

// Test 1: Check if BL 8703 exists
console.log('Test 1: Check if BL 8703 exists in 2009_bu02.bl');
const { data: bl, error: blError } = await supabase
  .schema('2009_bu02')
  .from('bl')
  .select('*')
  .eq('nbl', 8703)
  .maybeSingle();

if (blError) {
  console.error('❌ Error querying BL:', blError);
} else if (!bl) {
  console.log('❌ BL 8703 not found');
} else {
  console.log('✅ BL 8703 found:');
  console.log(`  - nbl: ${bl.nbl}`);
  console.log(`  - nclient: ${bl.nclient || bl.Nclient}`);
  console.log(`  - date_fact: ${bl.date_fact}`);
  console.log(`  - montant_ht: ${bl.montant_ht}`);
  console.log(`  - tva: ${bl.tva}`);
  console.log(`  - montant_ttc: ${bl.montant_ttc || (bl.montant_ht + bl.tva)}`);
}

// Test 2: Check payments for BL 8703
console.log('\nTest 2: Check payments for BL 8703');
const { data: payments, error: payError } = await supabase
  .from('payments')
  .select('*')
  .eq('tenant_id', '2009_bu02')
  .eq('document_type', 'delivery_note')
  .eq('document_id', 8703);

if (payError) {
  console.error('❌ Error querying payments:', payError);
} else {
  console.log(`✅ Found ${payments.length} payments for BL 8703`);
  let totalPaid = 0;
  payments.forEach(p => {
    const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
    totalPaid += amount;
    console.log(`  - Payment: ${amount} DA on ${p.payment_date}`);
  });
  console.log(`  - Total paid: ${totalPaid} DA`);
  
  if (bl) {
    const montantTTC = bl.montant_ttc || (bl.montant_ht + bl.tva);
    const balance = montantTTC - totalPaid;
    console.log(`\n📊 Payment Status:`);
    console.log(`  - Total TTC: ${montantTTC} DA`);
    console.log(`  - Total Paid: ${totalPaid} DA`);
    console.log(`  - Balance: ${balance} DA`);
    
    let status = 'unpaid';
    if (Math.abs(balance) < 0.01) {
      status = 'paid';
    } else if (totalPaid > montantTTC) {
      status = 'paid (overpaid)';
    } else if (totalPaid > 0 && balance > 0) {
      status = 'partially_paid';
    }
    console.log(`  - Status: ${status}`);
  }
}
