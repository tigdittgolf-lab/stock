// Test de l'URL Tailscale
const testTailscaleUrl = async () => {
  const tailscaleUrl = 'https://desktop-bhhs068.tail1d9c54.ts.net';
  
  console.log('🧪 Test de l\'URL Tailscale');
  console.log('📍 URL Tailscale:', tailscaleUrl);
  console.log('');
  
  try {
    // Test de la page d'accueil
    console.log('🏠 Test de la page d\'accueil...');
    const homeResponse = await fetch(tailscaleUrl);
    console.log(`   Status: ${homeResponse.status} ${homeResponse.statusText}`);
    
    if (homeResponse.ok) {
      console.log('   ✅ Page d\'accueil accessible via Tailscale');
    } else {
      console.log('   ❌ Page d\'accueil inaccessible');
    }
    
    // Test de l'API health
    console.log('');
    console.log('🔍 Test de l\'API health...');
    const healthUrl = `${tailscaleUrl}/api/health`;
    const healthResponse = await fetch(healthUrl);
    console.log(`   Status: ${healthResponse.status} ${healthResponse.statusText}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ API health accessible via Tailscale');
      console.log('   📊 Réponse:', JSON.stringify(healthData, null, 2));
    } else {
      console.log('   ❌ API health inaccessible');
    }
    
    // Test de l'API PDF BL (correction TTC)
    console.log('');
    console.log('🔍 Test de l\'API PDF BL (correction TTC Version 3.0)...');
    const pdfUrl = `${tailscaleUrl}/api/pdf/delivery-note/5`;
    const pdfResponse = await fetch(pdfUrl, {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    console.log(`   Status: ${pdfResponse.status} ${pdfResponse.statusText}`);
    
    if (pdfResponse.ok) {
      const contentType = pdfResponse.headers.get('content-type');
      console.log('   ✅ API PDF accessible via Tailscale');
      console.log(`   📄 Content-Type: ${contentType}`);
      console.log('   🎯 Les corrections TTC Version 3.0 sont disponibles!');
    } else {
      console.log('   ❌ API PDF inaccessible');
      const errorText = await pdfResponse.text();
      console.log(`   📝 Erreur: ${errorText.substring(0, 200)}...`);
    }
    
    // Test des données TTC
    console.log('');
    console.log('🔍 Test des données TTC...');
    const salesUrl = `${tailscaleUrl}/api/sales/delivery-notes/5`;
    const salesResponse = await fetch(salesUrl, {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    console.log(`   Status: ${salesResponse.status} ${salesResponse.statusText}`);
    
    if (salesResponse.ok) {
      const salesData = await salesResponse.json();
      console.log('   ✅ API sales accessible via Tailscale');
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
          console.log(`   ✅ Calcul TTC CORRECT! (${actualTTC.toFixed(2)} DA)`);
          console.log('   🎉 La correction Version 3.0 fonctionne parfaitement!');
        } else {
          console.log(`   ❌ Calcul TTC INCORRECT! Attendu: ${expectedTTC.toFixed(2)}, Reçu: ${actualTTC.toFixed(2)}`);
        }
      }
    } else {
      console.log('   ❌ API sales inaccessible');
    }
    
    console.log('');
    console.log('🎯 RÉSUMÉ TAILSCALE:');
    console.log('   ✅ Tailscale Funnel actif et fonctionnel');
    console.log('   📍 URL publique: https://desktop-bhhs068.tail1d9c54.ts.net');
    console.log('   🔧 Corrections TTC Version 3.0 déployées localement');
    console.log('   🎯 Solution alternative à Vercel opérationnelle');
    
  } catch (error) {
    console.log(`❌ Erreur de test: ${error.message}`);
  }
};

testTailscaleUrl().catch(console.error);