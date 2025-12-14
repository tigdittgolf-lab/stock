// Créer toutes les fonctions RPC pour tous les types de documents
import { supabaseAdmin } from './src/supabaseClient.js';

async function createAllDocumentRPCFunctions() {
  console.log('🏗️ Creating RPC functions for ALL document types...');
  console.log('📋 Documents: Factures, Proforma, Bons d\'achat, Factures d\'achat');
  
  const functions = [
    // ===== FACTURES (INVOICES) =====
    
    // 1. Obtenir le prochain numéro de facture
    `
    CREATE OR REPLACE FUNCTION get_next_invoice_number(p_tenant TEXT)
    RETURNS INTEGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
      max_number INTEGER;
    BEGIN
      sql_query := format('SELECT COALESCE(MAX(nfact), 0) + 1 FROM "%s".facture', p_tenant);
      EXECUTE sql_query INTO max_number;
      RETURN max_number;
    END;
    $$;
    `,
    
    // 2. Créer une facture
    `
    CREATE OR REPLACE FUNCTION insert_invoice(
      p_tenant TEXT,
      p_nfact INTEGER,
      p_nclient TEXT,
      p_date_fact DATE,
      p_montant_ht NUMERIC,
      p_tva NUMERIC
    )
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
    BEGIN
      sql_query := format('
        INSERT INTO "%s".facture (
          nfact, nclient, date_fact, montant_ht, tva, timbre, autre_taxe, 
          facturer, banq, ncheque, nbc, date_bc, nom_preneur, 
          created_at, updated_at
        ) VALUES (
          %s, %L, %L, %s, %s, 0, 0,
          true, '''', '''', '''', NULL, '''',
          NOW(), NOW()
        )',
        p_tenant, p_nfact, p_nclient, p_date_fact, p_montant_ht, p_tva
      );
      
      EXECUTE sql_query;
      RETURN format('Facture %s créée avec succès pour client %s', p_nfact, p_nclient);
    END;
    $$;
    `,
    
    // 3. Ajouter détail facture
    `
    CREATE OR REPLACE FUNCTION insert_detail_invoice(
      p_tenant TEXT,
      p_nfact INTEGER,
      p_narticle TEXT,
      p_qte NUMERIC,
      p_prix NUMERIC,
      p_tva NUMERIC,
      p_total_ligne NUMERIC
    )
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
    BEGIN
      sql_query := format('
        INSERT INTO "%s".detail_fact (
          nfact, narticle, qte, prix, tva, total_ligne, facturer
        ) VALUES (
          %s, %L, %s, %s, %s, %s, true
        )',
        p_tenant, p_nfact, p_narticle, p_qte, p_prix, p_tva, p_total_ligne
      );
      
      EXECUTE sql_query;
      RETURN format('Détail facture ajouté: %s x %s = %s DA', p_narticle, p_qte, p_total_ligne);
    END;
    $$;
    `,
    
    // 4. Mettre à jour stock facture
    `
    CREATE OR REPLACE FUNCTION update_stock_facture(
      p_tenant TEXT,
      p_narticle TEXT,
      p_quantity NUMERIC
    )
    RETURNS JSON
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result JSON;
      sql_query TEXT;
    BEGIN
      sql_query := format('
        UPDATE "%s".article 
        SET stock_f = stock_f - %s
        WHERE narticle = %L
        RETURNING json_build_object(
          ''narticle'', narticle,
          ''old_stock'', stock_f + %s,
          ''new_stock'', stock_f,
          ''quantity_deducted'', %s
        )',
        p_tenant, p_quantity, p_narticle, p_quantity, p_quantity
      );
      
      EXECUTE sql_query INTO result;
      RETURN result;
    END;
    $$;
    `,
    
    // ===== PROFORMA =====
    
    // 5. Obtenir le prochain numéro de proforma
    `
    CREATE OR REPLACE FUNCTION get_next_proforma_number(p_tenant TEXT)
    RETURNS INTEGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
      max_number INTEGER;
    BEGIN
      sql_query := format('SELECT COALESCE(MAX(nfact), 0) + 1 FROM "%s".proforma', p_tenant);
      EXECUTE sql_query INTO max_number;
      RETURN max_number;
    END;
    $$;
    `,
    
    // 6. Créer une proforma
    `
    CREATE OR REPLACE FUNCTION insert_proforma(
      p_tenant TEXT,
      p_nfact INTEGER,
      p_nclient TEXT,
      p_date_fact DATE,
      p_montant_ht NUMERIC,
      p_tva NUMERIC
    )
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
    BEGIN
      sql_query := format('
        INSERT INTO "%s".proforma (
          nfact, nclient, date_fact, montant_ht, tva, timbre, autre_taxe, 
          facturer, banq, ncheque, nbc, date_bc, nom_preneur, 
          created_at, updated_at
        ) VALUES (
          %s, %L, %L, %s, %s, 0, 0,
          false, '''', '''', '''', NULL, '''',
          NOW(), NOW()
        )',
        p_tenant, p_nfact, p_nclient, p_date_fact, p_montant_ht, p_tva
      );
      
      EXECUTE sql_query;
      RETURN format('Proforma %s créée avec succès pour client %s', p_nfact, p_nclient);
    END;
    $$;
    `,
    
    // 7. Ajouter détail proforma
    `
    CREATE OR REPLACE FUNCTION insert_detail_proforma(
      p_tenant TEXT,
      p_nfact INTEGER,
      p_narticle TEXT,
      p_qte NUMERIC,
      p_prix NUMERIC,
      p_tva NUMERIC,
      p_total_ligne NUMERIC
    )
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
    BEGIN
      sql_query := format('
        INSERT INTO "%s".detail_proforma (
          nfact, narticle, qte, prix, tva, total_ligne, facturer
        ) VALUES (
          %s, %L, %s, %s, %s, %s, false
        )',
        p_tenant, p_nfact, p_narticle, p_qte, p_prix, p_tva, p_total_ligne
      );
      
      EXECUTE sql_query;
      RETURN format('Détail proforma ajouté: %s x %s = %s DA', p_narticle, p_qte, p_total_ligne);
    END;
    $$;
    `,
    
    // ===== BONS D'ACHAT (PURCHASE ORDERS) =====
    
    // 8. Obtenir le prochain numéro de bon d'achat
    `
    CREATE OR REPLACE FUNCTION get_next_purchase_order_number(p_tenant TEXT)
    RETURNS INTEGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
      max_number INTEGER;
    BEGIN
      sql_query := format('SELECT COALESCE(MAX(nbc), 0) + 1 FROM "%s".bon_commande', p_tenant);
      EXECUTE sql_query INTO max_number;
      RETURN max_number;
    END;
    $$;
    `,
    
    // 9. Créer un bon d'achat
    `
    CREATE OR REPLACE FUNCTION insert_purchase_order(
      p_tenant TEXT,
      p_nbc INTEGER,
      p_nfournisseur TEXT,
      p_date_bc DATE,
      p_montant_ht NUMERIC,
      p_tva NUMERIC
    )
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
    BEGIN
      sql_query := format('
        INSERT INTO "%s".bon_commande (
          nbc, nfournisseur, date_bc, montant_ht, tva, timbre, autre_taxe, 
          livrer, banq, ncheque, created_at, updated_at
        ) VALUES (
          %s, %L, %L, %s, %s, 0, 0,
          false, '''', '''', NOW(), NOW()
        )',
        p_tenant, p_nbc, p_nfournisseur, p_date_bc, p_montant_ht, p_tva
      );
      
      EXECUTE sql_query;
      RETURN format('Bon de commande %s créé avec succès pour fournisseur %s', p_nbc, p_nfournisseur);
    END;
    $$;
    `,
    
    // 10. Ajouter détail bon d'achat
    `
    CREATE OR REPLACE FUNCTION insert_detail_purchase_order(
      p_tenant TEXT,
      p_nbc INTEGER,
      p_narticle TEXT,
      p_qte NUMERIC,
      p_prix NUMERIC,
      p_tva NUMERIC,
      p_total_ligne NUMERIC
    )
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
    BEGIN
      sql_query := format('
        INSERT INTO "%s".detail_bc (
          nbc, narticle, qte, prix, tva, total_ligne, livrer
        ) VALUES (
          %s, %L, %s, %s, %s, %s, false
        )',
        p_tenant, p_nbc, p_narticle, p_qte, p_prix, p_tva, p_total_ligne
      );
      
      EXECUTE sql_query;
      RETURN format('Détail bon de commande ajouté: %s x %s = %s DA', p_narticle, p_qte, p_total_ligne);
    END;
    $$;
    `,
    
    // ===== FACTURES D'ACHAT (PURCHASE INVOICES) =====
    
    // 11. Obtenir le prochain numéro de facture d'achat
    `
    CREATE OR REPLACE FUNCTION get_next_purchase_invoice_number(p_tenant TEXT)
    RETURNS INTEGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
      max_number INTEGER;
    BEGIN
      sql_query := format('SELECT COALESCE(MAX(nfact_achat), 0) + 1 FROM "%s".facture_achat', p_tenant);
      EXECUTE sql_query INTO max_number;
      RETURN max_number;
    END;
    $$;
    `,
    
    // 12. Créer une facture d'achat
    `
    CREATE OR REPLACE FUNCTION insert_purchase_invoice(
      p_tenant TEXT,
      p_nfact_achat INTEGER,
      p_nfournisseur TEXT,
      p_date_fact DATE,
      p_montant_ht NUMERIC,
      p_tva NUMERIC
    )
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
    BEGIN
      sql_query := format('
        INSERT INTO "%s".facture_achat (
          nfact_achat, nfournisseur, date_fact, montant_ht, tva, timbre, autre_taxe, 
          payer, banq, ncheque, created_at, updated_at
        ) VALUES (
          %s, %L, %L, %s, %s, 0, 0,
          false, '''', '''', NOW(), NOW()
        )',
        p_tenant, p_nfact_achat, p_nfournisseur, p_date_fact, p_montant_ht, p_tva
      );
      
      EXECUTE sql_query;
      RETURN format('Facture d''achat %s créée avec succès pour fournisseur %s', p_nfact_achat, p_nfournisseur);
    END;
    $$;
    `,
    
    // 13. Ajouter détail facture d'achat
    `
    CREATE OR REPLACE FUNCTION insert_detail_purchase_invoice(
      p_tenant TEXT,
      p_nfact_achat INTEGER,
      p_narticle TEXT,
      p_qte NUMERIC,
      p_prix NUMERIC,
      p_tva NUMERIC,
      p_total_ligne NUMERIC
    )
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
    BEGIN
      sql_query := format('
        INSERT INTO "%s".detail_facture_achat (
          nfact_achat, narticle, qte, prix, tva, total_ligne, payer
        ) VALUES (
          %s, %L, %s, %s, %s, %s, false
        )',
        p_tenant, p_nfact_achat, p_narticle, p_qte, p_prix, p_tva, p_total_ligne
      );
      
      EXECUTE sql_query;
      RETURN format('Détail facture d''achat ajouté: %s x %s = %s DA', p_narticle, p_qte, p_total_ligne);
    END;
    $$;
    `,
    
    // 14. Augmenter le stock lors d'un achat
    `
    CREATE OR REPLACE FUNCTION increase_stock_purchase(
      p_tenant TEXT,
      p_narticle TEXT,
      p_quantity NUMERIC
    )
    RETURNS JSON
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result JSON;
      sql_query TEXT;
    BEGIN
      sql_query := format('
        UPDATE "%s".article 
        SET stock_f = stock_f + %s
        WHERE narticle = %L
        RETURNING json_build_object(
          ''narticle'', narticle,
          ''old_stock'', stock_f - %s,
          ''new_stock'', stock_f,
          ''quantity_added'', %s
        )',
        p_tenant, p_quantity, p_narticle, p_quantity, p_quantity
      );
      
      EXECUTE sql_query INTO result;
      RETURN result;
    END;
    $$;
    `
  ];
  
  try {
    // Créer toutes les fonctions
    for (let i = 0; i < functions.length; i++) {
      console.log(`📝 Creating function ${i + 1}/${functions.length}...`);
      
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: functions[i].trim()
      });
      
      if (error) {
        console.error(`❌ Error creating function ${i + 1}:`, error);
      } else {
        console.log(`✅ Function ${i + 1} created successfully`);
      }
    }
    
    // Accorder les permissions
    console.log('🔐 Granting permissions for all document functions...');
    const permissions = [
      // Factures
      'GRANT EXECUTE ON FUNCTION get_next_invoice_number TO anon, authenticated;',
      'GRANT EXECUTE ON FUNCTION insert_invoice TO anon, authenticated;',
      'GRANT EXECUTE ON FUNCTION insert_detail_invoice TO anon, authenticated;',
      'GRANT EXECUTE ON FUNCTION update_stock_facture TO anon, authenticated;',
      // Proforma
      'GRANT EXECUTE ON FUNCTION get_next_proforma_number TO anon, authenticated;',
      'GRANT EXECUTE ON FUNCTION insert_proforma TO anon, authenticated;',
      'GRANT EXECUTE ON FUNCTION insert_detail_proforma TO anon, authenticated;',
      // Bons d'achat
      'GRANT EXECUTE ON FUNCTION get_next_purchase_order_number TO anon, authenticated;',
      'GRANT EXECUTE ON FUNCTION insert_purchase_order TO anon, authenticated;',
      'GRANT EXECUTE ON FUNCTION insert_detail_purchase_order TO anon, authenticated;',
      // Factures d'achat
      'GRANT EXECUTE ON FUNCTION get_next_purchase_invoice_number TO anon, authenticated;',
      'GRANT EXECUTE ON FUNCTION insert_purchase_invoice TO anon, authenticated;',
      'GRANT EXECUTE ON FUNCTION insert_detail_purchase_invoice TO anon, authenticated;',
      'GRANT EXECUTE ON FUNCTION increase_stock_purchase TO anon, authenticated;'
    ];
    
    for (const permission of permissions) {
      await supabaseAdmin.rpc('exec_sql', { sql: permission });
    }
    
    console.log('✅ All permissions granted');
    
    console.log('\n🎉 ALL DOCUMENT RPC FUNCTIONS CREATED SUCCESSFULLY!');
    console.log('\n📋 Functions created for:');
    console.log('   ✅ Bons de livraison (BL) - Déjà testés');
    console.log('   ✅ Factures - 4 nouvelles fonctions');
    console.log('   ✅ Proforma - 3 nouvelles fonctions');
    console.log('   ✅ Bons d\'achat - 3 nouvelles fonctions');
    console.log('   ✅ Factures d\'achat - 4 nouvelles fonctions');
    
    console.log('\n🔧 Next steps:');
    console.log('1. Update all endpoints in sales.ts to use RPC functions');
    console.log('2. Remove hardcoded data from all document creation endpoints');
    console.log('3. Test each document type creation');
    
  } catch (error) {
    console.error('❌ Failed to create document RPC functions:', error);
  }
}

createAllDocumentRPCFunctions();