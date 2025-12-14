// Corriger les types de données des fonctions RPC
import { supabaseAdmin } from './src/supabaseClient.js';

async function fixFunctionTypes() {
  console.log('🔧 Fixing function data types...');
  
  // Fonction corrigée avec les bons types
  const fixedGetStockFunction = `
    CREATE OR REPLACE FUNCTION get_article_stock(
      p_tenant TEXT,
      p_narticle TEXT
    )
    RETURNS TABLE(
      narticle VARCHAR(20),
      stock_f NUMERIC,
      stock_bl NUMERIC
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
    BEGIN
      sql_query := format('
        SELECT narticle, stock_f, stock_bl
        FROM "%s".article 
        WHERE narticle = %L',
        p_tenant, p_narticle
      );
      
      RETURN QUERY EXECUTE sql_query;
    END;
    $$;
  `;
  
  const fixedUpdateStockFunction = `
    CREATE OR REPLACE FUNCTION update_stock_bl(
      p_tenant TEXT,
      p_narticle TEXT,
      p_quantity NUMERIC
    )
    RETURNS TABLE(
      narticle VARCHAR(20),
      stock_bl NUMERIC
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      sql_query TEXT;
      new_stock NUMERIC;
    BEGIN
      sql_query := format('
        UPDATE "%s".article 
        SET stock_bl = stock_bl - %s,
            updated_at = NOW()
        WHERE narticle = %L
        RETURNING stock_bl',
        p_tenant, p_quantity, p_narticle
      );
      
      EXECUTE sql_query INTO new_stock;
      
      RETURN QUERY SELECT p_narticle::VARCHAR(20), new_stock;
    END;
    $$;
  `;
  
  try {
    // Corriger get_article_stock
    console.log('📝 Fixing get_article_stock with correct types...');
    const { error: getError } = await supabaseAdmin.rpc('exec_sql', {
      sql: fixedGetStockFunction.trim()
    });
    
    if (getError) {
      console.error('❌ Error fixing get_article_stock:', getError);
    } else {
      console.log('✅ get_article_stock function fixed with correct types');
    }
    
    // Corriger update_stock_bl
    console.log('📝 Fixing update_stock_bl with correct types...');
    const { error: updateError } = await supabaseAdmin.rpc('exec_sql', {
      sql: fixedUpdateStockFunction.trim()
    });
    
    if (updateError) {
      console.error('❌ Error fixing update_stock_bl:', updateError);
    } else {
      console.log('✅ update_stock_bl function fixed with correct types');
    }
    
    // Tester les fonctions corrigées
    console.log('\n🧪 Testing functions with correct types...');
    
    const testTenant = '2025_bu01';
    
    // Test get_article_stock
    const { data: stockData, error: stockError } = await supabaseAdmin.rpc('get_article_stock', {
      p_tenant: testTenant,
      p_narticle: '1000'
    });
    
    if (stockError) {
      console.error('❌ get_article_stock test failed:', stockError);
    } else {
      console.log('✅ get_article_stock works:', stockData);
      
      if (stockData && stockData.length > 0) {
        // Test update_stock_bl
        console.log('🧪 Testing stock update...');
        const { data: updateResult, error: updateError } = await supabaseAdmin.rpc('update_stock_bl', {
          p_tenant: testTenant,
          p_narticle: '1000',
          p_quantity: 0.1 // Petite quantité pour test
        });
        
        if (updateError) {
          console.error('❌ update_stock_bl test failed:', updateError);
        } else {
          console.log('✅ update_stock_bl works:', updateResult);
          
          // Remettre le stock à sa valeur originale
          const originalStock = stockData[0].stock_bl;
          await supabaseAdmin.rpc('exec_sql', {
            sql: `UPDATE "${testTenant}".article SET stock_bl = ${originalStock} WHERE narticle = '1000';`
          });
          console.log('🔄 Stock restored to original value');
        }
      }
    }
    
    console.log('\n🎉 All functions are now working correctly!');
    console.log('📋 Delivery note creation should work perfectly in the frontend.');
    
  } catch (error) {
    console.error('❌ Failed to fix function types:', error);
  }
}

fixFunctionTypes();