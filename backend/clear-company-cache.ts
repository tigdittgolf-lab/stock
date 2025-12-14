import { supabaseAdmin } from './src/supabaseClient.js';

async function clearCompanyCache() {
  console.log('🧹 VIDAGE DU CACHE COMPANYSERVICE');
  console.log('=================================\n');
  
  try {
    // 1. Tester les données actuelles dans la base
    console.log('🔍 Vérification des données dans la base...');
    
    const { data: dbData, error: dbError } = await supabaseAdmin.rpc('get_company_info', {
      p_tenant: '2025_bu01'
    });
    
    if (dbError) {
      console.error('❌ Erreur base de données:', dbError);
      return;
    }
    
    if (dbData && dbData.length > 0) {
      console.log('✅ Données dans la base de données:');
      console.log(`   Raison sociale: ${dbData[0].raison_sociale}`);
      console.log(`   Adresse: ${dbData[0].adresse}`);
      console.log(`   Téléphone: ${dbData[0].tel_fixe}`);
    }
    
    // 2. Tester ce que retourne le serveur backend
    console.log('\n🌐 Test du serveur backend...');
    
    try {
      const serverResponse = await fetch('http://localhost:3005/api/company-info', {
        headers: {
          'X-Tenant': '2025_bu01'
        }
      });
      
      if (serverResponse.ok) {
        const serverData = await serverResponse.json();
        console.log('📡 Données du serveur backend:');
        console.log(`   Raison sociale: ${serverData.name}`);
        console.log(`   Adresse: ${serverData.address}`);
        console.log(`   Téléphone: ${serverData.phone}`);
        
        // Comparer avec les données de la base
        if (serverData.name !== dbData[0].raison_sociale) {
          console.log('\n⚠️ PROBLÈME DÉTECTÉ !');
          console.log('   Le serveur backend retourne des données différentes de la base !');
          console.log('   → Le cache du CompanyService doit être vidé');
        } else {
          console.log('\n✅ Les données du serveur correspondent à la base');
        }
      } else {
        console.log(`❌ Erreur serveur: ${serverResponse.status} ${serverResponse.statusText}`);
        
        if (serverResponse.status === 404) {
          console.log('   → L\'endpoint /api/company-info n\'existe pas encore');
          console.log('   → Testons directement avec un PDF');
        }
      }
    } catch (fetchError) {
      console.log('❌ Impossible de contacter le serveur backend');
      console.log('   → Le serveur est-il démarré sur le port 3005 ?');
    }
    
    // 3. Tester avec un PDF pour voir les vraies données utilisées
    console.log('\n📄 Test PDF pour voir les données réellement utilisées...');
    
    try {
      const pdfResponse = await fetch('http://localhost:3005/api/pdf/delivery-note/4', {
        headers: {
          'X-Tenant': '2025_bu01'
        }
      });
      
      if (pdfResponse.ok) {
        console.log('✅ PDF généré avec succès');
        console.log('   → Le PDF utilise les données du cache CompanyService');
        console.log('   → Si les données sont anciennes, il faut redémarrer le serveur');
      } else {
        console.log(`❌ Erreur PDF: ${pdfResponse.status}`);
      }
    } catch (pdfError) {
      console.log('❌ Impossible de tester le PDF');
    }
    
    console.log('\n💡 SOLUTIONS RECOMMANDÉES');
    console.log('=========================');
    console.log('');
    console.log('1. 🔄 REDÉMARRER LE SERVEUR BACKEND (recommandé)');
    console.log('   → Arrêtez le serveur backend (Ctrl+C)');
    console.log('   → Relancez: bun run index.ts');
    console.log('   → Cela videra automatiquement le cache en mémoire');
    console.log('');
    console.log('2. 🧹 OU créer un endpoint pour vider le cache');
    console.log('   → Ajouter une route /api/clear-cache');
    console.log('   → Appeler CompanyService.clearCache()');
    console.log('');
    console.log('3. 🔍 Vérifier que le tenant est bien passé');
    console.log('   → S\'assurer que X-Tenant: 2025_bu01 est dans les en-têtes');
    
    console.log('\n🎯 APRÈS REDÉMARRAGE');
    console.log('===================');
    console.log('Les bons de livraison afficheront:');
    console.log(`   🏢 ${dbData[0].raison_sociale}`);
    console.log(`   📍 ${dbData[0].adresse}`);
    console.log(`   📞 ${dbData[0].tel_fixe}`);
    console.log(`   📧 ${dbData[0].e_mail}`);
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

clearCompanyCache();