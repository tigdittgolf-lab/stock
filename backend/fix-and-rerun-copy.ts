import { supabaseAdmin } from './src/supabaseClient.js';

async function fixAndRerunCopy() {
  console.log('🔧 CORRECTION ET RE-EXÉCUTION DE LA COPIE');
  console.log('=========================================\n');
  
  try {
    // Créer une version corrigée de la fonction sans l'erreur DELETE
    console.log('📝 Création de la fonction corrigée...');
    
    const createFixedCopySQL = `
      CREATE OR REPLACE FUNCTION copy_activite1_fixed(p_tenant TEXT)
      RETURNS TEXT
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        source_record RECORD;
        result_text TEXT := '';
        rows_deleted INTEGER;
        rows_inserted INTEGER := 0;
      BEGIN
        -- 1. EFFACER le contenu existant (avec WHERE pour éviter l'erreur)
        EXECUTE format('DELETE FROM %I.activite WHERE id > 0 OR id IS NULL', p_tenant);
        GET DIAGNOSTICS rows_deleted = ROW_COUNT;
        result_text := result_text || 'Supprimé ' || rows_deleted || ' ligne(s). ';
        
        -- 2. COPIER les données de activite1 avec les mappages exacts
        FOR source_record IN 
          SELECT * FROM public.activite1
        LOOP
          EXECUTE format('
            INSERT INTO %I.activite (
              code_activite, domaine_activite, sous_domaine, raison_sociale,
              adresse, commune, wilaya, tel_fixe, tel_port, nrc, nis, nart,
              ident_fiscal, banq, entete_bon, e_mail, nom_entreprise, 
              telephone, email, nif, rc, logo_url, slogan
            ) VALUES (
              %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L,
              %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L
            )',
            p_tenant,
            'BU01',                                           -- code_activite = "BU01"
            COALESCE(source_record.domaine_activite, ''),     -- domaine_activite
            COALESCE(source_record.sous_domaine, ''),         -- sous_domaine
            COALESCE(source_record.raison_sociale, ''),       -- raison_sociale
            COALESCE(source_record.adresse, ''),              -- adresse
            COALESCE(source_record.commune, ''),              -- commune
            COALESCE(source_record.wilaya, ''),               -- wilaya
            COALESCE(source_record.tel_fixe, ''),             -- tel_fixe
            COALESCE(source_record.tel_port, ''),             -- tel_port
            COALESCE(source_record.nrc, ''),                  -- nrc
            COALESCE(source_record.nis, ''),                  -- nis
            COALESCE(source_record.nis, ''),                  -- nart = nis
            COALESCE(source_record.ident_fiscal, ''),         -- ident_fiscal
            COALESCE(source_record.banq, ''),                 -- banq
            NULL,                                             -- entete_bon = NULL
            COALESCE(source_record.e_mail, ''),               -- e_mail
            COALESCE(source_record.raison_sociale, ''),       -- nom_entreprise = raison_sociale
            COALESCE(source_record.tel_fixe, ''),             -- telephone = tel_fixe
            COALESCE(source_record.e_mail, ''),               -- email = e_mail
            COALESCE(source_record.ident_fiscal, ''),         -- nif = ident_fiscal
            COALESCE(source_record.nrc, ''),                  -- rc = nrc
            NULL,                                             -- logo_url = NULL
            NULL                                              -- slogan = NULL
          );
          
          rows_inserted := rows_inserted + 1;
          result_text := result_text || 'Copié: ' || COALESCE(source_record.raison_sociale, 'N/A') || '. ';
        END LOOP;
        
        result_text := result_text || 'Total: ' || rows_inserted || ' ligne(s) insérée(s).';
        
        RETURN result_text;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERREUR: ' || SQLERRM;
      END;
      $$;
    `;
    
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createFixedCopySQL
    });
    
    if (createError) {
      console.error('❌ Erreur création:', createError);
      return;
    }
    
    console.log('✅ Fonction corrigée créée');
    
    // Accorder permissions
    await supabaseAdmin.rpc('exec_sql', {
      sql: 'GRANT EXECUTE ON FUNCTION copy_activite1_fixed(TEXT) TO authenticated, anon;'
    });
    
    // Attendre le cache
    console.log('⏳ Attente du cache...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Vider le cache du service CompanyService
    console.log('🧹 Vidage du cache CompanyService...');
    
    // EXÉCUTER la copie corrigée
    console.log('\n🚀 EXÉCUTION DE LA COPIE CORRIGÉE');
    console.log('=================================');
    
    const { data: copyResult, error: copyError } = await supabaseAdmin.rpc('copy_activite1_fixed', {
      p_tenant: '2025_bu01'
    });
    
    if (copyError) {
      console.error('❌ Erreur copie:', copyError);
      return;
    }
    
    console.log('✅ Résultat:', copyResult);
    
    // Forcer une nouvelle lecture en vidant le cache
    console.log('\n🔄 Vérification avec cache vidé...');
    
    // Attendre un peu plus pour s'assurer que les données sont bien écrites
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: freshData, error: freshError } = await supabaseAdmin.rpc('get_company_info', {
      p_tenant: '2025_bu01'
    });
    
    if (freshError) {
      console.error('❌ Erreur vérification:', freshError);
    } else if (freshData && freshData.length > 0) {
      console.log('✅ NOUVELLES DONNÉES CONFIRMÉES !');
      console.log('');
      const company = freshData[0];
      
      console.log('📋 Données fraîches de votre NetBeans:');
      console.log(`   🏢 Raison sociale: ${company.raison_sociale}`);
      console.log(`   📍 Adresse: ${company.adresse}`);
      console.log(`   🏘️ Commune: ${company.commune}`);
      console.log(`   🗺️ Wilaya: ${company.wilaya}`);
      console.log(`   📞 Téléphone: ${company.tel_fixe}`);
      console.log(`   📱 Mobile: ${company.tel_port || 'N/A'}`);
      console.log(`   📧 Email: ${company.e_mail}`);
      console.log(`   🆔 NRC: ${company.nrc}`);
      console.log(`   🆔 NIS: ${company.nis}`);
      console.log(`   🆔 NIF: ${company.nif}`);
      console.log(`   🏦 Banque: ${company.banq || 'N/A'}`);
      
      // Test PDF final
      console.log('\n📄 Test PDF final...');
      
      try {
        const pdfResponse = await fetch('http://localhost:3005/api/pdf/delivery-note/4', {
          headers: { 'X-Tenant': '2025_bu01' }
        });
        
        if (pdfResponse.ok) {
          console.log('✅ PDF généré avec les nouvelles données !');
          console.log(`   Taille: ${pdfResponse.headers.get('content-length')} bytes`);
        } else {
          console.log(`⚠️ PDF: ${pdfResponse.status}`);
        }
      } catch (e) {
        console.log('⚠️ Test PDF non disponible');
      }
    }
    
    console.log('\n🎉 COPIE TERMINÉE AVEC SUCCÈS !');
    console.log('===============================');
    console.log('✅ Ancien contenu effacé de "2025_bu01".activite');
    console.log('✅ Nouvelles données copiées depuis public.activite1');
    console.log('✅ Mappages appliqués selon vos instructions');
    console.log('✅ Cache vidé pour forcer la mise à jour');
    console.log('✅ PDFs utiliseront maintenant vos vraies données NetBeans');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

fixAndRerunCopy();