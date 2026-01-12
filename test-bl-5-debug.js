// Test spécifique du BL N° 5 pour diagnostiquer le problème TTC
async function testBL5Debug() {
  console.log('🚀 Test debug BL N° 5...');
  
  const LOCAL_BACKEND = 'http://localhost:3005';
  
  // Test des données BL 5
  console.log('\n🔍 Test données BL 5...');
  
  try {
    const response = await fetch(`${LOCAL_BACKEND}/api/sales/delivery-notes/5`, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status données BL 5: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Données BL 5 récupérées!');
      
      if (data.success && data.data) {
        const bl = data.data;
        console.log('📋 Données BL 5:', {
          nbl: bl.nbl,
          montant_ht: bl.montant_ht,
          tva: bl.tva,
          montant_ttc: bl.montant_ttc,
          calculated_ttc: (parseFloat(bl.montant_ht) || 0) + (parseFloat(bl.tva) || 0),
          details_count: bl.details?.length || 0
        });
        
        // Afficher les détails des articles
        if (bl.details && bl.details.length > 0) {
          console.log('📦 Articles:');
          bl.details.forEach((detail, index) => {
            console.log(`  ${index + 1}. ${detail.designation} - Qté: ${detail.qte} - Prix: ${detail.prix} - Total: ${detail.total_ligne}`);
          });
        }
      }
    } else {
      const text = await response.text();
      console.log('❌ Erreur données BL 5:', text);
    }
    
  } catch (error) {
    console.log(`❌ Erreur données:`, error.message);
  }
  
  // Test debug PDF BL 5
  console.log('\n🔍 Test debug PDF BL 5...');
  
  try {
    const response = await fetch(`${LOCAL_BACKEND}/api/pdf/debug-bl/5`, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status PDF debug BL 5: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ PDF debug BL 5 réussi!');
      console.log('📋 Données debug PDF:', {
        montant_ht: data.data?.montant_ht,
        tva: data.data?.tva,
        montant_ttc: data.data?.montant_ttc,
        timbre: data.data?.timbre,
        autre_taxe: data.data?.autre_taxe
      });
    } else {
      const text = await response.text();
      console.log('❌ Erreur PDF debug BL 5:', text);
    }
    
  } catch (error) {
    console.log(`❌ Erreur PDF debug:`, error.message);
  }
  
  // Test génération PDF BL 5
  console.log('\n🔍 Test génération PDF BL 5...');
  
  try {
    const response = await fetch(`${LOCAL_BACKEND}/api/pdf/delivery-note/5`, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status PDF BL 5: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ PDF BL 5 généré avec succès!');
      console.log('📄 Content-Length:', response.headers.get('content-length'));
      
      // Sauvegarder le PDF pour vérification
      const buffer = await response.arrayBuffer();
      const fs = require('fs');
      fs.writeFileSync('test_bl_5_debug.pdf', Buffer.from(buffer));
      console.log('💾 PDF sauvegardé: test_bl_5_debug.pdf');
      
    } else {
      const text = await response.text();
      console.log('❌ Erreur génération PDF BL 5:', text);
    }
    
  } catch (error) {
    console.log(`❌ Erreur PDF:`, error.message);
  }
  
  console.log('\n📋 DIAGNOSTIC:');
  console.log('1. Vérifiez les logs du backend pour voir les calculs');
  console.log('2. Ouvrez test_bl_5_debug.pdf pour voir le résultat');
  console.log('3. Comparez les données avec les autres BL qui fonctionnent');
}

testBL5Debug().catch(console.error);