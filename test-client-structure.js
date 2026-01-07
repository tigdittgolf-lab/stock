// Test pour vérifier la structure de la table client
async function testClientStructure() {
    try {
        const response = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/clients', {
            headers: {
                'X-Tenant': '2025_bu01',
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('✅ Clients Response:', data);
        
        if (data.data && data.data.length > 0) {
            console.log('📄 First Client Structure:', data.data[0]);
            console.log('🔍 Client Fields:', Object.keys(data.data[0]));
        }
        
    } catch (error) {
        console.error('❌ Clients API Error:', error);
    }
}

testClientStructure();