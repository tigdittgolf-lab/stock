import { supabaseAdmin } from './src/supabaseClient.js';

async function testCopyFixed() {
  console.log('🧪 Test de la copie corrigée depuis activite1...');
  
  try {
    // Utiliser la fonction de copie corrigée
    console.log('\n🔄 Copie des données de activite1 vers 2025_bu01...');
    
    const { data: copyResult, error: copyError } = await supabaseAdmin.rpc('copy_activite1_fixed', {
      p_tenant: '2025_bu01'
    });
    
    if (copyError) {
      console.error('❌ Erreur lors de la copie:', copyError);
      return;
    }
    
    console.log('✅ Résultat de la copie:', copyResult);
    
    // Vérifier la copie avec la fonction get_company_info
    console.log('\n🔍 Vérification des données copiées...');
    
    const { data: verifyData, error: verifyError } = await supabaseAdmin.rpc('get_company_info', {
      p_tenant: '2025_bu01'
    });
    
    if (verifyError) {
      console.error('❌ Erreur lors de la vérification:', verifyError);
    } else if (verifyData && verifyData.length > 0) {
      console.log('✅ Vérification réussie - Données de votre ancienne application NetBeans:');
      const company = verifyData[0];
      
      console.log('\n📋 Informations d\'entreprise copiées:');
      console.log(`   Raison sociale: ${company.raison_sociale || 'N/A'}`);
      console.log(`   Domaine d'activité: ${company.domaine_activite || 'N/A'}`);
      console.log(`   Sous-domaine: ${company.sous_domaine || 'N/A'}`);
      console.log(`   Adresse: ${company.adresse || 'N/A'}`);
      console.log(`   Commune: ${company.commune || 'N/A'}`);
      console.log(`   Wilaya: ${company.wilaya || 'N/A'}`);
      console.log(`   Téléphone fixe: ${company.tel_fixe || 'N/A'}`);
      console.log(`   Téléphone portable: ${company.tel_port || 'N/A'}`);
      console.log(`   Email: ${company.e_mail || 'N/A'}`);
      console.log(`   NRC: ${company.nrc || 'N/A'}`);
      console.log(`   NIS: ${company.nis || 'N/A'}`);
      console.log(`   NIF: ${company.nif || 'N/A'}`);
      console.log(`   RC: ${company.rc || 'N/A'}`);
      console.log(`   Banque: ${company.banq || 'N/A'}`);
      
      // Tester la génération PDF avec les nouvelles données
      console.log('\n📄 Test de génération PDF avec les nouvelles données...');
      
      try {
        const pdfResponse = await fetch('http://localhost:3005/api/pdf/delivery-note/4', {
          headers: {
            'X-Tenant': '2025_bu01'
          }
        });
        
        if (pdfResponse.ok) {
          console.log('✅ PDF généré avec succès avec les données de NetBeans !');
          console.log(`   Taille du PDF: ${pdfResponse.headers.get('content-length')} bytes`);
        } else {
          console.log(`⚠️ Erreur PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
        }
      } catch (pdfError) {
        console.log('⚠️ Impossible de tester le PDF (serveur non démarré?)');
      }
      
    } else {
      console.log('⚠️ Aucune donnée trouvée après la copie');
    }
    
    console.log('\n🎉 Copie terminée !');
    console.log('Les données de votre ancienne application Java NetBeans');
    console.log('sont maintenant dans le schéma 2025_bu01 et seront utilisées');
    console.log('pour générer les PDFs avec les bonnes informations d\'entreprise.');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testCopyFixed();