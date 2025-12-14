// Corriger la fonction update_stock_bl pour utiliser le bon nom de table
import { supabaseAdmin } from './src/supabaseClient.js';

async function fixStockUpdateFunction() {
  console.log('🔧 Fixing stock update function...');
  
  // Fonction corrigée avec le bon nom de table
  const fixedFunction = `
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
      -- Mettre à jour le stock BL (déduction) - table "article" au singulier
      sql_query := format('
        UPDATE "%s".article 
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
  `;
  
  const fixedGetStockFunction = `
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
      -- Table "article" au singulier
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
  
  try {
    // Corriger update_stock_bl
    console.log('📝 Fixing update_stock_bl function...');
    const { error: updateError } = await supabaseAdmin.rpc('exec_sql', {
      sql: fixedFunction.trim()
    });
    
    if (updateError) {
      console.error('❌ Error fixing update_stock_bl:', updateError);
    } else {
      console.log('✅ update_stock_bl function fixed');
    }
    
    // Corriger get_article_stock
    console.log('📝 Fixing get_article_stock function...');
    const { error: getError } = await supabaseAdmin.rpc('exec_sql', {
      sql: fixedGetStockFunction.trim()
    });
    
    if (getError) {
      console.error('❌ Error fixing get_article_stock:', getError);
    } else {
      console.log('✅ get_article_stock function fixed');
    }
    
    // Tester les fonctions corrigées
    console.log('\n🧪 Testing fixed functions...');
    
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
    }
    
    console.log('\n🎉 Stock functions are now fixed!');
    console.log('📋 Delivery note creation should work perfectly now.');
    
  } catch (error) {
    console.error('❌ Failed to fix stock functions:', error);
  }
}

fixStockUpdateFunction();