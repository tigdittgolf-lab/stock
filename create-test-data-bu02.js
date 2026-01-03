// Créer des données de test pour le tenant BU02
async function createTestDataForBU02() {
  try {
    console.log('📝 Création de données de test pour BU02...');
    
    // Créer des clients directement via SQL
    const clientsSQL = `
      INSERT INTO "2025_bu02".client (
        nclient, raison_sociale, adresse, tel, email, c_affaire_fact, c_affaire_bl
      ) VALUES 
      ('500', 'Client Ami A', 'Alger, Bab Ezzouar', '021-500001', 'clientA@ami.dz', 25000, 15000),
      ('501', 'Client Ami B', 'Oran, Bir El Djir', '041-500002', 'clientB@ami.dz', 35000, 20000),
      ('502', 'Client Ami C', 'Constantine, Ali Mendjeli', '031-500003', 'clientC@ami.dz', 45000, 25000)
      ON CONFLICT (nclient) DO NOTHING;
    `;
    
    const clientResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/database/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: clientsSQL
      })
    });
    
    const clientResult = await clientResponse.json();
    console.log('👤 Clients créés:', clientResult);
    
    // Créer des BL directement via SQL
    const blSQL = `
      INSERT INTO "2025_bu02".bl (
        nbl, nclient, date_fact, montant_ht, tva, total_ttc
      ) VALUES 
      (1, '500', '2025-01-01', 5000, 950, 5950),
      (2, '501', '2025-01-02', 7500, 1425, 8925),
      (3, '502', '2025-01-03', 10000, 1900, 11900)
      ON CONFLICT (nbl) DO NOTHING;
    `;
    
    const blResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/database/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: blSQL
      })
    });
    
    const blResult = await blResponse.json();
    console.log('📋 BL créés:', blResult);
    
    // Créer des détails de BL
    const detailBlSQL = `
      INSERT INTO "2025_bu02".detail_bl (
        nbl, narticle, qte, prix, tva, total_ligne
      ) VALUES 
      (1, 'ART001', 10, 500, 19, 5950),
      (2, 'ART002', 5, 1500, 19, 8925),
      (3, 'ART003', 8, 1250, 19, 11900)
      ON CONFLICT (id) DO NOTHING;
    `;
    
    const detailResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/database/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: detailBlSQL
      })
    });
    
    const detailResult = await detailResponse.json();
    console.log('📝 Détails BL créés:', detailResult);
    
    // Tester l'accès aux nouvelles données
    console.log('\n🔍 Test d\'accès aux nouvelles données...');
    
    const testResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/delivery-notes', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu02',
        'Content-Type': 'application/json'
      }
    });
    
    const testData = await testResponse.json();
    console.log('📊 Données BU02:', JSON.stringify(testData, null, 2));
    
    console.log('\n✅ Données de test créées avec succès pour BU02!');
    console.log('📌 Votre ami peut maintenant:');
    console.log('1. Se connecter sur: https://frontend-iota-six-72.vercel.app/');
    console.log('2. Sélectionner: Business Unit 02 (2025) - 2025_bu02');
    console.log('3. Il verra 3 clients et 3 BL différents des vôtres');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

createTestDataForBU02();