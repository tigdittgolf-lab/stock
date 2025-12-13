import { supabaseAdmin } from './src/supabaseClient.js';

async function createActivite1RPC() {
  console.log('🔧 Création des fonctions RPC pour accéder à activite1...');
  
  try {
    // 1. Créer une fonction RPC pour lire activite1
    console.log('\n📋 Création de la fonction get_activite1_data...');
    
    const createGetFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_activite1_data()
      RETURNS TABLE (
        id INTEGER,
        code_activite TEXT,
        domaine_activite TEXT,
        sous_domaine TEXT,
        raison_sociale TEXT,
        adresse TEXT,
        commune TEXT,
        wilaya TEXT,
        tel_fixe TEXT,
        tel_port TEXT,
        nrc TEXT,
        nis TEXT,
        nart TEXT,
        ident_fiscal TEXT,
        banq TEXT,
        entete_bon TEXT,
        e_mail TEXT,
        nom_entreprise TEXT,
        telephone TEXT,
        email TEXT,
        nif TEXT,
        rc TEXT,
        logo_url TEXT,
        slogan TEXT
      ) 
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY 
        SELECT 
          a.id,
          a.code_activite::TEXT,
          a.domaine_activite::TEXT,
          a.sous_domaine::TEXT,
          a.raison_sociale::TEXT,
          a.adresse::TEXT,
          a.commune::TEXT,
          a.wilaya::TEXT,
          a.tel_fixe::TEXT,
          a.tel_port::TEXT,
          a.nrc::TEXT,
          a.nis::TEXT,
          a.nart::TEXT,
          a.ident_fiscal::TEXT,
          a.banq::TEXT,
          a.entete_bon::TEXT,
          a.e_mail::TEXT,
          a.nom_entreprise::TEXT,
          a.telephone::TEXT,
          a.email::TEXT,
          a.nif::TEXT,
          a.rc::TEXT,
          a.logo_url::TEXT,
          a.slogan::TEXT
        FROM public.activite1 a;
      EXCEPTION
        WHEN OTHERS THEN
          -- Si erreur, retourner une ligne vide pour debug
          RETURN QUERY SELECT 
            0, 'ERROR'::TEXT, SQLERRM::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT;
      END;
      $$;
    `;
    
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createGetFunctionSQL
    });
    
    if (createError) {
      console.error('❌ Erreur lors de la création de get_activite1_data:', createError);
      return;
    }
    
    console.log('✅ Fonction get_activite1_data créée');
    
    // 2. Créer une fonction RPC pour copier les données
    console.log('\n📋 Création de la fonction copy_activite1_to_tenant...');
    
    const createCopyFunctionSQL = `
      CREATE OR REPLACE FUNCTION copy_activite1_to_tenant(p_tenant TEXT)
      RETURNS TEXT
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        source_record RECORD;
        result_text TEXT := '';
      BEGIN
        -- Supprimer les données existantes dans le tenant
        EXECUTE format('DELETE FROM %I.activite', p_tenant);
        result_text := result_text || 'Données existantes supprimées. ';
        
        -- Copier les données de activite1 vers le tenant
        FOR source_record IN 
          SELECT * FROM public.activite1 LIMIT 1
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
            source_record.code_activite,
            source_record.domaine_activite,
            source_record.sous_domaine,
            source_record.raison_sociale,
            source_record.adresse,
            source_record.commune,
            source_record.wilaya,
            source_record.tel_fixe,
            source_record.tel_port,
            source_record.nrc,
            source_record.nis,
            source_record.nart,
            source_record.ident_fiscal,
            source_record.banq,
            source_record.entete_bon,
            source_record.e_mail,
            source_record.nom_entreprise,
            source_record.telephone,
            source_record.email,
            source_record.nif,
            source_record.rc,
            source_record.logo_url,
            source_record.slogan
          );
          
          result_text := result_text || 'Données copiées pour: ' || COALESCE(source_record.raison_sociale, 'N/A');
        END LOOP;
        
        RETURN result_text;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERREUR: ' || SQLERRM;
      END;
      $$;
    `;
    
    const { error: createCopyError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createCopyFunctionSQL
    });
    
    if (createCopyError) {
      console.error('❌ Erreur lors de la création de copy_activite1_to_tenant:', createCopyError);
      return;
    }
    
    console.log('✅ Fonction copy_activite1_to_tenant créée');
    
    // 3. Accorder les permissions
    console.log('\n🔐 Attribution des permissions...');
    
    const grantPermissionsSQL = `
      GRANT EXECUTE ON FUNCTION get_activite1_data() TO authenticated;
      GRANT EXECUTE ON FUNCTION get_activite1_data() TO anon;
      GRANT EXECUTE ON FUNCTION copy_activite1_to_tenant(TEXT) TO authenticated;
      GRANT EXECUTE ON FUNCTION copy_activite1_to_tenant(TEXT) TO anon;
    `;
    
    const { error: grantError } = await supabaseAdmin.rpc('exec_sql', {
      sql: grantPermissionsSQL
    });
    
    if (grantError) {
      console.error('❌ Erreur lors de l\'attribution des permissions:', grantError);
    } else {
      console.log('✅ Permissions accordées');
    }
    
    console.log('\n🎉 Fonctions RPC créées avec succès !');
    console.log('\nVous pouvez maintenant:');
    console.log('1. Tester l\'accès aux données: bun run test-activite1-access.ts');
    console.log('2. Copier les données: bun run copy-from-activite1.ts');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createActivite1RPC();