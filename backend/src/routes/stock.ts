import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { databaseRouter } from '../services/databaseRouter.js';
import { backendDatabaseService } from '../services/databaseService.js';

const stock = new Hono();

// Get stock summary
stock.get('/summary', async (c) => {
  try {
    const dbType = backendDatabaseService.getActiveDatabaseType();
    console.log(`🔍 Fetching stock summary from ${dbType} database`);

    const result = await backendDatabaseService.executeRPC('get_stock_summary', {});
    
    if (!result.success) {
      console.error('❌ RPC Error:', result.error);
      // Return fallback data
      return c.json({
        success: true,
        data: {
          total_articles: 0,
          total_stock_value: 0,
          total_reserved_stock: 0,
          low_stock_count: 0,
          out_of_stock_count: 0
        },
        message: 'Using fallback data (RPC not available)',
        database_type: dbType
      });
    }

    return c.json({
      success: true,
      data: result.data,
      database_type: dbType
    });
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    return c.json({ success: false, error: 'Failed to fetch stock summary' }, 500);
  }
});

// Get low stock alerts
stock.get('/low-stock', async (c) => {
  try {
    const dbType = backendDatabaseService.getActiveDatabaseType();
    console.log(`🔍 Fetching low stock alerts from ${dbType} database`);

    const result = await backendDatabaseService.executeRPC('get_low_stock_articles', {});
    
    if (!result.success) {
      console.error('❌ RPC Error:', result.error);
      return c.json({ 
        success: true, 
        data: [],
        message: 'RPC function not available',
        database_type: dbType
      });
    }

    return c.json({ 
      success: true, 
      data: result.data || [],
      database_type: dbType
    });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    return c.json({ success: false, error: 'Failed to fetch low stock alerts' }, 500);
  }
});

// Get stock movements
stock.get('/movements', async (c) => {
  try {
    const dbType = backendDatabaseService.getActiveDatabaseType();
    console.log(`🔍 Fetching stock movements from ${dbType} database`);

    const result = await backendDatabaseService.executeRPC('get_stock_movements', {});
    
    if (!result.success) {
      console.error('❌ RPC Error:', result.error);
      return c.json({ 
        success: true, 
        data: [],
        message: 'RPC function not available',
        database_type: dbType
      });
    }

    return c.json({ 
      success: true, 
      data: result.data || [],
      database_type: dbType
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return c.json({ success: false, error: 'Failed to fetch stock movements' }, 500);
  }
});

// Get stock movements by article
stock.get('/movements/:articleId', async (c) => {
  try {
    const articleId = c.req.param('articleId');
    const dbType = backendDatabaseService.getActiveDatabaseType();
    console.log(`🔍 Fetching stock movements for article ${articleId} from ${dbType} database`);

    const result = await backendDatabaseService.executeRPC('get_stock_movements_by_article', {
      p_narticle: articleId
    });
    
    if (!result.success) {
      console.error('❌ RPC Error:', result.error);
      return c.json({ 
        success: true, 
        data: [],
        message: 'RPC function not available',
        database_type: dbType
      });
    }

    return c.json({ 
      success: true, 
      data: result.data || [],
      database_type: dbType
    });
  } catch (error) {
    console.error('Error fetching article stock movements:', error);
    return c.json({ success: false, error: 'Failed to fetch article stock movements' }, 500);
  }
});

// Create stock entry (manual stock adjustment)
stock.post('/entry', async (c) => {
  try {
    const body = await c.req.json();
    const { narticle, qte, type_mouvement, commentaire } = body;

    const dbType = backendDatabaseService.getActiveDatabaseType();
    console.log(`🆕 Creating stock entry in ${dbType} database`);

    const result = await backendDatabaseService.executeRPC('create_stock_entry', {
      p_narticle: narticle,
      p_qte: qte,
      p_type_mouvement: type_mouvement,
      p_commentaire: commentaire
    });
    
    if (!result.success) {
      console.error('❌ RPC Error:', result.error);
      return c.json({ 
        success: false, 
        error: 'Failed to create stock entry',
        database_type: dbType
      }, 500);
    }

    return c.json({ 
      success: true, 
      data: result.data,
      database_type: dbType
    });
  } catch (error) {
    console.error('Error creating stock entry:', error);
    return c.json({ success: false, error: 'Failed to create stock entry' }, 500);
  }
});

// Get stock valuation by family
stock.get('/valuation/by-family', async (c) => {
  try {
    const dbType = backendDatabaseService.getActiveDatabaseType();
    console.log(`🔍 Fetching stock valuation by family from ${dbType} database`);

    const result = await backendDatabaseService.executeRPC('get_stock_valuation_by_family', {});
    
    if (!result.success) {
      console.error('❌ RPC Error:', result.error);
      return c.json({ 
        success: true, 
        data: [],
        message: 'RPC function not available',
        database_type: dbType
      });
    }

    return c.json({ 
      success: true, 
      data: result.data || [],
      database_type: dbType
    });
  } catch (error) {
    console.error('Error fetching stock valuation:', error);
    return c.json({ success: false, error: 'Failed to fetch stock valuation' }, 500);
  }
});

export default stock;
