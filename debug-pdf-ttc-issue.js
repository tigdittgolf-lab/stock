// Script pour déboguer le problème TTC dans les PDFs
const https = require('https');

function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
  });
}

async function debugTTCIssue() {
  console.log('🔍 Debugging TTC issue in PDFs...');
  
  const baseUrl = 'https://frontend-5uzozo0rv-tigdittgolf-9191s-projects.vercel.app';
  const tenant = '2025_bu01';
  const blId = 5;
  
  try {
    // 1. Test data endpoint
    console.log('\n📊 Testing data endpoint...');
    const dataResponse = await makeRequest(`${baseUrl}/api/sales/delivery-notes/${blId}`, {
      'X-Tenant': tenant
    });
    
    if (dataResponse.status === 200) {
      const data = dataResponse.data.data;
      console.log('📊 Raw data from API:', {
        montant_ht: data.montant_ht,
        tva: data.tva,
        montant_ttc: data.montant_ttc,
        database_type: dataResponse.data.database_type,
        types: {
          montant_ht: typeof data.montant_ht,
          tva: typeof data.tva,
          montant_ttc: typeof data.montant_ttc
        }
      });
      
      // Test calculation
      const ht = parseFloat(data.montant_ht);
      const tva = parseFloat(data.tva);
      const ttc = parseFloat(data.montant_ttc);
      
      console.log('🧮 Calculation test:', {
        ht_parsed: ht,
        tva_parsed: tva,
        ttc_from_data: ttc,
        calculated_ttc: ht + tva,
        is_string_concat: typeof data.montant_ht === 'string' && typeof data.tva === 'string'
      });
    }
    
    // 2. Test PDF debug endpoint
    console.log('\n🔍 Testing PDF debug endpoint...');
    const debugResponse = await makeRequest(`${baseUrl}/api/pdf/debug-bl/${blId}`, {
      'X-Tenant': tenant
    });
    
    if (debugResponse.status === 200) {
      console.log('🔍 PDF debug data:', debugResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugTTCIssue();