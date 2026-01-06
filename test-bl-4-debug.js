#!/usr/bin/env node

/**
 * Test spécifique pour BL 4 pour comprendre l'erreur
 */

const https = require('https');

const BACKEND_URL = 'https://desktop-bhhs068.tail1d9c54.ts.net';
const FRONTEND_URL = 'https://frontend-21m7zc77t-tigdittgolf-9191s-projects.vercel.app';
const TENANT = '2025_bu01';

console.log('🔍 TEST SPÉCIFIQUE: BL 4 Debug');
console.log('==============================');
console.log('');

async function testEndpoint(url, description) {
    return new Promise((resolve, reject) => {
        console.log(`🔍 ${description}: ${url}`);
        
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
                try {
                    let parsedData = null;
                    if (res.headers['content-type']?.includes('application/json')) {
                        parsedData = JSON.parse(data);
                    }
                    
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: parsedData,
                        rawData: data.substring(0, 500)
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: null,
                        rawData: data.substring(0, 500),
                        parseError: error.message
                    });
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
    console.log(`🎯 Backend: ${BACKEND_URL}`);
    console.log(`🌐 Frontend: ${FRONTEND_URL}`);
    console.log(`🏢 Tenant: ${TENANT}`);
    console.log('');
    
    const tests = [
        {
            url: `${BACKEND_URL}/api/pdf/debug-bl/4`,
            description: 'Backend Direct BL 4'
        },
        {
            url: `${FRONTEND_URL}/api/pdf/debug-bl/4`,
            description: 'Frontend Proxy BL 4'
        },
        {
            url: `${BACKEND_URL}/api/pdf/debug-bl/5`,
            description: 'Backend Direct BL 5 (référence)'
        },
        {
            url: `${FRONTEND_URL}/api/pdf/debug-bl/5`,
            description: 'Frontend Proxy BL 5 (référence)'
        }
    ];
    
    for (const test of tests) {
        try {
            const result = await testEndpoint(test.url, test.description);
            
            console.log(`   Status: ${result.status}`);
            
            if (result.status === 200) {
                if (result.data && result.data.success && result.data.data) {
                    const blId = result.data.data.nbl || result.data.data.nfact;
                    console.log(`   ✅ Succès - BL ID: ${blId}`);
                    console.log(`   📊 Client: ${result.data.data.client_name || 'N/A'}`);
                } else {
                    console.log(`   ✅ Succès mais données incomplètes`);
                }
            } else if (result.status === 400) {
                console.log(`   ❌ Erreur 400 - Validation stricte`);
                if (result.data && result.data.error) {
                    console.log(`   📝 Message: ${result.data.error}`);
                }
            } else {
                console.log(`   ❌ Erreur ${result.status}`);
                if (result.data && result.data.error) {
                    console.log(`   📝 Message: ${result.data.error}`);
                }
            }
            
        } catch (error) {
            console.log(`   ❌ Erreur réseau: ${error.message}`);
        }
        
        console.log('');
        
        // Petite pause entre les tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('📊 ANALYSE:');
    console.log('   • Si Backend Direct fonctionne mais Frontend Proxy échoue:');
    console.log('     → Problème dans le proxy frontend');
    console.log('   • Si les deux échouent:');
    console.log('     → Problème côté backend ou données');
    console.log('   • Si BL 5 fonctionne mais pas BL 4:');
    console.log('     → Problème spécifique aux données BL 4');
    console.log('');
}

runTests().catch(error => {
    console.error('❌ Erreur lors des tests:', error.message);
    process.exit(1);
});