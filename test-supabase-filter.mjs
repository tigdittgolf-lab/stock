// Test du filtre Supabase
const response = await fetch('http://localhost:3005/api/sales/delivery-notes-by-payment-status?status=paid', {
  headers: {
    'X-Tenant': '2025_bu01',
    'X-Database-Type': 'supabase'
  }
});

const data = await response.json();
console.log('Supabase - BLs payés:', JSON.stringify(data, null, 2));
