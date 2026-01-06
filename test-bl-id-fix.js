#!/usr/bin/env node

/**
 * Script de test pour vérifier la correction du problème BL ID
 */

const https = require('https');

const BACKEND_URL = 'https://desktop-bhhs068.tail1d9c54.ts.net';
const TENANT = '2025_bu01';

console.log('🧪 TEST: Vérification correction BL ID');
console.log('=====================================');
console.log('');

async function testBLData(blId) {
    return new Promise((resolve, reject) => {
        const url = `${BACKEND_URL}/api/pdf/debug-bl/${blId}`;
        
        console.log(`🔍 Test BL ${blId}...`);
        
        const options = {
            method: 'GET',
            headers: {
                'X-Tenant': TENANT,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (error) {
                    reject(new Error(`Parse error: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

async function runTests() {
    const testIds = [1, 2, 3, 4, 5];
    
    console.log(`🎯 Backend: ${BACKEND_URL}`);
    console.log(`🏢 Tenant: ${TENANT}`);
    console.log('');
    
    for (const blId of testIds) {
        try {
            const result = await testBLData(blId);
            
            if (result.success && result.data) {
                const receivedId = result.data.nbl || result.data.nfact;
                const isCorrect = receivedId == blId;
                
                console.log(`   BL ${blId}: ${isCorrect ? '✅' : '❌'} Reçu ID ${receivedId} ${isCorrect ? '(CORRECT)' : '(INCORRECT - PROBLÈME!)'}`);
                
                if (!isCorrect) {
                    console.log(`      🚨 ERREUR: Demandé BL ${blId} mais reçu BL ${receivedId}`);
                }
            } else {
                console.log(`   BL ${blId}: ❌ Erreur - ${result.error || 'Pas de données'}`);
            }
        } catch (error) {
            console.log(`   BL ${blId}: ❌ Erreur réseau - ${error.message}`);
        }
        
        // Petite pause entre les tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('');
    console.log('📊 RÉSUMÉ:');
    console.log('   ✅ = BL ID correct (problème résolu)');
    console.log('   ❌ = BL ID incorrect (problème persiste)');
    console.log('');
    console.log('🔧 SI TOUS LES TESTS MONTRENT ❌:');
    console.log('   • Les fonctions RPC Supabase ne sont pas encore créées');
    console.log('   • Exécutez CREATE_COMPLETE_BL_RPC_FUNCTIONS.sql dans Supabase');
    console.log('   • Redémarrez le backend');
    console.log('');
    console.log('🎉 SI TOUS LES TESTS MONTRENT ✅:');
    console.log('   • Le problème est résolu!');
    console.log('   • Chaque BL affiche maintenant ses vraies données');
    console.log('');
}

runTests().catch(error => {
    console.error('❌ Erreur lors des tests:', error.message);
    process.exit(1);
});