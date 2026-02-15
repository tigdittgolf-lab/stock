// Script de test pour vérifier l'API des achats

async function testPurchasesAPI() {
  console.log('🧪 Test de l\'API des achats\n');
  
  const tenant = '2009_bu02'; // Utiliser ton tenant
  const baseUrl = 'http://localhost:3005';
  
  try {
    console.log(`📋 Test 1: Liste des BL d'achat pour le tenant ${tenant}`);
    console.log(`URL: ${baseUrl}/api/purchases/delivery-notes`);
    
    const response = await fetch(`${baseUrl}/api/purchases/delivery-notes`, {
      headers: {
        'X-Tenant': tenant
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Succès!`);
      console.log(`Nombre de BL: ${data.data?.length || 0}`);
      console.log(`Source: ${data.source}`);
      console.log(`Database: ${data.database_type}`);
      
      if (data.data && data.data.length > 0) {
        console.log(`\n📦 Premier BL:`);
        console.log(JSON.stringify(data.data[0], null, 2));
      } else {
        console.log(`\n⚠️  Aucun BL trouvé dans la base de données`);
      }
    } else {
      const text = await response.text();
      console.log(`❌ Erreur: ${text}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
  }
}

testPurchasesAPI();
