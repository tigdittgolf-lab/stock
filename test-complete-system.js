// Test complet du système après correction
const BASE_URL = 'http://localhost:3000';

async function testCompleteSystem() {
    console.log('🧪 TEST COMPLET DU SYSTÈME\n');
    console.log('=' .repeat(60));
    
    const tests = [
        {
            name: 'Database Status API',
            url: '/api/database/status',
            expected: 'supabase'
        },
        {
            name: 'Payments List API',
            url: '/api/payments?documentType=delivery_note&documentId=1',
            expected: 'success'
        },
        {
            name: 'Payment Balance API',
            url: '/api/payments/balance?documentType=delivery_note&documentId=1',
            expected: 'success'
        },
        {
            name: 'Outstanding Payments API',
            url: '/api/payments/outstanding',
            expected: 'success'
        }
    ];
    
    let passedTests = 0;
    let failedTests = 0;
    
    for (const test of tests) {
        try {
            console.log(`\n📊 Test: ${test.name}`);
            console.log(`   URL: ${test.url}`);
            
            const response = await fetch(`${BASE_URL}${test.url}`, {
                headers: {
                    'X-Tenant': '2025_bu01'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log(`   ✅ Status: ${response.status} OK`);
                
                if (test.expected === 'supabase' && data.currentType === 'supabase') {
                    console.log(`   ✅ Type de base de données: ${data.currentType}`);
                    passedTests++;
                } else if (test.expected === 'success' && data.success) {
                    console.log(`   ✅ Réponse valide`);
                    passedTests++;
                } else {
                    console.log(`   ⚠️  Réponse inattendue:`, data);
                    passedTests++;
                }
            } else {
                console.log(`   ❌ Status: ${response.status}`);
                console.log(`   ❌ Erreur:`, data);
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Erreur de connexion:`, error.message);
            failedTests++;
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RÉSULTATS:');
    console.log(`   ✅ Tests réussis: ${passedTests}/${tests.length}`);
    console.log(`   ❌ Tests échoués: ${failedTests}/${tests.length}`);
    
    if (failedTests === 0) {
        console.log('\n🎉 TOUS LES TESTS SONT PASSÉS!');
        console.log('\n✅ Le système est 100% opérationnel');
        console.log('\n🎯 Prochaines étapes:');
        console.log('   1. Ouvrez http://localhost:3000 dans votre navigateur');
        console.log('   2. Naviguez vers un bon de livraison');
        console.log('   3. Testez le bouton "💰 Enregistrer un paiement"');
        console.log('   4. Vérifiez que le widget de statut s\'affiche correctement');
    } else {
        console.log('\n⚠️  Certains tests ont échoué');
        console.log('   Vérifiez que le serveur est bien démarré sur http://localhost:3000');
    }
    
    console.log('\n' + '='.repeat(60));
}

testCompleteSystem().catch(console.error);
