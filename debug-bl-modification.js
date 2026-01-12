// Debug de la modification du BL
async function debugBLModification() {
  console.log('🔍 Debug modification BL...');
  
  const LOCAL_BACKEND = 'http://localhost:3005';
  const BL_ID = 5; // Tester avec le BL 5
  
  // 1. Vérifier l'état actuel du BL
  console.log('\n📋 1. État actuel du BL 5:');
  try {
    const response = await fetch(`${LOCAL_BACKEND}/api/sales/delivery-notes/${BL_ID}`, {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ BL actuel:', {
        nbl: data.data.nbl,
        nclient: data.data.nclient,
        date_fact: data.data.date_fact,
        montant_ht: data.data.montant_ht,
        tva: data.data.tva,
        montant_ttc: data.data.montant_ttc,
        details_count: data.data.details?.length || 0
      });
      
      if (data.data.details && data.data.details.length > 0) {
        console.log('📦 Premier article:', data.data.details[0]);
      }
    } else {
      console.log('❌ Erreur récupération BL:', response.status);
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
  
  // 2. Tester une modification simple
  console.log('\n🔄 2. Test modification BL 5:');
  try {
    const modificationData = {
      Nclient: "415", // Garder le même client
      date_fact: "2025-12-21", // Changer la date
      detail_bl: [
        {
          narticle: "142",
          qte: 10, // Changer la quantité de 5 à 10
          prix: 200,
          tva: 19
        }
      ]
    };
    
    console.log('📤 Données à envoyer:', modificationData);
    
    const response = await fetch(`${LOCAL_BACKEND}/api/sales/delivery-notes/${BL_ID}`, {
      method: 'PUT',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(modificationData)
    });
    
    console.log('📊 Status modification:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Modification réussie:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur modification:', response.status, errorText);
    }
    
  } catch (error) {
    console.log('❌ Erreur modification:', error.message);
  }
  
  // 3. Vérifier l'état après modification
  console.log('\n📋 3. État après modification:');
  try {
    // Attendre un peu pour que la modification soit prise en compte
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await fetch(`${LOCAL_BACKEND}/api/sales/delivery-notes/${BL_ID}`, {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📋 BL après modification:', {
        nbl: data.data.nbl,
        nclient: data.data.nclient,
        date_fact: data.data.date_fact,
        montant_ht: data.data.montant_ht,
        tva: data.data.tva,
        montant_ttc: data.data.montant_ttc,
        details_count: data.data.details?.length || 0
      });
      
      if (data.data.details && data.data.details.length > 0) {
        console.log('📦 Premier article après modification:', data.data.details[0]);
      }
      
      // Vérifier si les changements ont été appliqués
      const firstDetail = data.data.details?.[0];
      if (firstDetail && firstDetail.qte === 10) {
        console.log('✅ MODIFICATION RÉUSSIE: Quantité changée de 5 à 10');
      } else {
        console.log('❌ MODIFICATION ÉCHOUÉE: Quantité toujours à', firstDetail?.qte);
      }
      
    } else {
      console.log('❌ Erreur vérification:', response.status);
    }
  } catch (error) {
    console.log('❌ Erreur vérification:', error.message);
  }
  
  console.log('\n📋 DIAGNOSTIC:');
  console.log('1. Vérifiez les logs du backend pour voir les erreurs RPC');
  console.log('2. Vérifiez si les fonctions update_bl, delete_bl_details, insert_bl_detail existent');
  console.log('3. Vérifiez si la base de données est bien mise à jour');
}

debugBLModification().catch(console.error);