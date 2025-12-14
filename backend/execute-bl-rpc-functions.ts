// Script pour exécuter les fonctions RPC des bons de livraison
import { supabaseAdmin } from './src/supabaseClient.js';

async function executeBLRPCFunctions() {
  console.log('🔧 Creating BL RPC functions...');
  
  const functions = [
    // 1. Fonction insert_bl
    `
    CREATE OR REPLACE FUNCTION insert_bl(
      p_tenant TEXT,
      p_nfact INTEGER,
      p_nclient TEXT,
      p_date_fact DATE,
      p_montant_ht DECIMAL(10,2),
      p_tva DECIMAL(10,2),
      p_timbre DECIMAL(10,2) DEFAULT 0,
      p_autre_taxe DECIMAL(10,2) DEFAULT 0
    )
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
    BEGIN
      sql_query := format('
        INSERT INTO "%s".bl (
          nfact, nclient, date_fact, montant_ht, tva, timbre, autre_taxe, 
          facturer, banq, ncheque, nbc, date_bc, nom_preneur, 
          created_at, updated_at
        ) VALUES (
          %s, %L, %L, %s, %s, %s, %s,
          false, '''', '''', '''', NULL, '''',
          NOW(), NOW()
        )',
        p_tenant, p_nfact, p_nclient, p_date_fact, p_montant_ht, p_tva, p_timbre, p_autre_taxe
      );
      
      EXECUTE sql_query;
      
      RETURN format('BL %s créé avec succès dans %s', p_nfact, p_tenant);
    END;
    $$;
    `,
    
    // 2. Fonction insert_detail_bl
    `
    CREATE OR REPLACE FUNCTION insert_detail_bl(
      p_tenant TEXT,
      p_nfact INTEGER,
      p_narticle TEXT,
      p_qte DECIMAL(10,2),
      p_prix DECIMAL(10,2),
      p_tva DECIMAL(5,2),
      p_total_ligne DECIMAL(10,2)
    )
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
    BEGIN
      sql_query := format('
        INSERT INTO "%s".detail_bl (
          nfact, narticle, qte, prix, tva, total_ligne, facturer
        ) VALUES (
          %s, %L, %s, %s, %s, %s, false
        )',
        p_tenant, p_nfact, p_narticle, p_qte, p_prix, p_tva, p_total_ligne
      );
      
      EXECUTE sql_query;
      
      RETURN format('Détail BL ajouté: Article %s, Qté %s', p_narticle, p_qte);
    END;
    $$;
    `,
    
    // 3. Fonction get_next_bl_number
    `
    CREATE OR REPLACE FUNCTION get_next_bl_number(p_tenant TEXT)
    RETURNS INTEGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
      max_number INTEGER;
    BEGIN
      sql_query := format('SELECT COALESCE(MAX(nfact), 0) + 1 FROM "%s".bl', p_tenant);
      
      EXECUTE sql_query INTO max_number;
      
      RETURN max_number;
    END;
    $$;
    `,
    
    // 4. Fonction update_stock_bl
    `
    CREATE OR REPLACE FUNCTION update_stock_bl(
      p_tenant TEXT,
      p_narticle TEXT,
      p_quantity DECIMAL(10,2)
    )
    RETURNS TABLE(
      narticle TEXT,
      stock_bl DECIMAL(10,2)
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
      new_stock DECIMAL(10,2);
    BEGIN
      sql_query := format('
        UPDATE "%s".articles 
        SET stock_bl = stock_bl - %s,
            updated_at = NOW()
        WHERE narticle = %L
        RETURNING stock_bl',
        p_tenant, p_quantity, p_narticle
      );
      
      EXECUTE sql_query INTO new_stock;
      
      RETURN QUERY SELECT p_narticle, new_stock;
    END;
    $$;
    `,
    
    // 5. Fonction get_article_stock
    `
    CREATE OR REPLACE FUNCTION get_article_stock(
      p_tenant TEXT,
      p_narticle TEXT
    )
    RETURNS TABLE(
      narticle TEXT,
      stock_f DECIMAL(10,2),
      stock_bl DECIMAL(10,2)
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
    BEGIN
      sql_query := format('
        SELECT narticle, stock_f, stock_bl
        FROM "%s".articles 
        WHERE narticle = %L',
        p_tenant, p_narticle
      );
      
      RETURN QUERY EXECUTE sql_query;
    END;
    $$;
    `
  ];
  
  // Permissions
  const permissions = [
    'GRANT EXECUTE ON FUNCTION insert_bl TO anon, authenticated;',
    'GRANT EXECUTE ON FUNCTION insert_detail_bl TO anon, authenticated;',
    'GRANT EXECUTE ON FUNCTION get_next_bl_number TO anon, authenticated;',
    'GRANT EXECUTE ON FUNCTION update_stock_bl TO anon, authenticated;',
    'GRANT EXECUTE ON FUNCTION get_article_stock TO anon, authenticated;'
  ];
  
  try {
    // Exécuter chaque fonction
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
    console.log('🔐 Granting permissions...');
    for (const permission of permissions) {
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: permission
      });
      
      if (error) {
        console.warn('⚠️ Permission error:', error);
      }
    }
    
    console.log('✅ All BL RPC functions created successfully!');
    
    // Tester les fonctions
    console.log('\n🧪 Testing functions...');
    
    // Test get_next_bl_number
    const { data: nextNumber, error: numberError } = await supabaseAdmin.rpc('get_next_bl_number', {
      p_tenant: '2025_bu01'
    });
    
    if (numberError) {
      console.error('❌ get_next_bl_number test failed:', numberError);
    } else {
      console.log(`✅ get_next_bl_number works: ${nextNumber}`);
    }
    
    // Test insert_bl
    const { data: insertResult, error: insertError } = await supabaseAdmin.rpc('insert_bl', {
      p_tenant: '2025_bu01',
      p_nfact: 9999,
      p_nclient: 'TEST',
      p_date_fact: '2025-01-01',
      p_montant_ht: 100,
      p_tva: 19,
      p_timbre: 0,
      p_autre_taxe: 0
    });
    
    if (insertError) {
      console.error('❌ insert_bl test failed:', insertError);
    } else {
      console.log(`✅ insert_bl works: ${insertResult}`);
      
      // Nettoyer le test
      await supabaseAdmin.rpc('exec_sql', {
        sql: 'DELETE FROM "2025_bu01".bl WHERE nfact = 9999;'
      });
      console.log('🧹 Test data cleaned up');
    }
    
    console.log('\n🎉 BL RPC functions are ready!');
    console.log('📋 Next step: Test delivery note creation in the frontend');
    
  } catch (error) {
    console.error('❌ Failed to create BL RPC functions:', error);
  }
}

executeBLRPCFunctions();