// Test de la fonction get_bl_with_details
const fetch = require('node-fetch');

async function testBLDetails() {
    console.log('🧪 Test BL Details Function...\n');

    try {
        // Test direct de la fonction RPC via le backend
        const response = await fetch('http://localhost:3005/api/suppliers', {
            headers: {
                'X-Tenant': '2025_bu01'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Backend accessible');
        console.log(`📊 Suppliers found: ${data.data?.length || 0}`);

        // Maintenant testons un BL spécifique
        console.log('\n🔍 Testing BL details...');
        
        // Simuler l'appel de fetchBLData
        console.log('📋 Simulating fetchBLData for BL 5...');
        
        // Ici on devrait tester la fonction RPC directement
        // Mais comme on n'a pas accès direct, testons via le PDF endpoint
        
        const pdfResponse = await fetch('http://localhost:3005/api/pdf/delivery-note/5', {
            headers: {
                'X-Tenant': '2025_bu01'
            }
        });

        console.log(`📄 PDF Response: ${pdfResponse.status}`);
        console.log(`📄 Content-Type: ${pdfResponse.headers.get('content-type')}`);
        
        if (pdfResponse.headers.get('content-type')?.includes('application/pdf')) {
            console.log('✅ PDF généré avec succès');
            console.log(`📊 PDF Size: ${pdfResponse.headers.get('content-length')} bytes`);
        } else {
            const errorData = await pdfResponse.json();
            console.log('❌ PDF Error:', errorData);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testBLDetails();