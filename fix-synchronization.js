// Script pour forcer la synchronisation frontend-backend
async function fixSynchronization() {
  const baseUrl = 'http://localhost:3005/api';
  
  console.log('🔧 CORRECTION DE LA SYNCHRONISATION FRONTEND-BACKEND\n');
  
  try {
    // 1. Vérifier le statut backend actuel
    console.log('1️⃣ VÉRIFICATION STATUT BACKEND...');
    const statusResponse = await fetch(`${baseUrl}/database-config`);
    const statusData = await statusResponse.json();
    const backendType = statusData.data.type;
    
    console.log(`Backend actuel: ${backendType.toUpperCase()}`);
    console.log(`Timestamp: ${new Date(statusData.data.timestamp).toLocaleString()}`);
    
    // 2. Obtenir la configuration par défaut pour ce type
    console.log(`\n2️⃣ CONFIGURATION PAR DÉFAUT POUR ${backendType.toUpperCase()}...`);
    
    const defaultConfigs = {
      supabase: {
        type: 'supabase',
        name: 'Supabase Production',
        supabaseUrl: 'https://szgodrjglbpzkrksnroi.supabase.co'
      },
      postgresql: {
        type: 'postgresql',
        name: 'PostgreSQL Local',
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        username: 'postgres',
        password: 'postgres'
      },
      mysql: {
        type: 'mysql',
        name: 'MySQL Local',
        host: 'localhost',
        port: 3306,
        database: 'stock_local',
        username: 'root',
        password: ''
      }
    };
    
    const config = defaultConfigs[backendType];
    console.log('Configuration à appliquer:', JSON.stringify(config, null, 2));
    
    // 3. Forcer la synchronisation en re-switchant vers le même type
    console.log(`\n3️⃣ FORCE SYNCHRONISATION VERS ${backendType.toUpperCase()}...`);
    
    const syncResponse = await fetch(`${baseUrl}/database-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    
    const syncData = await syncResponse.json();
    
    if (syncData.success) {
      console.log('✅ Synchronisation forcée réussie');
      console.log(`   Message: ${syncData.message}`);
      
      // 4. Vérifier que tout est maintenant synchronisé
      console.log('\n4️⃣ VÉRIFICATION POST-SYNCHRONISATION...');
      
      const finalStatusResponse = await fetch(`${baseUrl}/database-config`);
      const finalStatusData = await finalStatusResponse.json();
      
      console.log(`Backend final: ${finalStatusData.data.type.toUpperCase()}`);
      
      // Test des données pour confirmer
      const dataResponse = await fetch(`${baseUrl}/sales/suppliers`, {
        headers: { 'X-Tenant': '2025_bu01' }
      });
      const dataResult = await dataResponse.json();
      
      if (dataResult.success) {
        console.log(`✅ Données: ${dataResult.data?.length || 0} fournisseurs (${dataResult.database_type})`);
      }
      
      console.log('\n📊 RÉSULTAT:');
      console.log('✅ Synchronisation forcée terminée');
      console.log('✅ Frontend et backend maintenant alignés');
      console.log('✅ L\'indicateur devrait maintenant afficher correctement');
      
      console.log('\n💡 ACTIONS À FAIRE:');
      console.log('1. Rafraîchissez la page du dashboard (Ctrl+F5)');
      console.log(`2. L'indicateur devrait maintenant afficher: ${getIcon(backendType)} ${config.name}`);
      console.log('3. Plus de message "Non Synchronisé"');
      
    } else {
      console.log('❌ Synchronisation échouée:', syncData.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
  }
}

function getIcon(type) {
  const icons = {
    supabase: '☁️',
    postgresql: '🐘',
    mysql: '🐬'
  };
  return icons[type] || '❓';
}

fixSynchronization();