import { supabaseAdmin } from './src/supabaseClient.js';

async function checkActivite1Direct() {
  console.log('🔍 Vérification directe de la table activite1...');
  
  try {
    // Essayer d'accéder directement à la table activite1
    console.log('\n📋 Tentative d\'accès direct à public.activite1...');
    
    const { data, error } = await supabaseAdmin
      .from('activite1')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Erreur d\'accès direct:', error.message);
      
      // Essayer avec le schéma explicite
      console.log('\n🔄 Tentative avec schéma explicite...');
      
      const { data: data2, error: error2 } = await supabaseAdmin
        .schema('public')
        .from('activite1')
        .select('*')
        .limit(5);
      
      if (error2) {
        console.error('❌ Erreur avec schéma explicite:', error2.message);
        return;
      }
      
      console.log('✅ Accès réussi avec schéma explicite');
      console.log(`   Nombre de lignes trouvées: ${data2?.length || 0}`);
      
      if (data2 && data2.length > 0) {
        console.log('\n📊 Données dans activite1:');
        data2.forEach((row, index) => {
          console.log(`   Ligne ${index + 1}:`);
          Object.keys(row).forEach(key => {
            if (row[key] !== null && row[key] !== '') {
              console.log(`     ${key}: ${row[key]}`);
            }
          });
          console.log('');
        });
      }
      
    } else {
      console.log('✅ Accès direct réussi');
      console.log(`   Nombre de lignes trouvées: ${data?.length || 0}`);
      
      if (data && data.length > 0) {
        console.log('\n📊 Données dans activite1:');
        data.forEach((row, index) => {
          console.log(`   Ligne ${index + 1}:`);
          Object.keys(row).forEach(key => {
            if (row[key] !== null && row[key] !== '') {
              console.log(`     ${key}: ${row[key]}`);
            }
          });
          console.log('');
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkActivite1Direct();