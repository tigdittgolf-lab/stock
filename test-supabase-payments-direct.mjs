import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.vercel');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testing Supabase payments query directly...\n');

// Test 1: Get all payments for tenant 2009_bu02
console.log('Test 1: Get all payments for tenant 2009_bu02');
const { data: allPayments, error: error1 } = await supabase
  .from('payments')
  .select('*')
  .eq('tenant_id', '2009_bu02');

if (error1) {
  console.error('❌ Error:', error1);
} else {
  console.log(`✅ Found ${allPayments.length} payments`);
  if (allPayments.length > 0) {
    console.log('First payment:', allPayments[0]);
  }
}

// Test 2: Get payment summaries grouped by document_id
console.log('\nTest 2: Get payment summaries for delivery_note documents');
const { data: payments, error: error2 } = await supabase
  .from('payments')
  .select('document_id, amount')
  .eq('tenant_id', '2009_bu02')
  .eq('document_type', 'delivery_note');

if (error2) {
  console.error('❌ Error:', error2);
} else {
  console.log(`✅ Found ${payments.length} payment records`);
  
  // Group and sum by document_id
  const paymentSummaries = new Map();
  payments.forEach(payment => {
    const docId = payment.document_id;
    const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
    paymentSummaries.set(docId, (paymentSummaries.get(docId) || 0) + amount);
  });
  
  console.log(`✅ Payment summaries for ${paymentSummaries.size} documents:`);
  for (const [docId, total] of paymentSummaries.entries()) {
    console.log(`  - Document ${docId}: ${total} DA`);
  }
}

// Test 3: Check BL 8703 specifically
console.log('\nTest 3: Check payments for BL 8703');
const { data: bl8703Payments, error: error3 } = await supabase
  .from('payments')
  .select('*')
  .eq('tenant_id', '2009_bu02')
  .eq('document_type', 'delivery_note')
  .eq('document_id', 8703);

if (error3) {
  console.error('❌ Error:', error3);
} else {
  console.log(`✅ Found ${bl8703Payments.length} payments for BL 8703`);
  let total = 0;
  bl8703Payments.forEach(payment => {
    const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
    total += amount;
    console.log(`  - Payment: ${amount} DA on ${payment.payment_date}`);
  });
  console.log(`  - Total paid: ${total} DA`);
}
