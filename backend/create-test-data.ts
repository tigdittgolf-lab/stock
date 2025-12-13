import { supabaseAdmin } from './src/supabaseClient.js';

async function createTestData() {
  console.log('📝 Creating test data for multi-tenant PDF testing...');
  
  // Create test data for BU01
  console.log('\n🏢 Creating test data for BU01 (ÉLECTRO PLUS SARL)...');
  
  // First, create a client for BU01
  const createClientBU01SQL = `
    INSERT INTO "2025_bu01".client (nclient, raison_sociale, adresse)
    VALUES ('001', 'CLIENT TEST BU01', 'Adresse client BU01')
    ON CONFLICT (nclient) DO NOTHING;
  `;
  
  await supabaseAdmin.rpc('exec_sql', { sql: createClientBU01SQL });
  
  // Create an article for BU01
  const createArticleBU01SQL = `
    INSERT INTO "2025_bu01".article (narticle, designation, prix_vente, tva, stock_bl)
    VALUES ('ART001', 'Article Test BU01', 100.00, 19, 50)
    ON CONFLICT (narticle) DO NOTHING;
  `;
  
  await supabaseAdmin.rpc('exec_sql', { sql: createArticleBU01SQL });
  
  // Create a delivery note for BU01
  const createBLBU01SQL = `
    INSERT INTO "2025_bu01".bl (nclient, date_fact, montant_ht, tva)
    VALUES ('001', CURRENT_DATE, 100.00, 19.00)
    RETURNING nfact;
  `;
  
  const { data: blBU01 } = await supabaseAdmin.rpc('exec_sql', { sql: createBLBU01SQL });
  const blIdBU01 = blBU01?.[0]?.nfact;
  
  if (blIdBU01) {
    // Create detail for BU01
    const createDetailBU01SQL = `
      INSERT INTO "2025_bu01".detail_bl (nfact, narticle, qte, prix, tva, total_ligne)
      VALUES (${blIdBU01}, 'ART001', 1, 100.00, 19, 100.00);
    `;
    
    await supabaseAdmin.rpc('exec_sql', { sql: createDetailBU01SQL });
    console.log(`   ✅ BU01 delivery note created with ID: ${blIdBU01}`);
  }
  
  // Create test data for BU02
  console.log('\n🏢 Creating test data for BU02 (DISTRIB FOOD SPA)...');
  
  // First, create a client for BU02
  const createClientBU02SQL = `
    INSERT INTO "2025_bu02".client (nclient, raison_sociale, adresse)
    VALUES ('002', 'CLIENT TEST BU02', 'Adresse client BU02')
    ON CONFLICT (nclient) DO NOTHING;
  `;
  
  await supabaseAdmin.rpc('exec_sql', { sql: createClientBU02SQL });
  
  // Create an article for BU02
  const createArticleBU02SQL = `
    INSERT INTO "2025_bu02".article (narticle, designation, prix_vente, tva, stock_bl)
    VALUES ('FOOD001', 'Produit Alimentaire Test', 50.00, 19, 100)
    ON CONFLICT (narticle) DO NOTHING;
  `;
  
  await supabaseAdmin.rpc('exec_sql', { sql: createArticleBU02SQL });
  
  // Create a delivery note for BU02
  const createBLBU02SQL = `
    INSERT INTO "2025_bu02".bl (nclient, date_fact, montant_ht, tva)
    VALUES ('002', CURRENT_DATE, 50.00, 9.50)
    RETURNING nfact;
  `;
  
  const { data: blBU02 } = await supabaseAdmin.rpc('exec_sql', { sql: createBLBU02SQL });
  const blIdBU02 = blBU02?.[0]?.nfact;
  
  if (blIdBU02) {
    // Create detail for BU02
    const createDetailBU02SQL = `
      INSERT INTO "2025_bu02".detail_bl (nfact, narticle, qte, prix, tva, total_ligne)
      VALUES (${blIdBU02}, 'FOOD001', 1, 50.00, 19, 50.00);
    `;
    
    await supabaseAdmin.rpc('exec_sql', { sql: createDetailBU02SQL });
    console.log(`   ✅ BU02 delivery note created with ID: ${blIdBU02}`);
  }
  
  console.log('\n🎉 Test data created successfully!');
  console.log(`   BU01 delivery note ID: ${blIdBU01}`);
  console.log(`   BU02 delivery note ID: ${blIdBU02}`);
  
  return { blIdBU01, blIdBU02 };
}

createTestData().catch(console.error);