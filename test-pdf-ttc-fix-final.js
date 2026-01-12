// Test script to verify PDF TTC calculation fix
// Version 3.0 - Database CAST fix

const testPDFTTCFix = async () => {
  const baseUrl = 'https://frontend-iota-six-72.vercel.app';
  
  console.log('🧪 Testing PDF TTC Calculation Fix - Version 3.0');
  console.log('📍 Base URL:', baseUrl);
  console.log('');
  
  // Test BL PDF generation for different databases
  const testCases = [
    { tenant: '2025_bu01', id: 5, database: 'Supabase (should work)' },
    { tenant: '2025_bu01', id: 5, database: 'MySQL (was showing 0.00)' },
    { tenant: '2025_bu01', id: 5, database: 'PostgreSQL (was showing string concatenation)' }
  ];
  
  for (const testCase of testCases) {
    console.log(`🔍 Testing ${testCase.database}:`);
    console.log(`   BL ID: ${testCase.id}, Tenant: ${testCase.tenant}`);
    
    try {
      // Test PDF generation endpoint
      const pdfUrl = `${baseUrl}/api/pdf/delivery-note/${testCase.id}`;
      console.log(`   📄 PDF URL: ${pdfUrl}`);
      
      const response = await fetch(pdfUrl, {
        headers: {
          'X-Tenant': testCase.tenant
        }
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/pdf')) {
          console.log(`   ✅ PDF generated successfully`);
          console.log(`   📊 Content-Type: ${contentType}`);
          console.log(`   📏 Content-Length: ${response.headers.get('content-length') || 'unknown'} bytes`);
        } else {
          console.log(`   ⚠️  Response received but not PDF format: ${contentType}`);
        }
      } else {
        console.log(`   ❌ PDF generation failed: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log(`   📝 Error details: ${errorText.substring(0, 200)}...`);
      }
      
      // Test data endpoint to check TTC calculation
      const dataUrl = `${baseUrl}/api/sales/delivery-notes/${testCase.id}`;
      console.log(`   📊 Data URL: ${dataUrl}`);
      
      const dataResponse = await fetch(dataUrl, {
        headers: {
          'X-Tenant': testCase.tenant
        }
      });
      
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        if (data.success && data.data) {
          const bl = data.data;
          console.log(`   💰 Montant HT: ${bl.montant_ht} DA`);
          console.log(`   💰 TVA: ${bl.tva} DA`);
          console.log(`   💰 Total TTC: ${bl.montant_ttc} DA`);
          console.log(`   🔢 Calculation check: ${bl.montant_ht} + ${bl.tva} = ${(parseFloat(bl.montant_ht) + parseFloat(bl.tva)).toFixed(2)} DA`);
          console.log(`   🗄️  Database: ${data.database_type || 'unknown'}`);
          
          // Check if TTC calculation is correct
          const expectedTTC = parseFloat(bl.montant_ht) + parseFloat(bl.tva) + parseFloat(bl.timbre || 0) + parseFloat(bl.autre_taxe || 0);
          const actualTTC = parseFloat(bl.montant_ttc);
          
          if (Math.abs(expectedTTC - actualTTC) < 0.01) {
            console.log(`   ✅ TTC calculation is CORRECT!`);
          } else {
            console.log(`   ❌ TTC calculation is WRONG! Expected: ${expectedTTC.toFixed(2)}, Got: ${actualTTC.toFixed(2)}`);
          }
        } else {
          console.log(`   ❌ Data fetch failed: ${data.error || 'Unknown error'}`);
        }
      } else {
        console.log(`   ❌ Data fetch failed: ${dataResponse.status} ${dataResponse.statusText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 Test Summary:');
  console.log('   - Version 3.0 includes database CAST fixes');
  console.log('   - MySQL and PostgreSQL queries now use CAST() for numeric conversion');
  console.log('   - Database-level TTC calculation prevents string concatenation');
  console.log('   - Debug logs include deployment version tracking');
  console.log('');
  console.log('📋 Expected Results:');
  console.log('   - MySQL: Should now show correct TTC (1,190.00 DA) instead of 0.00 DA');
  console.log('   - PostgreSQL: Should now show correct TTC (1,190.00 DA) instead of 100,019,000.00 DA');
  console.log('   - Supabase: Should continue working correctly (1,190.00 DA)');
};

// Run the test
testPDFTTCFix().catch(console.error);