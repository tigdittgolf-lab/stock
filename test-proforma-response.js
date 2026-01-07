// Test pour voir la réponse complète de l'API proforma
const response = await fetch('http://localhost:3005/api/sales/proforma/1', {
  headers: {
    'X-Tenant': '2025_bu01',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('📋 Réponse complète proforma:', JSON.stringify(data, null, 2));