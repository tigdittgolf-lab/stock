import { supabaseAdmin } from './src/supabaseClient.js';

async function fixBU01Data() {
  console.log('🔧 Fixing BU01 company data...');
  
  const insertSQL = `
    INSERT INTO "2025_bu01".activite (
      code_activite, domaine_activite, sous_domaine, raison_sociale,
      adresse, commune, wilaya, tel_fixe, tel_port, nrc, nis, nart,
      ident_fiscal, banq, e_mail, nif, rc
    ) VALUES (
      'BU01', 'Commerce de Détail', 'Vente Articles Électroniques', 'ÉLECTRO PLUS SARL',
      '15 Rue Didouche Mourad', 'Alger Centre', 'Alger', '+213 21 63 45 78', '+213 55 12 34 56',
      '16/00-1234567B16', '000016001234567', '16001234567', '000016001234567', 'CCP: 1234567 - Clé: 89',
      'contact@electroplus.dz', '000016001234567', '16/00-1234567B16'
    )
    ON CONFLICT DO NOTHING;
  `;

  const { error } = await supabaseAdmin.rpc('exec_sql', { sql: insertSQL });
  
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ BU01 data fixed successfully');
  }

  // Test the data
  const { data, error: testError } = await supabaseAdmin.rpc('get_company_info', {
    p_tenant: '2025_bu01'
  });

  if (testError) {
    console.error('❌ Test error:', testError);
  } else if (data && data.length > 0) {
    console.log('✅ BU01 test successful:', data[0].raison_sociale);
  }
}

fixBU01Data();