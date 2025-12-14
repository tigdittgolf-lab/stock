// Vérifier quelles tables existent dans le schéma tenant
import { supabaseAdmin } from './src/supabaseClient.js';

async function checkExistingTables() {
  console.log('🔍 Checking existing tables in tenant schemas...');
  
  const testTenant = '2025_bu01';
  
  try {
    // Obtenir la liste des tables dans le schéma tenant
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema = '${testTenant}'
        ORDER BY table_name;
      `
    });
    
    if (tablesError) {
      console.error('❌ Error getting tables:', tablesError);
      return;
    }
    
    console.log(`📋 Tables in schema "${testTenant}":`);
    console.table(tables);
    
    // Vérifier spécifiquement les tables de documents
    const documentTables = ['bl', 'detail_bl', 'facture', 'detail_fact', 'proforma', 'detail_proforma', 'bon_commande', 'detail_bc', 'facture_achat', 'detail_facture_achat'];
    
    console.log('\n📊 Document tables status:');
    console.log('==========================');
    
    for (const tableName of documentTables) {
      const exists = tables?.some(t => t.table_name === tableName);
      console.log(`${exists ? '✅' : '❌'} ${tableName}`);
    }
    
    // Si certaines tables manquent, proposer de les créer
    const missingTables = documentTables.filter(tableName => 
      !tables?.some(t => t.table_name === tableName)
    );
    
    if (missingTables.length > 0) {
      console.log(`\n⚠️ Missing tables: ${missingTables.join(', ')}`);
      console.log('🔧 These tables need to be created for the RPC functions to work');
      
      // Créer les tables manquantes
      console.log('\n🏗️ Creating missing document tables...');
      
      const createTableQueries = [
        // Table facture
        `
        CREATE TABLE IF NOT EXISTS "${testTenant}".facture (
          nfact INTEGER PRIMARY KEY,
          nclient VARCHAR(20) REFERENCES "${testTenant}".client(nclient),
          date_fact DATE,
          montant_ht NUMERIC(10,2) DEFAULT 0,
          tva NUMERIC(10,2) DEFAULT 0,
          timbre NUMERIC(10,2) DEFAULT 0,
          autre_taxe NUMERIC(10,2) DEFAULT 0,
          facturer BOOLEAN DEFAULT true,
          banq VARCHAR(50),
          ncheque VARCHAR(50),
          nbc VARCHAR(50),
          date_bc DATE,
          nom_preneur VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        `,
        
        // Table detail_fact
        `
        CREATE TABLE IF NOT EXISTS "${testTenant}".detail_fact (
          id SERIAL PRIMARY KEY,
          nfact INTEGER REFERENCES "${testTenant}".facture(nfact) ON DELETE CASCADE,
          narticle VARCHAR(20) REFERENCES "${testTenant}".article(narticle),
          qte NUMERIC(10,2),
          prix NUMERIC(10,2),
          tva NUMERIC(5,2),
          total_ligne NUMERIC(10,2),
          facturer BOOLEAN DEFAULT true
        );
        `,
        
        // Table proforma
        `
        CREATE TABLE IF NOT EXISTS "${testTenant}".proforma (
          nfact INTEGER PRIMARY KEY,
          nclient VARCHAR(20) REFERENCES "${testTenant}".client(nclient),
          date_fact DATE,
          montant_ht NUMERIC(10,2) DEFAULT 0,
          tva NUMERIC(10,2) DEFAULT 0,
          timbre NUMERIC(10,2) DEFAULT 0,
          autre_taxe NUMERIC(10,2) DEFAULT 0,
          facturer BOOLEAN DEFAULT false,
          banq VARCHAR(50),
          ncheque VARCHAR(50),
          nbc VARCHAR(50),
          date_bc DATE,
          nom_preneur VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        `,
        
        // Table detail_proforma
        `
        CREATE TABLE IF NOT EXISTS "${testTenant}".detail_proforma (
          id SERIAL PRIMARY KEY,
          nfact INTEGER REFERENCES "${testTenant}".proforma(nfact) ON DELETE CASCADE,
          narticle VARCHAR(20) REFERENCES "${testTenant}".article(narticle),
          qte NUMERIC(10,2),
          prix NUMERIC(10,2),
          tva NUMERIC(5,2),
          total_ligne NUMERIC(10,2),
          facturer BOOLEAN DEFAULT false
        );
        `,
        
        // Table bon_commande
        `
        CREATE TABLE IF NOT EXISTS "${testTenant}".bon_commande (
          nbc INTEGER PRIMARY KEY,
          nfournisseur VARCHAR(20) REFERENCES "${testTenant}".fournisseur(nfournisseur),
          date_bc DATE,
          montant_ht NUMERIC(10,2) DEFAULT 0,
          tva NUMERIC(10,2) DEFAULT 0,
          timbre NUMERIC(10,2) DEFAULT 0,
          autre_taxe NUMERIC(10,2) DEFAULT 0,
          livrer BOOLEAN DEFAULT false,
          banq VARCHAR(50),
          ncheque VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        `,
        
        // Table detail_bc
        `
        CREATE TABLE IF NOT EXISTS "${testTenant}".detail_bc (
          id SERIAL PRIMARY KEY,
          nbc INTEGER REFERENCES "${testTenant}".bon_commande(nbc) ON DELETE CASCADE,
          narticle VARCHAR(20) REFERENCES "${testTenant}".article(narticle),
          qte NUMERIC(10,2),
          prix NUMERIC(10,2),
          tva NUMERIC(5,2),
          total_ligne NUMERIC(10,2),
          livrer BOOLEAN DEFAULT false
        );
        `,
        
        // Table facture_achat
        `
        CREATE TABLE IF NOT EXISTS "${testTenant}".facture_achat (
          nfact_achat INTEGER PRIMARY KEY,
          nfournisseur VARCHAR(20) REFERENCES "${testTenant}".fournisseur(nfournisseur),
          date_fact DATE,
          montant_ht NUMERIC(10,2) DEFAULT 0,
          tva NUMERIC(10,2) DEFAULT 0,
          timbre NUMERIC(10,2) DEFAULT 0,
          autre_taxe NUMERIC(10,2) DEFAULT 0,
          payer BOOLEAN DEFAULT false,
          banq VARCHAR(50),
          ncheque VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        `,
        
        // Table detail_facture_achat
        `
        CREATE TABLE IF NOT EXISTS "${testTenant}".detail_facture_achat (
          id SERIAL PRIMARY KEY,
          nfact_achat INTEGER REFERENCES "${testTenant}".facture_achat(nfact_achat) ON DELETE CASCADE,
          narticle VARCHAR(20) REFERENCES "${testTenant}".article(narticle),
          qte NUMERIC(10,2),
          prix NUMERIC(10,2),
          tva NUMERIC(5,2),
          total_ligne NUMERIC(10,2),
          payer BOOLEAN DEFAULT false
        );
        `
      ];
      
      for (let i = 0; i < createTableQueries.length; i++) {
        console.log(`📝 Creating table ${i + 1}/${createTableQueries.length}...`);
        
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: createTableQueries[i].trim()
        });
        
        if (error) {
          console.error(`❌ Error creating table ${i + 1}:`, error);
        } else {
          console.log(`✅ Table ${i + 1} created successfully`);
        }
      }
      
      console.log('\n✅ All missing tables created!');
      console.log('🧪 Now testing the RPC functions again...');
      
      // Retester les fonctions
      const { data: nextInvoiceNumber } = await supabaseAdmin.rpc('get_next_invoice_number', {
        p_tenant: testTenant
      });
      
      const { data: nextProformaNumber } = await supabaseAdmin.rpc('get_next_proforma_number', {
        p_tenant: testTenant
      });
      
      console.log(`✅ Invoice functions work - Next number: ${nextInvoiceNumber}`);
      console.log(`✅ Proforma functions work - Next number: ${nextProformaNumber}`);
      
    } else {
      console.log('\n✅ All required document tables exist!');
    }
    
  } catch (error) {
    console.error('❌ Failed to check tables:', error);
  }
}

checkExistingTables();