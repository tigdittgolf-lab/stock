// Test de la nouvelle fonction RPC
const response = await fetch('http://localhost:3005/api/sales/delivery-notes-by-payment-status?status=partially_paid', {
  headers: {
    'X-Tenant': '2009_bu02',
    'X-Database-Type': 'mysql'
  }
});

const data = await response.json();
console.log('Response:', JSON.stringify(data, null, 2));
