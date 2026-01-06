#!/usr/bin/env node

/**
 * Test de la correction de l'erreur actualId dans la génération PDF
 */

const https = require('https');

const BACKEND_URL = 'https://desktop-bhhs068.tail1d9c54.ts.net';
const TENANT = '2025_bu01';

console.log('🧪 TEST: Correction erreur actualId PDF');
console.log('======================================');
console.log('');

async function testPDFGeneration(blId, type) {
    return new Promise((resolve, reject) => {
        let endpoint = '';
        switch(type) {
            case 'complete':
                endpoint = `/api/pdf/delivery-note/${blId}`;
                break;
            case 'small':
                endpoint = `/api/pdf/delivery-note-small/${blId}`;
                break;
            case 'ticket':
                endpoint = `/api/pdf/delivery-note-ticket/${blId}`;
                break;
        }
        
        const url = `${BACKEND_URL}${endpoint}`;
        
        console.log(`🔍 Test PDF ${type} pour BL ${blId}...`);
        
        const options = {
            method: 'GET',
            headers: {
                'X-Tenant': TENANT,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(url, options, (res) => {
            let data = Buffer.alloc(0);
            
            res.on('data', (chunk) => {
                data = Buffer.concat([data, chunk]);
            });
            
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    contentType: res.headers['content-type'],
                    size: data.length,
                    isPDF: res.headers['content-type'] === 'application/pdf'
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

async function runTests() {
    console.log(`🎯 Backend: ${BACKEND_URL}`);
    console.log(`🏢 Tenant: ${TENANT}`);
    console.log('');
    
    const tests = [
        { blId: 5, type: 'complete' },
        { blId: 5, type: 'small' },
        { blId: 5, type: 'ticket' },
        { blId: 1, type: 'complete' },
        { blId: 4, type: 'complete' }
    ];
    
    let successCount = 0;
    
    for (const test of tests) {
        try {
            const result = await testPDFGeneration(test.blId, test.type);
            
            if (result.status === 200 && result.isPDF) {
                console.log(`   BL ${test.blId} ${test.type}: ✅ PDF généré (${result.size} bytes)`);
                successCount++;
            } else if (result.status === 200) {
                console.log(`   BL ${test.blId} ${test.type}: ⚠️  Status 200 mais pas PDF (${result.contentType})`);
            } else {
                console.log(`   BL ${test.blId} ${test.type}: ❌ Erreur HTTP ${result.status}`);
            }
        } catch (error) {
            console.log(`   BL ${test.blId} ${test.type}: ❌ Erreur - ${error.message}`);
        }
        
        // Petite pause entre les tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('');
    console.log('📊 RÉSULTATS:');
    console.log(`   Succès: ${successCount}/${tests.length}`);
    
    if (successCount === tests.length) {
        console.log('   🎉 ERREUR ACTUALID CORRIGÉE!');
        console.log('   • Génération PDF fonctionne');
        console.log('   • Plus d\'erreur ReferenceError');
        console.log('   • Application opérationnelle');
    } else if (successCount > 0) {
        console.log('   ⚠️  Correction partielle');
        console.log('   • Certains PDFs fonctionnent');
        console.log('   • Vérifier les logs backend');
    } else {
        console.log('   ❌ Problème persiste');
        console.log('   • Vérifier que le backend a redémarré');
        console.log('   • Vérifier les logs d\'erreur');
    }
    
    console.log('');
}

runTests().catch(error => {
    console.error('❌ Erreur lors des tests:', error.message);
    process.exit(1);
});