#!/usr/bin/env node

/**
 * Test des URLs frontend qui posent problème
 */

const https = require('https');

const FRONTEND_URL = 'https://frontend-iota-six-72.vercel.app';
const TENANT = '2025_bu01';

console.log('🧪 TEST: URLs Frontend BL Details');
console.log('==================================');
console.log('');

async function testFrontendURL(path) {
    return new Promise((resolve, reject) => {
        const url = `${FRONTEND_URL}${path}`;
        
        console.log(`🔍 Test: ${path}`);
        
        const options = {
            method: 'GET',
            headers: {
                'X-Tenant': TENANT,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data.substring(0, 500) // Premier 500 caractères
                });
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
    const testPaths = [
        '/api/pdf/debug-bl/1',
        '/api/pdf/debug-bl/4',
        '/api/pdf/delivery-note/1',
        '/api/pdf/delivery-note/4'
    ];
    
    console.log(`🎯 Frontend: ${FRONTEND_URL}`);
    console.log(`🏢 Tenant: ${TENANT}`);
    console.log('');
    
    for (const path of testPaths) {
        try {
            const result = await testFrontendURL(path);
            
            console.log(`   ${path}:`);
            console.log(`      Status: ${result.status}`);
            
            if (result.status === 200) {
                console.log(`      ✅ OK`);
                
                // Essayer de parser JSON si c'est une API
                if (path.includes('/api/') && path.includes('debug')) {
                    try {
                        const jsonData = JSON.parse(result.data);
                        if (jsonData.data && (jsonData.data.nbl || jsonData.data.nfact)) {
                            const receivedId = jsonData.data.nbl || jsonData.data.nfact;
                            const requestedId = path.split('/').pop();
                            console.log(`      📊 ID demandé: ${requestedId}, ID reçu: ${receivedId}`);
                            
                            if (receivedId == requestedId) {
                                console.log(`      ✅ ID CORRECT`);
                            } else {
                                console.log(`      ❌ ID INCORRECT - PROBLÈME!`);
                            }
                        }
                    } catch (e) {
                        console.log(`      📄 Réponse non-JSON`);
                    }
                }
            } else {
                console.log(`      ❌ Erreur HTTP ${result.status}`);
            }
            
        } catch (error) {
            console.log(`   ${path}: ❌ Erreur - ${error.message}`);
        }
        
        console.log('');
        
        // Petite pause entre les tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('📊 ANALYSE:');
    console.log('   • Si debug-bl fonctionne mais delivery-note échoue:');
    console.log('     → Le problème est dans la génération PDF');
    console.log('   • Si les deux échouent:');
    console.log('     → Le problème est dans le proxy frontend');
    console.log('   • Si les IDs sont incorrects:');
    console.log('     → Le problème persiste côté backend');
    console.log('');
}

runTests().catch(error => {
    console.error('❌ Erreur lors des tests:', error.message);
    process.exit(1);
});