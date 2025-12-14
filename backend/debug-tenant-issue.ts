// Script pour diagnostiquer le problème de tenant
const debugTenantIssue = async () => {
  console.log('🔍 DIAGNOSTIC DU PROBLÈME TENANT');
  console.log('================================\n');
  
  try {
    // 1. Tester l'endpoint cache pour voir si le serveur a redémarré
    console.log('🔄 Test du serveur redémarré...');
    
    try {
      const cacheResponse = await fetch('http://localhost:3005/api/cache/status', {
        headers: {
          'X-Tenant': '2025_bu01'
        }
      });
      
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json();
        console.log('✅ Serveur redémarré avec succès');
        console.log('📊 Données du cache:');
        console.log(`   Nom: ${cacheData.companyInfo.name}`);
        console.log(`   Adresse: ${cacheData.companyInfo.address}`);
      } else {
        console.log('⚠️ Endpoint cache non disponible');
      }
    } catch (e) {
      console.log('❌ Serveur non accessible ou pas redémarré');
    }
    
    // 2. Tester différents scénarios de tenant
    console.log('\n🧪 Test des différents scénarios de tenant...');
    
    const scenarios = [
      { name: 'Sans tenant', headers: {} },
      { name: 'Avec tenant 2025_bu01', headers: { 'X-Tenant': '2025_bu01' } },
      { name: 'Avec tenant par défaut', headers: { 'X-Tenant': '2025_bu01' } }
    ];
    
    for (const scenario of scenarios) {
      console.log(`\n📋 Scénario: ${scenario.name}`);
      
      try {
        const response = await fetch('http://localhost:3005/api/pdf/delivery-note/7', {
          headers: scenario.headers
        });
        
        if (response.ok) {
          console.log(`   ✅ PDF généré (${response.headers.get('content-length')} bytes)`);
        } else {
          console.log(`   ❌ Erreur: ${response.status} ${response.statusText}`);
        }
      } catch (e) {
        console.log(`   ❌ Erreur de connexion`);
      }
    }
    
    // 3. Vérifier les données directement dans la base
    console.log('\n🗄️ Vérification directe de la base de données...');
    
    // Import du client Supabase
    const { supabaseAdmin } = await import('./src/supabaseClient.js');
    
    const { data: dbData, error: dbError } = await supabaseAdmin.rpc('get_company_info', {
      p_tenant: '2025_bu01'
    });
    
    if (dbError) {
      console.log('❌ Erreur base de données:', dbError.message);
    } else if (dbData && dbData.length > 0) {
      console.log('✅ Données dans la base:');
      console.log(`   Raison sociale: ${dbData[0].raison_sociale}`);
      console.log(`   Adresse: ${dbData[0].adresse}`);
      console.log(`   Téléphone: ${dbData[0].tel_fixe}`);
    }
    
    // 4. Tester le service CompanyService directement
    console.log('\n🏢 Test du CompanyService...');
    
    try {
      const { CompanyService } = await import('./src/services/companyService.js');
      
      // Vider le cache d'abord
      CompanyService.clearCache('2025_bu01');
      
      // Récupérer les données fraîches
      const companyInfo = await CompanyService.getCompanyInfo('2025_bu01');
      
      console.log('✅ CompanyService retourne:');
      console.log(`   Nom: ${companyInfo.name}`);
      console.log(`   Adresse: ${companyInfo.address}`);
      console.log(`   Téléphone: ${companyInfo.phone}`);
      
      if (companyInfo.name === 'ETS BENAMAR BOUZID MENOUAR') {
        console.log('✅ Les bonnes données sont disponibles côté serveur !');
        console.log('   → Le problème vient du frontend ou du passage du tenant');
      } else {
        console.log('❌ Le serveur utilise encore les anciennes données');
        console.log('   → Problème de cache ou de base de données');
      }
      
    } catch (e) {
      console.log('❌ Erreur CompanyService:', e.message);
    }
    
    console.log('\n💡 DIAGNOSTIC ET SOLUTIONS');
    console.log('==========================');
    
    console.log('\n🔍 Vérifications à faire:');
    console.log('1. Le frontend passe-t-il bien X-Tenant: 2025_bu01 ?');
    console.log('2. Le middleware tenant fonctionne-t-il ?');
    console.log('3. Les données sont-elles bien dans 2025_bu01.activite ?');
    
    console.log('\n🛠️ Solutions possibles:');
    console.log('1. Vérifier le code frontend qui génère les PDFs');
    console.log('2. Ajouter des logs dans le middleware tenant');
    console.log('3. Forcer le tenant dans le code temporairement');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
};

debugTenantIssue();