import { supabaseAdmin } from './src/supabaseClient.js';

async function manualTableComparison() {
  console.log('🔍 COMPARAISON MANUELLE DES TABLES');
  console.log('==================================\n');
  
  try {
    // Utiliser la fonction get_company_info existante pour voir la structure de destination
    console.log('📋 Analyse de la table DESTINATION via get_company_info...');
    
    const { data: destSample, error: destError } = await supabaseAdmin.rpc('get_company_info', {
      p_tenant: '2025_bu01'
    });
    
    if (destError) {
      console.error('❌ Erreur destination:', destError);
      return;
    }
    
    if (destSample && destSample.length > 0) {
      console.log('✅ Structure de "2025_bu01".activite (basée sur get_company_info):');
      const destFields = Object.keys(destSample[0]);
      destFields.forEach((field, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${field}`);
      });
    }
    
    // Maintenant essayons d'accéder à activite1 avec une fonction simple
    console.log('\n📋 Test d\'accès à public.activite1...');
    
    // Créer une fonction très simple pour tester activite1
    const createTestSQL = `
      CREATE OR REPLACE FUNCTION test_activite1_access()
      RETURNS TEXT
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        count_result INTEGER;
        sample_name TEXT;
      BEGIN
        -- Compter les lignes
        SELECT COUNT(*) INTO count_result FROM public.activite1;
        
        -- Essayer de récupérer un nom
        SELECT raison_sociale INTO sample_name FROM public.activite1 LIMIT 1;
        
        RETURN 'COUNT:' || count_result || '|SAMPLE:' || COALESCE(sample_name, 'NULL');
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR:' || SQLERRM;
      END;
      $$;
    `;
    
    await supabaseAdmin.rpc('exec_sql', { sql: createTestSQL });
    await supabaseAdmin.rpc('exec_sql', { 
      sql: 'GRANT EXECUTE ON FUNCTION test_activite1_access() TO authenticated, anon;' 
    });
    
    // Attendre un peu pour le cache
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: testResult, error: testError } = await supabaseAdmin.rpc('test_activite1_access');
    
    if (testError) {
      console.error('❌ Erreur test activite1:', testError);
    } else {
      console.log('✅ Résultat test activite1:', testResult);
      
      if (testResult && testResult.includes('COUNT:')) {
        const parts = testResult.split('|');
        const countPart = parts.find(p => p.startsWith('COUNT:'))?.replace('COUNT:', '');
        const samplePart = parts.find(p => p.startsWith('SAMPLE:'))?.replace('SAMPLE:', '');
        
        console.log(`   Nombre de lignes: ${countPart}`);
        console.log(`   Échantillon raison_sociale: ${samplePart}`);
      }
    }
    
    // Afficher les structures connues manuellement
    console.log('\n📊 STRUCTURES CONNUES');
    console.log('=====================');
    
    console.log('\n📋 Colonnes dans "2025_bu01".activite (structure complète):');
    const knownDestColumns = [
      'id', 'code_activite', 'domaine_activite', 'sous_domaine', 'raison_sociale',
      'adresse', 'commune', 'wilaya', 'tel_fixe', 'tel_port', 'nrc', 'nis', 'nart',
      'ident_fiscal', 'banq', 'entete_bon', 'e_mail', 'nom_entreprise', 'telephone',
      'email', 'nif', 'rc', 'logo_url', 'slogan', 'created_at', 'updated_at'
    ];
    
    knownDestColumns.forEach((col, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${col}`);
    });
    
    console.log('\n📋 Colonnes probables dans public.activite1 (basé sur NetBeans):');
    const probableSourceColumns = [
      'raison_sociale', 'adresse', 'commune', 'wilaya', 'tel_fixe', 'tel_port',
      'e_mail', 'nrc', 'nis', 'domaine_activite', 'sous_domaine', 'ident_fiscal', 'banq'
    ];
    
    probableSourceColumns.forEach((col, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${col}`);
    });
    
    console.log('\n❓ QUESTIONS POUR VOUS');
    console.log('=====================');
    
    console.log('\n1. 📝 Pouvez-vous me confirmer quelles colonnes existent EXACTEMENT dans votre table public.activite1 ?');
    console.log('   (Vous pouvez les voir dans votre interface Supabase ou pgAdmin)');
    
    console.log('\n2. 🔄 Pour les colonnes qui existent dans "2025_bu01".activite mais pas dans activite1:');
    
    const potentialMissingColumns = [
      { name: 'code_activite', suggestion: 'Utiliser une valeur par défaut comme "BU01" ?' },
      { name: 'nart', suggestion: 'Mapper depuis "nis" ou laisser NULL ?' },
      { name: 'entete_bon', suggestion: 'Laisser NULL ou utiliser raison_sociale ?' },
      { name: 'nom_entreprise', suggestion: 'Mapper depuis "raison_sociale" ?' },
      { name: 'telephone', suggestion: 'Mapper depuis "tel_fixe" ?' },
      { name: 'email', suggestion: 'Mapper depuis "e_mail" ?' },
      { name: 'nif', suggestion: 'Mapper depuis "ident_fiscal" ou "nis" ?' },
      { name: 'rc', suggestion: 'Mapper depuis "nrc" ?' },
      { name: 'logo_url', suggestion: 'Laisser NULL ?' },
      { name: 'slogan', suggestion: 'Laisser NULL ?' }
    ];
    
    potentialMissingColumns.forEach(col => {
      console.log(`   • ${col.name}: ${col.suggestion}`);
    });
    
    console.log('\n3. 🎯 Une fois que vous me donnez ces informations, je créerai la fonction de copie parfaite !');
    
    console.log('\n💡 SUGGESTION');
    console.log('=============');
    console.log('Si vous voulez, vous pouvez me donner directement vos préférences comme:');
    console.log('"code_activite = BU01, nif = nis, rc = nrc, telephone = tel_fixe, email = e_mail, le reste NULL"');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

manualTableComparison();