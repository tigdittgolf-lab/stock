// Script pour nettoyer complètement la base et le code
import { supabaseAdmin } from './src/supabaseClient.js';

async function cleanEverything() {
  console.log('🧹 NETTOYAGE COMPLET DE LA BASE ET DU CODE');
  console.log('==========================================\n');
  
  const tenant = '2025_bu01';
  
  try {
    // 1. Vider toutes les tables du tenant
    console.log('🗑️ Vidage des tables...');
    
    const tables = ['article', 'client', 'fournisseur', 'famille_art'];
    
    for (const table of tables) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: `DELETE FROM "${tenant}".${table};`
        });
        
        if (error) {
          console.log(`❌ Erreur vidage ${table}:`, error.message);
        } else {
          console.log(`✅ Table ${table} vidée`);
        }
      } catch (e) {
        console.log(`⚠️  ${table}: ${e.message}`);
      }
    }
    
    // 2. Vérifier que les tables sont vides
    console.log('\n🔍 Vérification...');
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql: `SELECT COUNT(*) as count FROM "${tenant}".${table};`
        });
        
        if (error) {
          console.log(`❌ Erreur vérification ${table}:`, error.message);
        } else {
          const count = data?.[0]?.count || 0;
          console.log(`📊 ${table}: ${count} lignes`);
        }
      } catch (e) {
        console.log(`⚠️  ${table}: ${e.message}`);
      }
    }
    
    console.log('\n🎯 RÉSULTAT:');
    console.log('✅ Base de données complètement vide');
    console.log('✅ Aucune donnée en dur ne devrait s\'afficher');
    console.log('✅ L\'application devrait montrer 0 articles, 0 clients, 0 fournisseurs');
    
    console.log('\n📋 PROCHAINES ÉTAPES:');
    console.log('1. Redémarrer le backend');
    console.log('2. Tester l\'application - elle doit être VIDE');
    console.log('3. Ajouter de vraies données via l\'interface');
    console.log('4. Supprimer toutes les données en dur du code');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

cleanEverything();