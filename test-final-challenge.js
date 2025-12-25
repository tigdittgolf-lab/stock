#!/usr/bin/env node

/**
 * 🎯 TEST FINAL DU DÉFI
 * Test complet de l'application Vercel réelle connectée au backend local
 */

const https = require('https');

// Configuration
const VERCEL_APP_URL = 'https://frontend-jv1h2b1wf-tigdittgolf-9191s-projects.vercel.app';
const BACKEND_TUNNEL_URL = 'https://enabled-encourage-mechanics-performance.trycloudflare.com';

console.log('🎯 DÉFI FINAL: APPLICATION VERCEL → BACKEND LOCAL');
console.log('================================================');
console.log(`🌐 Application Vercel: ${VERCEL_APP_URL}`);
console.log(`🔗 Backend Tunnel: ${BACKEND_TUNNEL_URL}`);
console.log('');

let testResults = {
    vercelAccess: false,
    backendTunnel: false,
    authentication: false,
    databaseSwitch: false,
    dataAccess: false
};

async function testVercelAccess() {
    console.log('1️⃣ TEST: Accès à l\'application Vercel...');
    
    try {
        const response = await fetch(VERCEL_APP_URL);
        const html = await response.text();
        
        console.log(`   📊 Status HTTP: ${response.status}`);
        
        if (response.status === 401 || html.includes('Authentication Required')) {
            console.log('   ❌ ÉCHEC: Protection Vercel encore active');
            console.log('   🔧 ACTION: Désactiver la protection dans les paramètres Vercel');
            return false;
        }
        
        if (html.includes('Système de Gestion de Stock') || html.includes('Se connecter')) {
            console.log('   ✅ SUCCÈS: Application accessible sans protection');
            testResults.vercelAccess = true;
            return true;
        }
        
        console.log('   ⚠️ ATTENTION: Application accessible mais contenu inattendu');
        console.log(`   📄 Début du HTML: ${html.substring(0, 100)}...`);
        return false;
        
    } catch (error) {
        console.log(`   ❌ ERREUR: ${error.message}`);
        return false;
    }
}

async function testBackendTunnel() {
    console.log('\n2️⃣ TEST: Connexion au backend via tunnel...');
    
    try {
        const response = await fetch(`${BACKEND_TUNNEL_URL}/health`);
        const data = await response.json();
        
        if (data.status === 'OK') {
            console.log('   ✅ SUCCÈS: Backend accessible via tunnel');
            console.log(`   🕐 Timestamp: ${data.timestamp}`);
            testResults.backendTunnel = true;
            return true;
        } else {
            console.log('   ❌ ÉCHEC: Backend status incorrect');
            return false;
        }
        
    } catch (error) {
        console.log(`   ❌ ERREUR: ${error.message}`);
        console.log('   🔧 ACTION: Vérifier que le tunnel et le backend sont actifs');
        return false;
    }
}

async function testAuthentication() {
    console.log('\n3️⃣ TEST: Authentification via tunnel...');
    
    try {
        const response = await fetch(`${BACKEND_TUNNEL_URL}/api/auth-real/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.token) {
            console.log('   ✅ SUCCÈS: Authentification réussie');
            console.log(`   👤 Utilisateur: ${data.user.username} (${data.user.role})`);
            console.log(`   🔑 Token généré: ${data.token.substring(0, 20)}...`);
            testResults.authentication = true;
            return data.token;
        } else {
            console.log(`   ❌ ÉCHEC: ${data.error || 'Authentification échouée'}`);
            return null;
        }
        
    } catch (error) {
        console.log(`   ❌ ERREUR: ${error.message}`);
        return null;
    }
}

async function testDatabaseSwitch(token) {
    console.log('\n4️⃣ TEST: Switch entre bases de données...');
    
    const databases = ['supabase', 'mysql', 'postgresql'];
    let successCount = 0;
    
    for (const db of databases) {
        try {
            console.log(`   🔄 Test switch vers ${db.toUpperCase()}...`);
            
            const response = await fetch(`${BACKEND_TUNNEL_URL}/api/database-config/switch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    database: db
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log(`   ✅ Switch vers ${db.toUpperCase()} réussi`);
                successCount++;
            } else {
                console.log(`   ⚠️ Switch vers ${db.toUpperCase()} échoué: ${data.error}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Erreur switch ${db}: ${error.message}`);
        }
    }
    
    if (successCount > 0) {
        console.log(`   ✅ SUCCÈS: ${successCount}/${databases.length} bases de données accessibles`);
        testResults.databaseSwitch = true;
        return true;
    } else {
        console.log('   ❌ ÉCHEC: Aucune base de données accessible');
        return false;
    }
}

