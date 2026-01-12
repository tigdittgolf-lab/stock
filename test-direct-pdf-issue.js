// Test direct pour identifier le vrai problème TTC
const https = require('https');

function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.headers['content-type']?.includes('application/json')) {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } else {
            resolve({ status: res.statusCode, data: data, headers: res.headers });
          }
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
  });
}

async function testDirectPDFIssue() {
  console.log('🔍 Test direct du problème TTC dans les PDFs...');
  
  const baseUrl = 'https://frontend-r10lpa54q-tigdittgolf-9191s-projects.vercel.app';
  const tenant = '2025_bu01';
  const blId = 5;
  
  try {
    console.log('\n📊 1. Test de l\'endpoint de données...');
    const dataResponse = await makeRequest(`${baseUrl}/api/sales/delivery-notes/${blId}`, {
      'X-Tenant': tenant
    });
    
    if (dataResponse.status === 200) {
      const data = dataResponse.data.data;
      console.log('📊 Données brutes de l\'API:', {
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
      
      // Test de calcul manuel
      console.log('🧮 Test de calcul manuel:');
      console.log(`  Addition directe: ${data.montant_ht} + ${data.tva} = ${data.montant_ht + data.tva}`);
      console.log(`  parseFloat: ${parseFloat(data.montant_ht)} + ${parseFloat(data.tva)} = ${parseFloat(data.montant_ht) + parseFloat(data.tva)}`);
      console.log(`  Concaténation string: "${data.montant_ht}" + "${data.tva}" = "${data.montant_ht}${data.tva}"`);
    }
    
    console.log('\n🔍 2. Test de l\'endpoint debug PDF...');
    const debugResponse = await makeRequest(`${baseUrl}/api/pdf/debug-bl/${blId}`, {
      'X-Tenant': tenant
    });
    
    if (debugResponse.status === 200) {
      console.log('🔍 Données debug PDF:', debugResponse.data);
    } else {
      console.log('❌ Debug PDF failed:', debugResponse.status, debugResponse.data);
    }
    
    console.log('\n📄 3. Test de génération PDF...');
    const pdfResponse = await makeRequest(`${baseUrl}/api/pdf/delivery-note/${blId}`, {
      'X-Tenant': tenant
    });
    
    console.log('📄 Réponse PDF:', {
      status: pdfResponse.status,
      contentType: pdfResponse.headers['content-type'],
      contentLength: pdfResponse.headers['content-length']
    });
    
    if (pdfResponse.status !== 200) {
      console.log('❌ Erreur PDF:', pdfResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test échoué:', error.message);
  }
}

testDirectPDFIssue();