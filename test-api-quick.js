// Test rapide de l'API proforma
async function testAPI() {
    try {
        const response = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/proforma', {
            headers: {
                'X-Tenant': '2025_bu01',
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('✅ API Response:', data);
        console.log('📊 Database Type:', data.database_type);
        console.log('📋 Data Count:', data.data ? data.data.length : 0);
        
        if (data.data && data.data.length > 0) {
            console.log('📄 First Proforma:', data.data[0]);
        }
        
    } catch (error) {
        console.error('❌ API Error:', error);
    }
}

testAPI();