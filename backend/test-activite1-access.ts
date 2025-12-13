import { supabaseAdmin } from './src/supabaseClient.js';

async function testActivite1Access() {
  console.log('🧪 Test d\'accès aux données de activite1...');
  
  try {
    // Tester l'accès aux données de activite1
    console.log('\n📊 Récupération des données de activite1...');
    
    const { data, error } = await supabaseAdmin.rpc('get_activite1_data');
    
    if (error) {
      console.error('❌ Erreur lors de l\'accès à activite1:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️ Aucune donnée trouvée dans activite1');
      return;
    }
    
    console.log(`✅ ${data.length} ligne(s) trouvée(s) dans activite1`);
    
    // Afficher les données
    data.forEach((row, index) => {
      console.log(`\n📋 Ligne ${index + 1}:`);
      Object.keys(row).forEach(key => {
        if (row[key] !== null && row[key] !== '' && key !== 'id') {
          console.log(`   ${key}: ${row[key]}`);
        }
      });
    });
    
    // Maintenant copier vers 2025_bu01
    console.log('\n🔄 Copie des données vers 2025_bu01...');
    
    const { data: copyResult, error: copyError } = await supabaseAdmin.rpc('copy_activite1_to_tenant', {
      p_tenant: '2025_bu01'
    });
    
    if (copyError) {
      console.error('❌ Erreur lors de la copie:', copyError);
      return;
    }
    
    console.log('✅ Résultat de la copie:', copyResult);
    
    // Vérifier la copie
    console.log('\n🔍 Vérification de la copie...');
    
    const { data: verifyData, error: verifyError } = await supabaseAdmin.rpc('get_company_info', {
      p_tenant: '2025_bu01'
    });
    
    if (verifyError) {
      console.error('❌ Erreur lors de la vérification:', verifyError);
    } else if (verifyData && verifyData.length > 0) {
      console.log('✅ Vérification réussie - Nouvelles données dans 2025_bu01:');
      const company = verifyData[0];
      console.log(`   Raison sociale: ${company.raison_sociale}`);
      console.log(`   Domaine d'activité: ${company.domaine_activite}`);
      console.log(`   Sous-domaine: ${company.sous_domaine}`);
      console.log(`   Adresse: ${company.adresse}`);
      console.log(`   Commune: ${company.commune}`);
      console.log(`   Wilaya: ${company.wilaya}`);
      console.log(`   Téléphone fixe: ${company.tel_fixe}`);
      console.log(`   Téléphone portable: ${company.tel_port}`);
      console.log(`   Email: ${company.e_mail}`);
      console.log(`   NRC: ${company.nrc}`);
      console.log(`   NIS: ${company.nis}`);
      console.log(`   NIF: ${company.nif}`);
      console.log(`   RC: ${company.rc}`);
    } else {
      console.log('⚠️ Aucune donnée trouvée après la copie');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testActivite1Access();