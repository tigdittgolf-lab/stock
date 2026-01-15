// Test du déploiement direct
const testDirectDeployment = async () => {
  const directUrl = 'https://st-article-1-csuejuv37-tigdittgolf-9191s-projects.vercel.app';
  
  console.log('🧪 Test du déploiement direct');
  console.log('📍 URL directe:', directUrl);
  console.log('');
  
  try {
    // Test de la page d'accueil
    console.log('🏠 Test de la page d\'accueil...');
    const homeResponse = await fetch(directUrl);
    console.log(`   Status: ${homeResponse.status} ${homeResponse.statusText}`);
    
    if (homeResponse.ok) {
      console.log('   ✅ Page d\'accueil accessible');
    } else {
      console.log('   ❌ Page d\'accueil inaccessible');
    }
    
    // Test de l'API health
    console.log('');
    console.log('🔍 Test de l\'API health...');
    const healthUrl = `${directUrl}/api/health`;
    const healthResponse = await fetch(healthUrl);
    console.log(`   Status: ${healthResponse.status} ${healthResponse.statusText}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ API health accessible');
      console.log('   📊 Réponse:', JSON.stringify(healthData, null, 2));
    } else {
      console.log('   ❌ API health inaccessible');
    }
    
    // Test de l'API PDF BL
    console.log('');
    console.log('🔍 Test de l\'API PDF BL...');
    const pdfUrl = `${directUrl}/api/pdf/delivery-note/5`;
    const pdfResponse = await fetch(pdfUrl, {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    console.log(`   Status: ${pdfResponse.status} ${pdfResponse.statusText}`);
    
    if (pdfResponse.ok) {
      const contentType = pdfResponse.headers.get('content-type');
      console.log('   ✅ API PDF accessible');
      console.log(`   📄 Content-Type: ${contentType}`);
    } else {
      console.log('   ❌ API PDF inaccessible');
      const errorText = await pdfResponse.text();
      console.log(`   📝 Erreur: ${errorText.substring(0, 200)}...`);
    }
    
    // Test de l'API sales/delivery-notes
    console.log('');
    console.log('🔍 Test de l\'API sales/delivery-notes...');
    const salesUrl = `${directUrl}/api/sales/delivery-notes/5`;
    const salesResponse = await fetch(salesUrl, {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    console.log(`   Status: ${salesResponse.status} ${salesResponse.statusText}`);
    
    if (salesResponse.ok) {
      const salesData = await salesResponse.json();
      console.log('   ✅ API sales accessible');
      if (salesData.success && salesData.data) {
        const bl = salesData.data;
        console.log(`   💰 Montant HT: ${bl.montant_ht} DA`);
        console.log(`   💰 TVA: ${bl.tva} DA`);
        console.log(`   💰 Total TTC: ${bl.montant_ttc} DA`);
        console.log(`   🗄️  Database: ${salesData.database_type || 'unknown'}`);
        
        // Vérifier le calcul TTC
        const expectedTTC = parseFloat(bl.montant_ht) + parseFloat(bl.tva) + parseFloat(bl.timbre || 0) + parseFloat(bl.autre_taxe || 0);
        const actualTTC = parseFloat(bl.montant_ttc);
        
        if (Math.abs(expectedTTC - actualTTC) < 0.01) {
          console.log(`   ✅ Calcul TTC CORRECT!`);
        } else {
          console.log(`   ❌ Calcul TTC INCORRECT! Attendu: ${expectedTTC.toFixed(2)}, Reçu: ${actualTTC.toFixed(2)}`);
        }
      }
    } else {
      console.log('   ❌ API sales inaccessible');
    }
    
  } catch (error) {
    console.log(`❌ Erreur de test: ${error.message}`);
  }
};

testDirectDeployment().catch(console.error);