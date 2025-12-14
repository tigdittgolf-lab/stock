// Script pour identifier et corriger toutes les données en dur dans l'application
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

async function fixAllHardcodedData() {
  console.log('🔍 RECHERCHE DE TOUTES LES DONNÉES EN DUR');
  console.log('=========================================\n');
  
  // Rechercher tous les fichiers TypeScript dans les routes
  const files = await glob('src/routes/*.ts');
  
  const hardcodedPatterns = [
    'client001',
    'FOURNISSEUR 1',
    'lampe 12v',
    'drog1',
    'realDatabaseData',
    'realClientData',
    'realSupplierData'
  ];
  
  for (const file of files) {
    console.log(`\n📄 Analyse: ${file}`);
    
    try {
      const content = readFileSync(file, 'utf8');
      
      let hasHardcodedData = false;
      
      for (const pattern of hardcodedPatterns) {
        if (content.includes(pattern)) {
          console.log(`   ❌ Trouvé: "${pattern}"`);
          hasHardcodedData = true;
        }
      }
      
      if (!hasHardcodedData) {
        console.log('   ✅ Aucune donnée en dur détectée');
      }
      
    } catch (error) {
      console.error(`   ❌ Erreur lecture: ${error.message}`);
    }
  }
  
  console.log('\n🎯 RECOMMANDATIONS:');
  console.log('===================');
  console.log('1. Créer les fonctions RPC dans Supabase');
  console.log('2. Remplacer toutes les données en dur par des appels RPC');
  console.log('3. Vider les tables et ajouter de vraies données');
  console.log('4. Tester chaque endpoint individuellement');
  
  console.log('\n📋 FONCTIONS RPC NÉCESSAIRES:');
  console.log('- get_articles_by_tenant(p_tenant TEXT)');
  console.log('- get_clients_by_tenant(p_tenant TEXT)');
  console.log('- get_suppliers_by_tenant(p_tenant TEXT)');
  console.log('- exec_sql(sql TEXT)');
}

fixAllHardcodedData();