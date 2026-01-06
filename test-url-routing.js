#!/usr/bin/env node

/**
 * Test du routage URL pour comprendre le problème d'ID undefined
 */

const https = require('https');

const FRONTEND_URL = 'https://frontend-5pai64780-tigdittgolf-9191s-projects.vercel.app';
const TENANT = '2025_bu01';

console.log('🔍 TEST: Routage URL et Paramètres ID');
console.log('====================================');
console.log('');

async function testURL(path, description) {
    return new Promise((resolve, reject) => {
        const url = `${FRONTEND_URL}${path}`;
        
        console.log(`🔍 ${description}: ${path}`);
        
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
                    data: data.substring(0, 300)
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
    console.log(`🌐 Frontend: ${FRONTEND_URL}`);
    console.log(`🏢 Tenant: ${TENANT}`);
    console.log('');
    
    const tests = [
        {
            path: '/api/pdf/debug-bl/1',
            description: 'API Direct BL 1'
        },
        {
            path: '/api/pdf/debug-bl/3',
            description: 'API Direct BL 3 (problématique)'
        },
        {
            path: '/api/pdf/debug-bl/5',
            description: 'API Direct BL 5'
        },
        {
            path: '/delivery-notes/details/1',
            description: 'Page Details BL 1'
        },
        {
            path: '/delivery-notes/details/3',
            description: 'Page Details BL 3 (problématique)'
        },
        {
            path: '/delivery-notes/details/5',
            description: 'Page Details BL 5'
        }
    ];
    
    for (const test of tests) {
        try {
            const result = await testURL(test.path, test.description);
            
            console.log(`   Status: ${result.status}`);
            
            if (result.status === 200) {
                console.log(`   ✅ OK`);
                
                // Chercher des indices dans la réponse
                if (test.path.includes('/api/')) {
                    try {
                        const jsonData = JSON.parse(result.data);
                        if (jsonData.success === false && jsonData.error) {
                            console.log(`   📝 Erreur API: ${jsonData.error}`);
                        } else if (jsonData.data) {
                            console.log(`   📊 Données OK`);
                        }
                    } catch (e) {
                        console.log(`   📄 Réponse non-JSON`);
                    }
                } else {
                    // Page HTML
                    if (result.data.includes('error') || result.data.includes('Error')) {
                        console.log(`   ⚠️  Page contient des erreurs`);
                    } else {
                        console.log(`   📄 Page HTML OK`);
                    }
                }
            } else if (result.status === 400) {
                console.log(`   ❌ Erreur 400 - Validation`);
                try {
                    const jsonData = JSON.parse(result.data);
                    if (jsonData.error) {
                        console.log(`   📝 Message: ${jsonData.error}`);
                    }
                } catch (e) {
                    console.log(`   📝 Erreur non parsable`);
                }
            } else {
                console.log(`   ❌ Erreur ${result.status}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Erreur réseau: ${error.message}`);
        }
        
        console.log('');
        
        // Petite pause entre les tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('📊 ANALYSE:');
    console.log('   • Si API fonctionne mais Page échoue:');
    console.log('     → Problème dans le routage Next.js');
    console.log('   • Si BL 3 spécifiquement échoue:');
    console.log('     → Problème avec ce BL particulier');
    console.log('   • Si tous échouent:');
    console.log('     → Problème général de validation');
    console.log('');
    console.log('💡 PROCHAINE ÉTAPE:');
    console.log('   Vérifier les logs de debug dans la console navigateur');
    console.log('   pour voir exactement où l\'ID devient undefined');
    console.log('');
}

runTests().catch(error => {
    console.error('❌ Erreur lors des tests:', error.message);
    process.exit(1);
});