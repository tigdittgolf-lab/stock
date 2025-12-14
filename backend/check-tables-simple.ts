// Vérifier les tables existantes de manière simple
import { supabaseAdmin } from './src/supabaseClient.js';

async function checkTablesSimple() {
  console.log('🔍 Checking existing tables...');
  
  const testTenant = '2025_bu01';
  
  try {
    // Tester directement si les tables existent en essayant de les interroger
    const tablesToCheck = [
      { name: 'bl', query: `SELECT COUNT(*) FROM "${testTenant}".bl LIMIT 1` },
      { name: 'detail_bl', query: `SELECT COUNT(*) FROM "${testTenant}".detail_bl LIMIT 1` },
      { name: 'facture', query: `SELECT COUNT(*) FROM "${testTenant}".facture LIMIT 1` },
      { name: 'detail_fact', query: `SELECT COUNT(*) FROM "${testTenant}".detail_fact LIMIT 1` },
      { name: 'proforma', query: `SELECT COUNT(*) FROM "${testTenant}".proforma LIMIT 1` },
      { name: 'detail_proforma', query: `SELECT COUNT(*) FROM "${testTenant}".detail_proforma LIMIT 1` },
      { name: 'bon_commande', query: `SELECT COUNT(*) FROM "${testTenant}".bon_commande LIMIT 1` },
      { name: 'detail_bc', query: `SELECT COUNT(*) FROM "${testTenant}".detail_bc LIMIT 1` },
      { name: 'facture_achat', query: `SELECT COUNT(*) FROM "${testTenant}".facture_achat LIMIT 1` },
      { name: 'detail_facture_achat', query: `SELECT COUNT(*) FROM "${testTenant}".detail_facture_achat LIMIT 1` }
    ];
    
    console.log('📊 Table existence check:');
    console.log('========================');
    
    const existingTables = [];
    const missingTables = [];
    
    for (const table of tablesToCheck) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: table.query
        });
        
        if (error) {
          console.log(`❌ ${table.name} - Does not exist`);
          missingTables.push(table.name);
        } else {
          console.log(`✅ ${table.name} - Exists`);
          existingTables.push(table.name);
        }
      } catch (e) {
        console.log(`❌ ${table.name} - Error checking`);
        missingTables.push(table.name);
      }
    }
    
    console.log(`\n📋 Summary:`);
    console.log(`✅ Existing tables: ${existingTables.join(', ')}`);
    console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
    
    if (missingTables.length > 0) {
      console.log('\n🔧 Creating missing tables...');
      
      // Créer seulement les tables manquantes
      const createQueries = [];
      
      if (missingTables.includes('facture')) {
        createQueries.push(`
          CREATE TABLE "${testTenant}".facture (
            nfact INTEGER PRIMARY KEY,
            nclient VARCHAR(20),
            date_fact DATE,
            montant_ht NUMERIC(10,2) DEFAULT 0,
            tva NUMERIC(10,2) DEFAULT 0,
            timbre NUMERIC(10,2) DEFAULT 0,
            autre_taxe NUMERIC(10,2) DEFAULT 0,
            facturer BOOLEAN DEFAULT true,
            banq VARCHAR(50) DEFAULT '',
            ncheque VARCHAR(50) DEFAULT '',
            nbc VARCHAR(50) DEFAULT '',
            date_bc DATE,
            nom_preneur VARCHAR(100) DEFAULT '',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
      }
      
      if (missingTables.includes('detail_fact')) {
        createQueries.push(`
          CREATE TABLE "${testTenant}".detail_fact (
            id SERIAL PRIMARY KEY,
            nfact INTEGER,
            narticle VARCHAR(20),
            qte NUMERIC(10,2),
            prix NUMERIC(10,2),
            tva NUMERIC(5,2),
            total_ligne NUMERIC(10,2),
            facturer BOOLEAN DEFAULT true
          );
        `);
      }
      
      if (missingTables.includes('proforma')) {
        createQueries.push(`
          CREATE TABLE "${testTenant}".proforma (
            nfact INTEGER PRIMARY KEY,
            nclient VARCHAR(20),
            date_fact DATE,
            montant_ht NUMERIC(10,2) DEFAULT 0,
            tva NUMERIC(10,2) DEFAULT 0,
            timbre NUMERIC(10,2) DEFAULT 0,
            autre_taxe NUMERIC(10,2) DEFAULT 0,
            facturer BOOLEAN DEFAULT false,
            banq VARCHAR(50) DEFAULT '',
            ncheque VARCHAR(50) DEFAULT '',
            nbc VARCHAR(50) DEFAULT '',
            date_bc DATE,
            nom_preneur VARCHAR(100) DEFAULT '',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
      }
      
      if (missingTables.includes('detail_proforma')) {
        createQueries.push(`
          CREATE TABLE "${testTenant}".detail_proforma (
            id SERIAL PRIMARY KEY,
            nfact INTEGER,
            narticle VARCHAR(20),
            qte NUMERIC(10,2),
            prix NUMERIC(10,2),
            tva NUMERIC(5,2),
            total_ligne NUMERIC(10,2),
            facturer BOOLEAN DEFAULT false
          );
        `);
      }
      
      if (missingTables.includes('bon_commande')) {
        createQueries.push(`
          CREATE TABLE "${testTenant}".bon_commande (
            nbc INTEGER PRIMARY KEY,
            nfournisseur VARCHAR(20),
            date_bc DATE,
            montant_ht NUMERIC(10,2) DEFAULT 0,
            tva NUMERIC(10,2) DEFAULT 0,
            timbre NUMERIC(10,2) DEFAULT 0,
            autre_taxe NUMERIC(10,2) DEFAULT 0,
            livrer BOOLEAN DEFAULT false,
            banq VARCHAR(50) DEFAULT '',
            ncheque VARCHAR(50) DEFAULT '',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
      }
      
      if (missingTables.includes('detail_bc')) {
        createQueries.push(`
          CREATE TABLE "${testTenant}".detail_bc (
            id SERIAL PRIMARY KEY,
            nbc INTEGER,
            narticle VARCHAR(20),
            qte NUMERIC(10,2),
            prix NUMERIC(10,2),
            tva NUMERIC(5,2),
            total_ligne NUMERIC(10,2),
            livrer BOOLEAN DEFAULT false
          );
        `);
      }
      
      if (missingTables.includes('facture_achat')) {
        createQueries.push(`
          CREATE TABLE "${testTenant}".facture_achat (
            nfact_achat INTEGER PRIMARY KEY,
            nfournisseur VARCHAR(20),
            date_fact DATE,
            montant_ht NUMERIC(10,2) DEFAULT 0,
            tva NUMERIC(10,2) DEFAULT 0,
            timbre NUMERIC(10,2) DEFAULT 0,
            autre_taxe NUMERIC(10,2) DEFAULT 0,
            payer BOOLEAN DEFAULT false,
            banq VARCHAR(50) DEFAULT '',
            ncheque VARCHAR(50) DEFAULT '',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
      }
      
      if (missingTables.includes('detail_facture_achat')) {
        createQueries.push(`
          CREATE TABLE "${testTenant}".detail_facture_achat (
            id SERIAL PRIMARY KEY,
            nfact_achat INTEGER,
            narticle VARCHAR(20),
            qte NUMERIC(10,2),
            prix NUMERIC(10,2),
            tva NUMERIC(5,2),
            total_ligne NUMERIC(10,2),
            payer BOOLEAN DEFAULT false
          );
        `);
      }
      
      // Exécuter les requêtes de création
      for (let i = 0; i < createQueries.length; i++) {
        console.log(`📝 Creating table ${i + 1}/${createQueries.length}...`);
        
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: createQueries[i].trim()
        });
        
        if (error) {
          console.error(`❌ Error creating table ${i + 1}:`, error);
        } else {
          console.log(`✅ Table ${i + 1} created successfully`);
        }
      }
      
      console.log('\n🎉 All missing tables created!');
      console.log('🧪 Testing RPC functions now...');
      
      // Tester les fonctions RPC
      const tests = [
        { name: 'Invoice', func: 'get_next_invoice_number' },
        { name: 'Proforma', func: 'get_next_proforma_number' },
        { name: 'Purchase Order', func: 'get_next_purchase_order_number' },
        { name: 'Purchase Invoice', func: 'get_next_purchase_invoice_number' }
      ];
      
      for (const test of tests) {
        try {
          const { data, error } = await supabaseAdmin.rpc(test.func, {
            p_tenant: testTenant
          });
          
          if (error) {
            console.log(`❌ ${test.name}: ${error.message}`);
          } else {
            console.log(`✅ ${test.name}: Next number = ${data}`);
          }
        } catch (e) {
          console.log(`❌ ${test.name}: Test failed`);
        }
      }
      
    } else {
      console.log('\n✅ All required tables exist!');
    }
    
  } catch (error) {
    console.error('❌ Failed to check tables:', error);
  }
}

checkTablesSimple();