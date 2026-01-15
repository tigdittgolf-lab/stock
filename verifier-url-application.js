// Vérification de l'URL de l'application
const verifierURL = async () => {
  const url = 'https://desktop-bhhs068.tail1d9c54.ts.net';
  
  console.log('🌐 URL DE VOTRE APPLICATION');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\n📍 ${url}\n`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('🔍 Vérification de l\'accès...\n');
  
  try {
    // Test page d'accueil
    const homeResponse = await fetch(url);
    console.log(`✅ Page d'accueil : ${homeResponse.status} ${homeResponse.statusText}`);
    
    // Test API
    const apiResponse = await fetch(`${url}/api/sales/delivery-notes/5`, {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    
    if (apiResponse.ok) {
      const data = await apiResponse.json();
      console.log(`✅ API fonctionnelle : ${apiResponse.status} ${apiResponse.statusText}`);
      
      if (data.success && data.data) {
        console.log(`\n📊 Données de test (BL #5):`);
        console.log(`   • Montant HT: ${data.data.montant_ht} DA`);
        console.log(`   • TVA: ${data.data.tva} DA`);
        console.log(`   • Total TTC: ${data.data.montant_ttc} DA`);
        console.log(`   • Database: ${data.database_type}`);
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎯 VOTRE APPLICATION EST ACCESSIBLE À :');
    console.log(`   ${url}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📋 Exemples d\'URLs à utiliser:');
    console.log(`   • Page d'accueil: ${url}`);
    console.log(`   • Dashboard: ${url}/dashboard`);
    console.log(`   • Login: ${url}/auth/login`);
    console.log(`   • PDF BL: ${url}/api/pdf/delivery-note/5`);
    console.log(`   • PDF Facture: ${url}/api/pdf/invoice/5`);
    console.log(`   • PDF Proforma: ${url}/api/pdf/proforma/5`);
    console.log('\n   (N\'oubliez pas d\'ajouter le header X-Tenant: 2025_bu01 pour les APIs)\n');
    
  } catch (error) {
    console.log(`\n❌ Erreur: ${error.message}`);
    console.log('\n⚠️  Vérifiez que votre serveur local est démarré!');
  }
};

verifierURL().catch(console.error);