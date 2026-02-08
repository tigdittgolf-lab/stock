// Script de test rapide pour vérifier que le système de paiements fonctionne
// Usage: node test-payment-system.js

const API_BASE_URL = 'http://localhost:3000'; // Ajustez selon votre configuration
const TENANT_ID = '2025_bu01'; // Ajustez selon votre tenant

console.log('🧪 Test du système de paiements clients\n');

async function testPaymentSystem() {
    let testsPassed = 0;
    let testsFailed = 0;

    // Test 1: Vérifier que les routes API sont accessibles
    console.log('1️⃣ Test des routes API...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/payments/outstanding?tenantId=${TENANT_ID}`);
        if (response.ok) {
            console.log('   ✅ Routes API accessibles');
            testsPassed++;
        } else {
            console.log('   ❌ Routes API non accessibles (status:', response.status, ')');
            testsFailed++;
        }
    } catch (error) {
        console.log('   ❌ Erreur de connexion:', error.message);
        console.log('   💡 Assurez-vous que le serveur backend est démarré');
        testsFailed++;
    }

    // Test 2: Créer un paiement de test
    console.log('\n2️⃣ Test de création de paiement...');
    try {
        const paymentData = {
            tenantId: TENANT_ID,
            documentType: 'delivery_note',
            documentId: 1, // Utilisez un ID de BL existant
            paymentDate: new Date().toISOString().split('T')[0],
            amount: 5000,
            paymentMethod: 'cash',
            notes: 'Test automatique'
        };

        const response = await fetch(`${API_BASE_URL}/api/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant': TENANT_ID
            },
            body: JSON.stringify(paymentData)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ Paiement créé avec succès');
            console.log('   📊 ID du paiement:', data.data.id);
            testsPassed++;
            
            // Test 3: Récupérer le paiement créé
            console.log('\n3️⃣ Test de récupération du paiement...');
            const getResponse = await fetch(`${API_BASE_URL}/api/payments/${data.data.id}`, {
                headers: {
                    'X-Tenant': TENANT_ID
                }
            });
            
            if (getResponse.ok) {
                const payment = await getResponse.json();
                console.log('   ✅ Paiement récupéré avec succès');
                console.log('   📊 Montant:', payment.data.amount, 'DA');
                testsPassed++;
            } else {
                console.log('   ❌ Échec de récupération du paiement');
                testsFailed++;
            }

            // Test 4: Supprimer le paiement de test
            console.log('\n4️⃣ Test de suppression du paiement...');
            const deleteResponse = await fetch(`${API_BASE_URL}/api/payments/${data.data.id}`, {
                method: 'DELETE',
                headers: {
                    'X-Tenant': TENANT_ID
                }
            });
            
            if (deleteResponse.ok) {
                console.log('   ✅ Paiement supprimé avec succès');
                testsPassed++;
            } else {
                console.log('   ❌ Échec de suppression du paiement');
                testsFailed++;
            }
        } else {
            const error = await response.json();
            console.log('   ❌ Échec de création du paiement:', error.error?.message || 'Erreur inconnue');
            console.log('   💡 Vérifiez que la table payments existe et que le document ID 1 existe');
            testsFailed++;
        }
    } catch (error) {
        console.log('   ❌ Erreur:', error.message);
        testsFailed++;
    }

    // Test 5: Vérifier le calcul du solde
    console.log('\n5️⃣ Test du calcul de solde...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/payments/balance?documentType=delivery_note&documentId=1`, {
            headers: {
                'X-Tenant': TENANT_ID
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ Calcul de solde fonctionnel');
            console.log('   📊 Solde:', data.data.balance, 'DA');
            console.log('   📊 Statut:', data.data.status);
            testsPassed++;
        } else {
            console.log('   ❌ Échec du calcul de solde');
            testsFailed++;
        }
    } catch (error) {
        console.log('   ❌ Erreur:', error.message);
        testsFailed++;
    }

    // Test 6: Vérifier le dashboard des impayés
    console.log('\n6️⃣ Test du dashboard des impayés...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/payments/outstanding`, {
            headers: {
                'X-Tenant': TENANT_ID
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ Dashboard accessible');
            console.log('   📊 Nombre de documents impayés:', data.data.length);
            testsPassed++;
        } else {
            console.log('   ❌ Dashboard non accessible');
            testsFailed++;
        }
    } catch (error) {
        console.log('   ❌ Erreur:', error.message);
        testsFailed++;
    }

    // Résumé
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(50));
    console.log(`✅ Tests réussis: ${testsPassed}`);
    console.log(`❌ Tests échoués: ${testsFailed}`);
    console.log(`📈 Taux de réussite: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    
    if (testsFailed === 0) {
        console.log('\n🎉 Tous les tests sont passés ! Le système de paiements est opérationnel.');
    } else {
        console.log('\n⚠️ Certains tests ont échoué. Consultez INTEGRATION_GUIDE_STEP_BY_STEP.md pour le dépannage.');
    }
}

// Exécuter les tests
testPaymentSystem().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
