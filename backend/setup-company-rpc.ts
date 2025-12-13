// Script pour créer la fonction RPC get_company_info dans Supabase
import { supabaseAdmin } from './src/supabaseClient.js';

async function setupCompanyRPC() {
  console.log('🔧 Setting up company info RPC function...\n');

  try {
    // 1. Vérifier si la table activite existe
    console.log('1️⃣ Checking if activite table exists...');
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('activite')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('⚠️ Table activite not found or empty, creating sample data...');
      
      // Créer la table activite si elle n'existe pas
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.activite (
          id SERIAL PRIMARY KEY,
          domaine_activite TEXT,
          sous_domaine TEXT,
          raison_sociale TEXT,
          adress TEXT,
          commune TEXT,
          wilaya TEXT,
          tel_fixe TEXT,
          tel_port TEXT,
          nrc TEXT,
          nis TEXT,
          nart TEXT,
          ident_fiscal TEXT,
          banq TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
        sql: createTableSQL
      });

      if (createError) {
        console.error('❌ Error creating activite table:', createError);
      } else {
        console.log('✅ Activite table created successfully');
      }

      // Insérer des données d'exemple
      const insertSampleSQL = `
        INSERT INTO public.activite (
          domaine_activite,
          sous_domaine,
          raison_sociale,
          adresse,
          commune,
          wilaya,
          tel_fixe,
          tel_port,
          nrc,
          nis,
          art,
          ident_fiscal,
          banq
        ) VALUES (
          'Commerce et Distribution',
          'Vente d''Articles Divers',
          'ENTREPRISE EXEMPLE SARL',
          '123 Rue de la République',
          'Alger Centre',
          'Alger',
          '+213 21 XX XX XX',
          '+213 55 XX XX XX',
          '16/00-1234567B16',
          '000016001234567',
          '16001234567',
          '000016001234567',
          'CCP: 1234567 - Clé: 89'
        )
        ON CONFLICT DO NOTHING;
      `;

      const { error: insertError } = await supabaseAdmin.rpc('exec_sql', {
        sql: insertSampleSQL
      });

      if (insertError) {
        console.error('❌ Error inserting sample data:', insertError);
      } else {
        console.log('✅ Sample company data inserted');
      }
    } else {
      console.log('✅ Activite table exists with data');
    }

    // 2. Créer la fonction RPC get_company_info
    console.log('\n2️⃣ Creating get_company_info RPC function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_company_info()
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
        art TEXT,
        ident_fiscal TEXT,
        banq TEXT
      ) 
      SECURITY DEFINER
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
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
          a.banq::TEXT
        FROM public.activite a
        ORDER BY a.created_at DESC
        LIMIT 1;
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

    console.log('✅ RPC function created successfully');

    // 3. Accorder les permissions
    console.log('\n3️⃣ Granting permissions...');
    
    const grantPermissionsSQL = `
      GRANT EXECUTE ON FUNCTION get_company_info() TO authenticated;
      GRANT EXECUTE ON FUNCTION get_company_info() TO anon;
    `;

    const { error: permError } = await supabaseAdmin.rpc('exec_sql', {
      sql: grantPermissionsSQL
    });

    if (permError) {
      console.error('❌ Error granting permissions:', permError);
    } else {
      console.log('✅ Permissions granted successfully');
    }

    // 4. Tester la fonction
    console.log('\n4️⃣ Testing the RPC function...');
    
    const { data: testData, error: testError } = await supabaseAdmin.rpc('get_company_info');

    if (testError) {
      console.error('❌ Error testing RPC function:', testError);
    } else {
      console.log('✅ RPC function test successful:');
      console.log(JSON.stringify(testData, null, 2));
    }

    console.log('\n🎉 Company info RPC setup completed successfully!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupCompanyRPC();