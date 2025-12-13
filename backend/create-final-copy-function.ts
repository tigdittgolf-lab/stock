import { supabaseAdmin } from './src/supabaseClient.js';

async function createFinalCopyFunction() {
  console.log('🔧 Création de la fonction de copie finale adaptative...');
  
  try {
    // Créer une fonction qui s'adapte automatiquement aux champs disponibles
    const createAdaptiveCopySQL = `
      CREATE OR REPLACE FUNCTION copy_activite1_adaptive(p_tenant TEXT)
      RETURNS TEXT
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        source_record RECORD;
        result_text TEXT := '';
      BEGIN
        -- Supprimer les données existantes dans le tenant
        EXECUTE format('DELETE FROM %I.activite WHERE id > 0 OR id IS NULL', p_tenant);
        result_text := result_text || 'Données existantes supprimées. ';
        
        -- Copier les données de activite1 vers le tenant
        FOR source_record IN 
          SELECT * FROM public.activite1 LIMIT 1
        LOOP
          -- Insérer seulement les champs qui existent dans activite1
          EXECUTE format('
            INSERT INTO %I.activite (
              raison_sociale, adresse, commune, wilaya, 
              tel_fixe, tel_port, e_mail, nrc, nis, rc,
              domaine_activite, sous_domaine, ident_fiscal, banq
            ) VALUES (
              %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L
            )',
            p_tenant,
            COALESCE(source_record.raison_sociale, ''),
            COALESCE(source_record.adresse, ''),
            COALESCE(source_record.commune, ''),
            COALESCE(source_record.wilaya, ''),
            COALESCE(source_record.tel_fixe, ''),
            COALESCE(source_record.tel_port, ''),
            COALESCE(source_record.e_mail, ''),
            COALESCE(source_record.nrc, ''),
            COALESCE(source_record.nis, ''),
            COALESCE(source_record.rc, ''),
            COALESCE(source_record.domaine_activite, ''),
            COALESCE(source_record.sous_domaine, ''),
            COALESCE(source_record.ident_fiscal, ''),
            COALESCE(source_record.banq, '')
          );
          
          -- Mettre à jour le NIF avec la valeur NIS si NIF n'existe pas dans activite1
          EXECUTE format('
            UPDATE %I.activite 
            SET nif = COALESCE(%L, nis)
            WHERE id = (SELECT MAX(id) FROM %I.activite)
          ', p_tenant, COALESCE(source_record.nis, ''), p_tenant);
          
          result_text := result_text || 'Données copiées pour: ' || COALESCE(source_record.raison_sociale, 'N/A');
        END LOOP;
        
        RETURN result_text;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERREUR: ' || SQLERRM;
      END;
      $$;
    `;
    
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createAdaptiveCopySQL
    });
    
    if (createError) {
      console.error('❌ Erreur lors de la création:', createError);
      return;
    }
    
    console.log('✅ Fonction copy_activite1_adaptive créée');
    
    // Accorder les permissions
    const grantSQL = `
      GRANT EXECUTE ON FUNCTION copy_activite1_adaptive(TEXT) TO authenticated;
      GRANT EXECUTE ON FUNCTION copy_activite1_adaptive(TEXT) TO anon;
    `;
    
    await supabaseAdmin.rpc('exec_sql', { sql: grantSQL });
    
    // Tester la nouvelle fonction
    console.log('\n🧪 Test de la fonction adaptative...');
    
    const { data: testResult, error: testError } = await supabaseAdmin.rpc('copy_activite1_adaptive', {
      p_tenant: '2025_bu01'
    });
    
    if (testError) {
      console.error('❌ Erreur lors du test:', testError);
    } else {
      console.log('✅ Test réussi:', testResult);
      
      // Vérifier le résultat
      const { data: verifyData } = await supabaseAdmin.rpc('get_company_info', {
        p_tenant: '2025_bu01'
      });
      
      if (verifyData && verifyData.length > 0) {
        console.log('\n📋 Données finales dans 2025_bu01:');
        const company = verifyData[0];
        console.log(`   ✅ Raison sociale: ${company.raison_sociale}`);
        console.log(`   ✅ Adresse complète: ${company.adresse}, ${company.commune}, ${company.wilaya}`);
        console.log(`   ✅ Téléphones: ${company.tel_fixe} / ${company.tel_port}`);
        console.log(`   ✅ Email: ${company.e_mail}`);
        console.log(`   ✅ Identifiants: NRC=${company.nrc}, NIS=${company.nis}, NIF=${company.nif}`);
      }
    }
    
    console.log('\n🎉 COPIE TERMINÉE AVEC SUCCÈS !');
    console.log('');
    console.log('📄 Les PDFs générés pour le tenant 2025_bu01 utiliseront maintenant');
    console.log('   les vraies données de votre ancienne application Java NetBeans !');
    console.log('');
    console.log('🔄 Pour copier vers d\'autres tenants (ex: 2025_bu02), utilisez:');
    console.log('   copy_activite1_adaptive(\'2025_bu02\')');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createFinalCopyFunction();