async function testDataAccess(token) {
    console.log('\n5️⃣ TEST: Accès aux données...');
    
    const endpoints = [
        { name: 'Articles', url: '/api/articles' },
        { name: 'Clients', url: '/api/clients' },
        { name: 'Fournisseurs', url: '/api/suppliers' }
    ];
    
    let successCount = 0;
    
    for (const endpoint of endpoints) {
        try {
            console.log(`   📊 Test accès ${endpoint.name}...`);
            
            const response = await fetch(`${BACKEND_TUNNEL_URL}${endpoint.url}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ ${endpoint.name}: ${Array.isArray(data) ? data.length : 'OK'} éléments`);
                successCount++;
            } else {
                console.log(`   ⚠️ ${endpoint.name}: Status ${response.status}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Erreur ${endpoint.name}: ${error.message}`);
        }
    }
    
    if (successCount > 0) {
        console.log(`   ✅ SUCCÈS: ${successCount}/${endpoints.length} endpoints accessibles`);
        testResults.dataAccess = true;
        return true;
    } else {
        console.log('   ❌ ÉCHEC: Aucun endpoint accessible');
        return false;
    }
}

function displayFinalResults() {
    console.log('\n🏆 RÉSULTATS FINAUX DU DÉFI');
    console.log('============================');
    
    const tests = [
        { name: 'Accès Application Vercel', result: testResults.vercelAccess },
        { name: 'Backend Tunnel Actif', result: testResults.backendTunnel },
        { name: 'Authentification', result: testResults.authentication },
        { name: 'Switch Base de Données', result: testResults.databaseSwitch },
        { name: 'Accès aux Données', result: testResults.dataAccess }
    ];
    
    tests.forEach((test, index) => {
        const status = test.result ? '✅ RÉUSSI' : '❌ ÉCHOUÉ';
        console.log(`${index + 1}. ${test.name}: ${status}`);
    });
    
    const successCount = tests.filter(t => t.result).length;
    const totalTests = tests.length;
    
    console.log(`\n📊 Score: ${successCount}/${totalTests} tests réussis`);
    
    if (successCount === totalTests) {
        console.log('\n🎉 DÉFI RÉUSSI ! 🎉');
        console.log('🚀 L\'application Vercel peut se connecter au backend local');
        console.log('🔄 Le switch entre bases de données fonctionne');
        console.log('📊 L\'accès aux données est opérationnel');
        console.log('\n🏆 FÉLICITATIONS ! Vous avez relevé le défi !');
    } else {
        console.log('\n⚠️ DÉFI PARTIELLEMENT RÉUSSI');
        console.log('🔧 Actions requises:');
        
        if (!testResults.vercelAccess) {
            console.log('   - Désactiver la protection Vercel');
        }
        if (!testResults.backendTunnel) {
            console.log('   - Vérifier que le tunnel et backend sont actifs');
        }
        if (!testResults.authentication) {
            console.log('   - Corriger l\'authentification');
        }
        if (!testResults.databaseSwitch) {
            console.log('   - Vérifier la configuration des bases de données');
        }
        if (!testResults.dataAccess) {
            console.log('   - Vérifier les permissions d\'accès aux données');
        }
    }
}

async function main() {
    console.log('🚀 Démarrage du test final...\n');
    
    // Exécuter tous les tests
    const vercelOk = await testVercelAccess();
    const backendOk = await testBackendTunnel();
    
    let token = null;
    if (backendOk) {
        token = await testAuthentication();
    }
    
    if (token) {
        await testDatabaseSwitch(token);
        await testDataAccess(token);
    }
    
    // Afficher les résultats finaux
    displayFinalResults();
}

// Exécuter le test
main().catch(console.error);