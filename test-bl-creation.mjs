// Test de création de BL
const testData = {
  Nclient: "78",
  date_fact: "2026-03-11",
  detail_bl: [
    {
      Narticle: "52",
      Qte: 6,
      prix: 25,
      tva: 20,
      facturer: false
    }
  ]
};

console.log('📤 Testing BL creation with data:', JSON.stringify(testData, null, 2));

try {
  const response = await fetch('http://localhost:3005/api/sales/delivery-notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant': '2009_bu02',
      'X-Database-Type': 'supabase'
    },
    body: JSON.stringify(testData)
  });

  console.log('📊 Response status:', response.status, response.statusText);
  
  const data = await response.json();
  console.log('📦 Response data:', JSON.stringify(data, null, 2));
  
  if (!data.success) {
    console.error('❌ Error:', data.error);
  } else {
    console.log('✅ Success! BL created:', data.data);
  }
} catch (error) {
  console.error('❌ Request failed:', error.message);
}
