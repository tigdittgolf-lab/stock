// Test du BL N° 3 en local pour vérifier le Total TTC
async function testBL3Local() {
  console.log('🚀 Test du BL N° 3 en local...');
  
  const LOCAL_BACKEND = 'http://localhost:3005';
  
  console.log(`📍 Backend local: ${LOCAL_BACKEND}`);
  
  // Test direct du backend pour le BL 3
  console.log('\n🔍 Test génération PDF BL 3...');
  
  try {
    const response = await fetch(`${LOCAL_BACKEND}/api/pdf/delivery-note/3`, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status PDF BL 3: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ PDF BL 3 généré avec succès!');
      console.log('📄 Content-Length:', response.headers.get('content-length'));
      
      // Sauvegarder le PDF pour vérification
      const buffer = await response.arrayBuffer();
      const fs = require('fs');
      fs.writeFileSync('test_bl_3_local.pdf', Buffer.from(buffer));
      console.log('💾 PDF sauvegardé: test_bl_3_local.pdf');
      
    } else {
      const text = await response.text();
      console.log('❌ Erreur génération PDF BL 3:', text);
    }
    
  } catch (error) {
    console.log(`❌ Erreur:`, error.message);
  }
  
  // Test des données BL 3 directement
  console.log('\n🔍 Test données BL 3...');
  
  try {
    const response = await fetch(`${LOCAL_BACKEND}/api/sales/delivery-notes/3`, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status données BL 3: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Données BL 3 récupérées!');
      
      if (data.success && data.data) {
        const bl = data.data;
        console.log('📋 Données BL 3:', {
          nbl: bl.nbl,
          montant_ht: bl.montant_ht,
          tva: bl.tva,
          montant_ttc: bl.montant_ttc,
          calculated_ttc: (parseFloat(bl.montant_ht) || 0) + (parseFloat(bl.tva) || 0)
        });
      }
    } else {
      const text = await response.text();
      console.log('❌ Erreur données BL 3:', text);
    }
    
  } catch (error) {
    console.log(`❌ Erreur données:`, error.message);
  }
  
  console.log('\n📋 VÉRIFICATIONS:');
  console.log('1. Regardez les logs du backend pour les valeurs de debug');
  console.log('2. Ouvrez test_bl_3_local.pdf pour voir si le Total TTC s\'affiche');
  console.log('3. Comparez avec le PDF de production');
}

testBL3Local().catch(console.error);