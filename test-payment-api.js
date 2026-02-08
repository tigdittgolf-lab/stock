// Test script pour vérifier les API de paiement
// Usage: node test-payment-api.js

const BASE_URL = 'http://localhost:3000';
const TENANT_ID = '2025_bu01';

async function testAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant': TENANT_ID,
                ...options.headers
            }
        });
        
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        return { error: error.message };
    }
}

async function runTests() {
    console.log('🧪 Test du système de paiement\n');
    console.log('=' .repeat(60));
    
    // Test 1: Vérifier la balance d'un document (devrait retourner 404 si le document n'existe pas)
    console.log('\n📊 Test 1: GET /api/payments/balance');
    const balanceTest = await testAPI('/api/payments/balance?documentType=delivery_note&documentId=1');
    console.log('Status:', balanceTest.status);
    console.log('Response:', JSON.stringify(balanceTest.data, null, 2));
    
    // Test 2: Lister les paiements d'un document
    console.log('\n📋 Test 2: GET /api/payments');
    const listTest = await testAPI('/api/payments?documentType=delivery_note&documentId=1');
    console.log('Status:', listTest.status);
    console.log('Response:', JSON.stringify(listTest.data, null, 2));
    
    // Test 3: Créer un paiement de test (commenté pour éviter de polluer la DB)
    console.log('\n💰 Test 3: POST /api/payments (simulation)');
    console.log('Pour créer un paiement réel, utilisez:');
    console.log(`
    const createTest = await testAPI('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
            documentType: 'delivery_note',
            documentId: 1,
            paymentDate: new Date().toISOString().split('T')[0],
            amount: 5000,
            paymentMethod: 'Espèces',
            notes: 'Test de paiement'
        })
    });
    `);
    
    // Test 4: Dashboard des impayés
    console.log('\n📊 Test 4: GET /api/payments/outstanding');
    const outstandingTest = await testAPI('/api/payments/outstanding');
    console.log('Status:', outstandingTest.status);
    console.log('Response:', JSON.stringify(outstandingTest.data, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Tests terminés!\n');
    console.log('📝 Notes:');
    console.log('- Si vous voyez des erreurs 404, c\'est normal si les documents n\'existent pas encore');
    console.log('- Pour tester avec de vraies données, créez d\'abord un bon de livraison');
    console.log('- Ouvrez http://localhost:3000 dans votre navigateur pour tester l\'interface');
}

runTests().catch(console.error);
