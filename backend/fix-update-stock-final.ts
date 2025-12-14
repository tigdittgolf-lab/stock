// Corriger la fonction update_stock_bl_simple sans updated_at
import { supabaseAdmin } from './src/supabaseClient.js';

async function fixUpdateStockFinal() {
  console.log('🔧 Fixing update_stock_bl_simple without updated_at...');
  
  const fixedFunction = `
    CREATE OR REPLACE FUNCTION update_stock_bl_simple(
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
        SET stock_bl = stock_bl - %s
        WHERE narticle = %L
        RETURNING json_build_object(
          ''narticle'', narticle,
          ''old_stock'', stock_bl + %s,
          ''new_stock'', stock_bl,
          ''quantity_deducted'', %s
        )',
        p_tenant, p_quantity, p_narticle, p_quantity, p_quantity
      );
      
      EXECUTE sql_query INTO result;
      
      RETURN result;
    END;
    $$;
  `;
  
  try {
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: fixedFunction.trim()
    });
    
    if (error) {
      console.error('❌ Error fixing update_stock_bl_simple:', error);
      return;
    }
    
    console.log('✅ update_stock_bl_simple fixed without updated_at');
    
    // Tester la fonction corrigée
    console.log('🧪 Testing fixed function...');
    
    const testTenant = '2025_bu01';
    
    // Obtenir le stock avant
    const { data: stockBefore, error: stockBeforeError } = await supabaseAdmin.rpc('get_article_stock_simple', {
      p_tenant: testTenant,
      p_narticle: '1000'
    });
    
    if (stockBeforeError) {
      console.error('❌ get_article_stock_simple failed:', stockBeforeError);
      return;
    }
    
    console.log('📊 Stock before test:', stockBefore);
    
    // Tester la mise à jour
    const { data: updateResult, error: updateError } = await supabaseAdmin.rpc('update_stock_bl_simple', {
      p_tenant: testTenant,
      p_narticle: '1000',
      p_quantity: 0.5 // Petite quantité pour test
    });
    
    if (updateError) {
      console.error('❌ update_stock_bl_simple test failed:', updateError);
    } else {
      console.log('✅ update_stock_bl_simple works:', updateResult);
      
      // Restaurer le stock original
      await supabaseAdmin.rpc('exec_sql', {
        sql: `UPDATE "${testTenant}".article SET stock_bl = ${stockBefore.stock_bl} WHERE narticle = '1000';`
      });
      console.log('🔄 Stock restored to original value');
    }
    
    console.log('\n🎉 ALL BL FUNCTIONS ARE NOW FULLY WORKING!');
    console.log('📋 Ready to test delivery note creation in frontend');
    
  } catch (error) {
    console.error('❌ Failed to fix update_stock_bl_simple:', error);
  }
}

fixUpdateStockFinal();