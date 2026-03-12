// Test de l'endpoint de dette client
const testClientDebt = async () => {
  const clientCode = '1051'; // BELLOUZA BELKACEM
  const tenant = '2009_bu02';
  
  console.log(`\n🧪 Testing client debt endpoint for client ${clientCode}...\n`);
  
  try {
    const response = await fetch(`http://localhost:3005/api/sales/clients/${clientCode}/debt`, {
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': 'supabase'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Success! Client debt data:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Client: ${data.data.nclient} - ${data.data.raison_sociale}`);
      console.log(`Adresse: ${data.data.adresse || 'N/A'}`);
      console.log(`Tel: ${data.data.tel || 'N/A'}`);
      console.log('');
      console.log('💰 Chiffre d\'affaire:');
      console.log(`  - CA Factures: ${parseFloat(data.data.c_affaire_fact || 0).toFixed(2)} DA`);
      console.log(`  - CA BL: ${parseFloat(data.data.c_affaire_bl || 0).toFixed(2)} DA`);
      console.log(`  - CA Total: ${parseFloat(data.data.chiffre_affaire || 0).toFixed(2)} DA`);
      console.log('');
      console.log('📊 Détails dette:');
      console.log(`  - Total Factures: ${parseFloat(data.data.total_factures || 0).toFixed(2)} DA`);
      console.log(`  - Total BL: ${parseFloat(data.data.total_bl || 0).toFixed(2)} DA`);
      console.log(`  - Total Paiements: ${parseFloat(data.data.total_paiements || 0).toFixed(2)} DA`);
      console.log(`  - DETTE/SOLDE: ${parseFloat(data.data.solde || 0).toFixed(2)} DA`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      
      // Vérification
      const expectedDebt = 4.0; // 11.9 - 5.9 - 2.0
      const actualDebt = parseFloat(data.data.solde || 0);
      
      if (Math.abs(actualDebt - expectedDebt) < 0.01) {
        console.log(`✅ VALIDATION: Dette correcte (${actualDebt.toFixed(2)} DA)`);
      } else {
        console.log(`⚠️  ATTENTION: Dette attendue ${expectedDebt.toFixed(2)} DA, reçue ${actualDebt.toFixed(2)} DA`);
      }
    } else {
      console.log('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

testClientDebt();
