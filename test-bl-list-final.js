// Test final de la liste BL avec get_delivery_notes
async function testBLListFinal() {
  console.log('🧪 Testing BL list with get_delivery_notes...');
  
  try {
    const response = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/delivery-notes', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ BL list response received:');
      console.log('📋 Success:', data.success);
      console.log('📋 Data length:', data.data?.length || 0);
      console.log('📋 Source:', data.source);
      console.log('📋 Database type:', data.database_type);
      
      if (data.data && data.data.length > 0) {
        console.log('📋 BL data sample:');
        console.log('First BL:', {
          nbl: data.data[0].nbl,
          nfact: data.data[0].nfact,
          client: data.data[0].client_name,
          date: data.data[0].date_fact || data.data[0].date_bl,
          montant_ht: data.data[0].montant_ht,
          tva: data.data[0].tva,
          montant_ttc: data.data[0].montant_ttc
        });
        console.log('All fields:', Object.keys(data.data[0]));
      }
    } else {
      console.error('❌ Request failed:', response.status, response.statusText);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testBLListFinal();