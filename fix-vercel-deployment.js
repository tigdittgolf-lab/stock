#!/usr/bin/env node

/**
 * Script pour corriger le déploiement Vercel et désactiver la protection
 */

const https = require('https');
const fs = require('fs');

// Configuration
const VERCEL_APP_URL = 'https://st-article-1-b5pn7fp0k-tigdittgolf-9191s-projects.vercel.app';
const BACKEND_TUNNEL_URL = 'https://enabled-encourage-mechanics-performance.trycloudflare.com';

console.log('🚀 CORRECTION DÉPLOIEMENT VERCEL');
console.log('================================');

async function checkVercelApp() {
    console.log('\n1️⃣ Vérification de l\'application Vercel...');
    
    try {
        const response = await fetch(VERCEL_APP_URL);
        const html = await response.text();
        
        console.log(`📊 Status: ${response.status}`);
        console.log(`🔗 URL: ${VERCEL_APP_URL}`);
        
        // Vérifier si la protection est active
        if (html.includes('Vercel') && html.includes('log in')) {
            console.log('❌ PROTECTION VERCEL ENCORE ACTIVE');
            console.log('   La page demande encore une connexion Vercel');
            return false;
        } else if (html.includes('Système de Gestion de Stock')) {
            console.log('✅ Application accessible - Protection désactivée');
            return true;
        } else {
            console.log('⚠️ Application accessible mais contenu inattendu');
            console.log('   Première ligne du HTML:', html.substring(0, 100));
            return true;
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
        return false;
    }
}

async function checkBackendTunnel() {
    console.log('\n2️⃣ Vérification du tunnel backend...');
    
    try {
        const response = await fetch(`${BACKEND_TUNNEL_URL}/health`);
        const data = await response.json();
        
        if (data.status === 'OK') {
            console.log('✅ Tunnel backend actif');
            console.log(`🔗 URL: ${BACKEND_TUNNEL_URL}`);
            return true;
        } else {
            console.log('❌ Tunnel backend inactif');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erreur tunnel:', error.message);
        return false;
    }
}

async function testAuthentication() {
    console.log('\n3️⃣ Test d\'authentification via tunnel...');
    
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
        
        if (data.success) {
            console.log('✅ Authentification réussie');
            console.log(`👤 Utilisateur: ${data.user.username} (${data.user.role})`);
            return data.token;
        } else {
            console.log('❌ Authentification échouée:', data.error);
            return null;
        }
        
    } catch (error) {
        console.error('❌ Erreur authentification:', error.message);
        return null;
    }
}

function generateVercelConfig() {
    console.log('\n4️⃣ Génération de la configuration Vercel...');
    
    const config = {
        "version": 2,
        "builds": [
            {
                "src": "frontend/package.json",
                "use": "@vercel/next"
            }
        ],
        "routes": [
            {
                "src": "/(.*)",
                "dest": "/frontend/$1"
            }
        ],
        "env": {
            "NODE_ENV": "production",
            "NEXT_PUBLIC_API_URL": BACKEND_TUNNEL_URL + "/api"
        },
        "functions": {
            "frontend/pages/api/**/*.js": {
                "maxDuration": 30
            }
        }
    };
    
    fs.writeFileSync('vercel-fixed.json', JSON.stringify(config, null, 2));
    console.log('✅ Configuration sauvegardée dans vercel-fixed.json');
    
    return config;
}

function generateDeploymentInstructions() {
    console.log('\n5️⃣ Instructions de déploiement...');
    
    const instructions = `
# INSTRUCTIONS POUR CORRIGER LE DÉPLOIEMENT VERCEL

## 1. Désactiver la protection Vercel (si pas encore fait)

1. Aller sur: https://vercel.com/tigdittgolf-9191s-projects/frontend/settings/security
2. Désactiver "Build Logs and Source Protection"
3. Désactiver "Git Fork Protection" 
4. Sauvegarder les changements

## 2. Configurer les variables d'environnement

\`\`\`bash
# Configurer l'URL du backend
vercel env add NEXT_PUBLIC_API_URL
# Entrer: ${BACKEND_TUNNEL_URL}/api

# Configurer l'environnement
vercel env add NODE_ENV
# Entrer: production
\`\`\`

## 3. Utiliser la nouvelle configuration

\`\`\`bash
# Copier la nouvelle configuration
cp vercel-fixed.json vercel.json

# Redéployer
cd frontend
vercel --prod
\`\`\`

## 4. Vérifier le déploiement

Une fois déployé, l'application devrait :
- ✅ Être accessible sans protection Vercel
- ✅ Se connecter au backend local via tunnel
- ✅ Permettre l'authentification
- ✅ Permettre le switch entre bases de données

## 5. URL de test

Application: ${VERCEL_APP_URL}
Backend: ${BACKEND_TUNNEL_URL}

## 6. Test rapide

\`\`\`bash
# Tester l'application
node fix-vercel-deployment.js
\`\`\`
`;

    fs.writeFileSync('VERCEL_DEPLOYMENT_FIX.md', instructions);
    console.log('✅ Instructions sauvegardées dans VERCEL_DEPLOYMENT_FIX.md');
}

async function main() {
    console.log('🔍 Diagnostic complet du déploiement Vercel...\n');
    
    // Vérifications
    const vercelOk = await checkVercelApp();
    const backendOk = await checkBackendTunnel();
    const token = await testAuthentication();
    
    // Génération des fichiers de correction
    generateVercelConfig();
    generateDeploymentInstructions();
    
    // Résumé
    console.log('\n📊 RÉSUMÉ DU DIAGNOSTIC');
    console.log('======================');
    console.log(`🌐 Application Vercel: ${vercelOk ? '✅ OK' : '❌ PROBLÈME'}`);
    console.log(`🔗 Backend Tunnel: ${backendOk ? '✅ OK' : '❌ PROBLÈME'}`);
    console.log(`🔐 Authentification: ${token ? '✅ OK' : '❌ PROBLÈME'}`);
    
    if (!vercelOk) {
        console.log('\n🚨 ACTION REQUISE:');
        console.log('1. Désactiver la protection Vercel dans les paramètres');
        console.log('2. Configurer les variables d\'environnement');
        console.log('3. Redéployer avec la nouvelle configuration');
        console.log('\n📋 Voir VERCEL_DEPLOYMENT_FIX.md pour les instructions détaillées');
    } else if (vercelOk && backendOk && token) {
        console.log('\n🎉 TOUT FONCTIONNE !');
        console.log('L\'application Vercel peut se connecter au backend local via tunnel');
    }
}

// Exécuter le diagnostic
main().catch(console.error);