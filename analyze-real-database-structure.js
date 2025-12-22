// Analyse directe de la structure réelle de Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeRealStructure() {
  console.log('🔍 ANALYSE DIRECTE DE LA BASE SUPABASE');
  console.log('=====================================\n');
  
  const testSchema = '2025_bu01';
  
  try {
    // 1. Lister toutes les tables réelles dans le schéma
    console.log('=== DÉCOUVERTE DES TABLES RÉELLES ===');
    
    // Essayer différentes approches pour lister les tables
    const possibleTables = [
      'article', 'client', 'fournisseur', 'famille_art', 'activite',
      'bl', 'facture', 'proforma', 'detail_bl', 'detail_fact', 'detail_proforma',
      'users', 'settings', 'stock', 'mouvement_stock', 'inventaire',
      'commande', 'detail_commande', 'bon_commande', 'detail_bon_commande'
    ];
    
    const existingTables = [];
    
    for (const tableName of possibleTables) {
      try {
        // Tester l'existence de la table avec une requête COUNT
        const { data, error } = await supabase
          .from(`${testSchema}_${tableName}`)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          existingTables.push(tableName);
          console.log(`✅ Table trouvée: ${tableName}`);
        }
      } catch (e) {
        // Table n'existe pas, continuer
      }
    }
    
    console.log(`\n📊 TOTAL: ${existingTables.length} tables trouvées\n`);
    
    // 2. Pour chaque table existante, analyser la structure et les données
    for (const tableName of existingTables) {
      console.log(`=== ANALYSE TABLE: ${tableName} ===`);
      
      try {
        // Récupérer quelques enregistrements pour analyser la structure
        const { data, error, count } = await supabase
          .from(`${testSchema}_${tableName}`)
          .select('*', { count: 'exact' })
          .limit(3);
        
        if (error) {
          console.log(`❌ Erreur lecture ${tableName}: ${error.message}`);
          continue;
        }
        
        console.log(`📈 Nombre d'enregistrements: ${count || 0}`);
        
        if (data && data.length > 0) {
          console.log('🔧 Structure (colonnes):');
          const columns = Object.keys(data[0]);
          columns.forEach(col => {
            const value = data[0][col];
            const type = typeof value;
            console.log(`  - ${col}: ${type} (exemple: ${JSON.stringify(value)})`);
          });
          
          console.log('\n📋 Échantillon de données:');
          data.forEach((row, index) => {
            console.log(`  Enregistrement ${index + 1}:`, JSON.stringify(row, null, 2));
          });
        } else {
          console.log('📭 Table vide');
        }
        
        console.log(''); // Ligne vide pour séparation
        
      } catch (error) {
        console.log(`💥 Erreur analyse ${tableName}:`, error.message);
      }
    }
    
    // 3. Tester les schémas disponibles
    console.log('=== SCHÉMAS DISPONIBLES ===');
    const schemas = ['2025_bu01', '2026_bu01', '2024_bu01', '2025_bu02'];
    
    for (const schema of schemas) {
      console.log(`\n--- Schéma: ${schema} ---`);
      let schemaHasData = false;
      
      for (const tableName of existingTables.slice(0, 3)) { // Tester les 3 premières tables
        try {
          const { count } = await supabase
            .from(`${schema}_${tableName}`)
            .select('*', { count: 'exact', head: true });
          
          if (count && count > 0) {
            console.log(`  ${tableName}: ${count} enregistrements`);
            schemaHasData = true;
          }
        } catch (e) {
          // Ignorer les erreurs
        }
      }
      
      if (!schemaHasData) {
        console.log(`  ⚠️ Schéma vide ou inexistant`);
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

analyzeRealStructure();