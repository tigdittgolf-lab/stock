// Test final du déploiement en production
const https = require('https');

const PRODUCTION_URL = 'https://frontend-jlclpsv9m-tigdittgolf-9191s-projects.vercel.app';

async function testProductionAPI() {
  console.log('🚀 Test du déploiement en production...');
  console.log(`📍 URL de production: ${PRODUCTION_URL}`);
  
  const endpoints = [
    '/api/health',
    '/api/database/status',
    '/api/sales/proformas',
    '/api/articles',
    '/api/clients'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Test de ${endpoint}...`);
      
      const response = await fetch(`${PRODUCTION_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'X-Tenant': '2025_bu01',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      if (response.status === 508) {
        console.log('❌ ERREUR 508 - Loop Detected détectée!');
        const text = await response.text();
        console.log('📄 Réponse:', text.substring(0, 200));
      } else if (response.ok) {
        console.log('✅ Succès!');
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          console.log(`📋 Données reçues: ${data.data.length} éléments`);
        } else if (data.success !== undefined) {
          console.log(`📋 Succès: ${data.success}`);
        }
      } else {
        console.log(`⚠️ Status non-OK: ${response.status}`);
        const text = await response.text();
        console.log('📄 Réponse:', text.substring(0, 200));
      }
      
      // Attendre un peu entre les requêtes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ Erreur pour ${endpoint}:`, error.message);
    }
  }
  
  console.log('\n🏁 Test terminé!');
}

testProductionAPI().catch(console.error);