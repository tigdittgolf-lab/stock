#!/usr/bin/env node

/**
 * Test du nouveau déploiement Vercel
 */

const https = require('https');

// Tester les deux URLs
const URLS = [
    'https://frontend-iota-six-72.vercel.app',
    'https://frontend-rj2gndlsp-tigdittgolf-9191s-projects.vercel.app'
];

const TENANT = '2025_bu01';

console.log('🧪 TEST: Nouveau Déploiement Vercel');
console.log('===================================');
console.log('');

async function testURL(baseUrl, path) {
    return new Promise((resolve, reject) => {
        const url = `${baseUrl}${path}`;
        
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
                    data: data.substring(0, 200)
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

async function runTests() {
    const testPath = '/api/pdf/debug-bl/1';
    
    for (const baseUrl of URLS) {
        console.log(`🔍 Test: ${baseUrl}`);
        
        try {
            const result = await testURL(baseUrl, testPath);
            console.log(`   Status: ${result.status}`);
            
            if (result.status === 200) {
                console.log(`   ✅ OK - Déploiement fonctionnel`);
            } else if (result.status === 400) {
                console.log(`   ⚠️  400 - Validation stricte activée (c'est normal)`);
                
                // Essayer avec un ID valide
                try {
                    const validResult = await testURL(baseUrl, '/api/pdf/debug-bl/5');
                    console.log(`   Test ID 5: Status ${validResult.status}`);
                    if (validResult.status === 200) {
                        console.log(`   ✅ Validation fonctionne correctement`);
                    }
                } catch (e) {
                    console.log(`   ❌ Erreur test ID 5: ${e.message}`);
                }
            } else {
                console.log(`   ❌ Erreur HTTP ${result.status}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Erreur réseau: ${error.message}`);
        }
        
        console.log('');
    }
    
    console.log('📊 CONCLUSION:');
    console.log('   • Status 400 = Validation stricte fonctionne (plus de fallback vers BL 5)');
    console.log('   • Status 200 = Déploiement opérationnel');
    console.log('   • Status 500 = Problème backend');
    console.log('');
    console.log('🎯 PROCHAINE ÉTAPE:');
    console.log('   • Créer les fonctions RPC Supabase manquantes');
    console.log('   • Redémarrer le backend');
    console.log('   • Tester avec de vrais IDs de BL');
    console.log('');
}

runTests().catch(error => {
    console.error('❌ Erreur lors des tests:', error.message);
    process.exit(1);
});