// Script pour configurer les informations d'entreprise multi-tenant
import { supabaseAdmin } from './src/supabaseClient.js';
import { SchemaManager } from './src/utils/schemaManager.js';

async function setupMultiTenantCompany() {
  console.log('🏢 Setting up multi-tenant company info...\n');

  try {
    // 1. Créer la nouvelle fonction RPC multi-tenant
    console.log('1️⃣ Creating multi-tenant get_company_info RPC function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_company_info(p_tenant TEXT)
      RETURNS TABLE (
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
        e_mail TEXT,
        nif TEXT,
        rc TEXT
      ) 
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      BEGIN
        -- Exécuter la requête dynamiquement pour le schéma tenant spécifié
        RETURN QUERY EXECUTE format('
          SELECT 
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
            a.e_mail::TEXT,
            a.nif::TEXT,
            a.rc::TEXT
          FROM %I.activite a
          ORDER BY a.created_at DESC
          LIMIT 1
        ', p_tenant);
      EXCEPTION
        WHEN OTHERS THEN
          -- Si le schéma ou la table n'existe pas, retourner des valeurs par défaut
          RETURN QUERY SELECT 
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT;
      END;
      $$;
    `;

    const { error: functionError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createFunctionSQL
    });

    if (functionError) {
      console.error('❌ Error creating RPC function:', functionError);
      return;
    }

    console.log('✅ Multi-tenant RPC function created successfully');

    // 2. Accorder les permissions
    console.log('\n2️⃣ Granting permissions...');
    
    const grantPermissionsSQL = `
      GRANT EXECUTE ON FUNCTION get_company_info(TEXT) TO authenticated;
      GRANT EXECUTE ON FUNCTION get_company_info(TEXT) TO anon;
    `;

    const { error: permError } = await supabaseAdmin.rpc('exec_sql', {
      sql: grantPermissionsSQL
    });

    if (permError) {
      console.error('❌ Error granting permissions:', permError);
    } else {
      console.log('✅ Permissions granted successfully');
    }

    // 3. Créer les tables activite dans les schémas existants
    console.log('\n3️⃣ Creating activite tables in existing tenant schemas...');
    
    const tenants = ['2025_bu01', '2025_bu02', '2024_bu01'];
    
    for (const tenant of tenants) {
      console.log(`   Creating activite table for ${tenant}...`);
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS "${tenant}".activite (
          id SERIAL PRIMARY KEY,
          code_activite VARCHAR(20),
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
          slogan TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const { error: tableError } = await supabaseAdmin.rpc('exec_sql', {
        sql: createTableSQL
      });

      if (tableError) {
        console.warn(`   ⚠️ Warning creating table for ${tenant}:`, tableError.message);
      } else {
        console.log(`   ✅ Table created for ${tenant}`);
      }
    }

    // 4. Insérer des données d'exemple pour chaque BU
    console.log('\n4️⃣ Inserting sample company data for each BU...');
    
    const sampleData = [
      {
        tenant: '2025_bu01',
        data: {
          code_activite: 'BU01',
          domaine_activite: 'Commerce de Détail',
          sous_domaine: 'Vente d\'Articles Électroniques',
          raison_sociale: 'ÉLECTRO PLUS SARL',
          adresse: '15 Rue Didouche Mourad',
          commune: 'Alger Centre',
          wilaya: 'Alger',
          tel_fixe: '+213 21 63 45 78',
          tel_port: '+213 55 12 34 56',
          nrc: '16/00-1234567B16',
          nis: '000016001234567',
          nart: '16001234567',
          ident_fiscal: '000016001234567',
          nif: '000016001234567',
          rc: '16/00-1234567B16',
          banq: 'CCP: 1234567 - Clé: 89',
          e_mail: 'contact@electroplus.dz'
        }
      },
      {
        tenant: '2025_bu02',
        data: {
          code_activite: 'BU02',
          domaine_activite: 'Commerce de Gros',
          sous_domaine: 'Distribution Alimentaire',
          raison_sociale: 'DISTRIB FOOD SPA',
          adresse: '45 Boulevard Colonel Amirouche',
          commune: 'Oran Centre',
          wilaya: 'Oran',
          tel_fixe: '+213 41 33 22 11',
          tel_port: '+213 66 77 88 99',
          nrc: '31/00-7654321B31',
          nis: '000031007654321',
          nart: '31007654321',
          ident_fiscal: '000031007654321',
          nif: '000031007654321',
          rc: '31/00-7654321B31',
          banq: 'BNA: 9876543 - Clé: 21',
          e_mail: 'info@distribfood.dz'
        }
      }
    ];

    for (const { tenant, data } of sampleData) {
      console.log(`   Inserting data for ${tenant}...`);
      
      const insertSQL = `
        INSERT INTO "${tenant}".activite (
          code_activite, domaine_activite, sous_domaine, raison_sociale,
          adresse, commune, wilaya, tel_fixe, tel_port, nrc, nis, nart,
          ident_fiscal, banq, e_mail, nif, rc
        ) VALUES (
          '${data.code_activite}', '${data.domaine_activite}', '${data.sous_domaine}', '${data.raison_sociale}',
          '${data.adresse}', '${data.commune}', '${data.wilaya}', '${data.tel_fixe}', '${data.tel_port}',
          '${data.nrc}', '${data.nis}', '${data.nart}', '${data.ident_fiscal}', '${data.banq}',
          '${data.e_mail}', '${data.nif}', '${data.rc}'
        )
        ON CONFLICT DO NOTHING;
      `;

      const { error: insertError } = await supabaseAdmin.rpc('exec_sql', {
        sql: insertSQL
      });

      if (insertError) {
        console.warn(`   ⚠️ Warning inserting data for ${tenant}:`, insertError.message);
      } else {
        console.log(`   ✅ Sample data inserted for ${tenant}`);
      }
    }

    // 5. Tester les fonctions pour chaque tenant
    console.log('\n5️⃣ Testing RPC function for each tenant...');
    
    for (const tenant of ['2025_bu01', '2025_bu02']) {
      console.log(`   Testing ${tenant}...`);
      
      const { data: testData, error: testError } = await supabaseAdmin.rpc('get_company_info', {
        p_tenant: tenant
      });

      if (testError) {
        console.error(`   ❌ Error testing ${tenant}:`, testError.message);
      } else if (testData && testData.length > 0) {
        console.log(`   ✅ ${tenant}: ${testData[0].raison_sociale}`);
      } else {
        console.log(`   ⚠️ ${tenant}: No data found`);
      }
    }

    console.log('\n🎉 Multi-tenant company setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  - Multi-tenant RPC function created');
    console.log('  - Activite tables created in tenant schemas');
    console.log('  - Sample data inserted for BU01 and BU02');
    console.log('  - Each BU now has its own company information');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupMultiTenantCompany();