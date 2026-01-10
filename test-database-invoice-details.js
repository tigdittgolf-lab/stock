// Test to check what's in the database for invoice details
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseInvoiceDetails() {
  try {
    console.log('🔍 Checking database for invoice details...');
    
    const tenant = '2025_bu01';
    
    // Test 1: Check if fact table has invoices
    console.log('\n📋 Test 1: Checking fact table...');
    const { data: factData, error: factError } = await supabase.rpc('exec_sql', {
      sql: `SELECT * FROM "${tenant}".fact ORDER BY nfact;`
    });
    
    if (factError) {
      console.error('❌ Error querying fact table:', factError);
    } else {
      console.log(`✅ Found ${factData?.length || 0} invoices in fact table:`);
      factData?.forEach(invoice => {
        console.log(`  - Invoice ${invoice.nfact}: Client ${invoice.nclient}, Amount ${invoice.montant_ht} DA`);
      });
    }
    
    // Test 2: Check if detail_fact table exists and has data
    console.log('\n📦 Test 2: Checking detail_fact table...');
    const { data: detailData, error: detailError } = await supabase.rpc('exec_sql', {
      sql: `SELECT * FROM "${tenant}".detail_fact ORDER BY nfact, id;`
    });
    
    if (detailError) {
      console.error('❌ Error querying detail_fact table:', detailError);
    } else {
      console.log(`✅ Found ${detailData?.length || 0} invoice details in detail_fact table:`);
      detailData?.forEach(detail => {
        console.log(`  - Invoice ${detail.nfact}: Article ${detail.narticle}, Qty ${detail.qte}, Price ${detail.prix} DA`);
      });
    }
    
    // Test 3: Check specific invoice 2 details
    console.log('\n🔍 Test 3: Checking details for Invoice 2...');
    const { data: invoice2Details, error: invoice2Error } = await supabase.rpc('exec_sql', {
      sql: `SELECT d.*, a.designation FROM "${tenant}".detail_fact d LEFT JOIN "${tenant}".article a ON d.narticle = a.narticle WHERE d.nfact = 2 ORDER BY d.id;`
    });
    
    if (invoice2Error) {
      console.error('❌ Error querying Invoice 2 details:', invoice2Error);
    } else {
      console.log(`✅ Found ${invoice2Details?.length || 0} details for Invoice 2:`);
      invoice2Details?.forEach(detail => {
        console.log(`  - Article ${detail.narticle} (${detail.designation}): Qty ${detail.qte}, Price ${detail.prix} DA`);
      });
    }
    
    // Test 4: Check article table
    console.log('\n📦 Test 4: Checking article table...');
    const { data: articleData, error: articleError } = await supabase.rpc('exec_sql', {
      sql: `SELECT * FROM "${tenant}".article LIMIT 5;`
    });
    
    if (articleError) {
      console.error('❌ Error querying article table:', articleError);
    } else {
      console.log(`✅ Found ${articleData?.length || 0} articles (showing first 5):`);
      articleData?.forEach(article => {
        console.log(`  - Article ${article.narticle}: ${article.designation}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabaseInvoiceDetails();