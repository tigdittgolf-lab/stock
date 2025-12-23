import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { tenantMiddleware, getTenantContext } from '../middleware/tenantMiddleware.js';
import { backendDatabaseService } from '../services/databaseService.js';

const articles = new Hono();

// Apply tenant middleware to all routes
articles.use('*', tenantMiddleware);

// GET /api/articles - Get all articles from tenant schema via RPC
articles.get('/', async (c) => {
  try {
    const tenant = getTenantContext(c);
    const dbType = backendDatabaseService.getActiveDatabaseType();
    console.log(`🔍 Fetching articles from schema: ${tenant.schema} (DB: ${dbType})`);

    const result = await backendDatabaseService.executeRPC('get_articles_by_tenant', {
      p_tenant: tenant.schema
    });
    
    if (!result.success) {
      console.error('❌ Database Error:', result.error);
      return c.json({ 
        success: true, 
        data: [], 
        message: `Database function not available (${dbType}). Please check configuration.` 
      });
    }
    
    console.log(`✅ Found ${result.data?.length || 0} articles in ${dbType} database`);
    
    return c.json({ 
      success: true, 
      data: result.data || [],
      tenant: tenant.schema,
      source: `${dbType}_database`,
      database_type: dbType
    });
    
  } catch (error) {
    console.error('Error fetching articles:', error);
    return c.json({ success: false, error: 'Failed to fetch articles' }, 500);
  }
});

// GET /api/articles/force-refresh - Force refresh des articles
articles.get('/force-refresh', async (c) => {
  try {
    const tenant = getTenantContext(c);
    const dbType = backendDatabaseService.getActiveDatabaseType();
    console.log(`🔄 Force refresh articles from schema: ${tenant.schema} (DB: ${dbType})`);

    const result = await backendDatabaseService.executeRPC('get_articles_by_tenant', {
      p_tenant: tenant.schema
    });
    
    if (!result.success) {
      console.error('❌ RPC Error in force-refresh:', result.error);
      return c.json({ success: false, data: [], message: `RPC function not available (${dbType})` });
    }
    
    console.log(`✅ Force refresh: ${result.data?.length || 0} articles found`);
    
    return c.json({ 
      success: true, 
      data: result.data || [],
      tenant: tenant.schema,
      source: `force_refresh_via_${dbType}`,
      database_type: dbType
    });
    
  } catch (error) {
    console.error('Error in force-refresh:', error);
    return c.json({ success: false, data: [], error: 'Force refresh failed' });
  }
});

// GET /api/articles/:id - Get article by ID from tenant schema
articles.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = getTenantContext(c);
    const dbType = backendDatabaseService.getActiveDatabaseType();

    console.log(`🔍 Looking for article: ${id} in schema: ${tenant.schema} (DB: ${dbType})`);
    
    // Utiliser le service de base de données pour récupérer un article par ID
    const result = await backendDatabaseService.executeRPC('get_article_by_id_from_tenant', {
      p_tenant: tenant.schema,
      p_narticle: id
    });
    
    if (!result.success) {
      console.error('❌ RPC Error in GET /:id:', result.error);
      return c.json({ success: false, error: 'Article not found' }, 404);
    }
    
    if (result.data && result.data.length > 0) {
      const foundArticle = result.data[0];
      console.log(`✅ Found article ${id} in ${dbType} database:`, foundArticle);
      return c.json({ success: true, data: foundArticle, database_type: dbType });
    }

    console.log(`❌ Article ${id} not found`);
    return c.json({ success: false, error: 'Article not found' }, 404);
  } catch (error) {
    console.error('Error fetching article:', error);
    return c.json({ success: false, error: 'Article not found' }, 404);
  }
});

// POST /api/articles - Create new article in tenant schema via RPC
articles.post('/', async (c) => {
  try {
    const tenant = getTenantContext(c);
    const body = await c.req.json();
    const dbType = backendDatabaseService.getActiveDatabaseType();
    
    console.log(`🆕 Creating article in ${tenant.schema} (DB: ${dbType}):`, body.narticle);
    
    const {
      narticle,
      famille,
      designation,
      nfournisseur,
      prix_unitaire,
      marge,
      tva,
      seuil,
      stock_f,
      stock_bl
    } = body;

    // Calculate prix_vente
    const prix_vente = prix_unitaire * (1 + marge / 100) * (1 + tva / 100);

    // Use database service to insert into active database
    const result = await backendDatabaseService.executeRPC('insert_article_to_tenant', {
      p_tenant: tenant.schema,
      p_narticle: narticle,
      p_famille: famille,
      p_designation: designation,
      p_nfournisseur: nfournisseur || null,
      p_prix_unitaire: prix_unitaire,
      p_marge: marge,
      p_tva: tva,
      p_prix_vente: prix_vente,
      p_seuil: seuil,
      p_stock_f: stock_f,
      p_stock_bl: stock_bl
    });
    
    if (!result.success) {
      console.error(`❌ ${dbType} Error creating article:`, result.error);
      return c.json({ success: false, error: `Failed to create article: ${result.error}` }, 500);
    }
    
    console.log(`✅ Article created in ${dbType}:`, result.data);
    
    return c.json({ 
      success: true, 
      message: `Article ${narticle} créé avec succès dans ${dbType} !`,
      data: { narticle, prix_vente: prix_vente.toFixed(2) },
      database_type: dbType
    });
    
  } catch (error) {
    console.error('Error creating article:', error);
    return c.json({ success: false, error: 'Failed to create article' }, 500);
  }
});

// PUT /api/articles/:id - Update article in tenant schema via RPC
articles.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = getTenantContext(c);
    const body = await c.req.json();
    const dbType = backendDatabaseService.getActiveDatabaseType();
    
    console.log(`🔄 Updating article ${id} in ${tenant.schema} (DB: ${dbType})`);
    
    const {
      famille,
      designation,
      nfournisseur,
      prix_unitaire,
      marge,
      tva,
      seuil,
      stock_f,
      stock_bl
    } = body;

    // Calculate prix_vente
    const prix_vente = prix_unitaire * (1 + marge / 100) * (1 + tva / 100);

    // Use database service to update in active database
    const result = await backendDatabaseService.executeRPC('update_article_in_tenant', {
      p_tenant: tenant.schema,
      p_narticle: id,
      p_famille: famille,
      p_designation: designation,
      p_nfournisseur: nfournisseur || null,
      p_prix_unitaire: prix_unitaire,
      p_marge: marge,
      p_tva: tva,
      p_prix_vente: prix_vente,
      p_seuil: seuil,
      p_stock_f: stock_f,
      p_stock_bl: stock_bl
    });
    
    if (!result.success) {
      console.error(`❌ ${dbType} Error updating article:`, result.error);
      return c.json({ success: false, error: `Failed to update article: ${result.error}` }, 500);
    }
    
    console.log(`✅ Article updated in ${dbType}:`, result.data);
    
    return c.json({ 
      success: true, 
      message: `Article ${id} modifié avec succès dans ${dbType} !`,
      data: { narticle: id, prix_vente: prix_vente.toFixed(2) },
      database_type: dbType
    });

  } catch (error) {
    console.error('Error updating article:', error);
    return c.json({ success: false, error: 'Failed to update article' }, 500);
  }
});

// DELETE /api/articles/:id - Delete article from tenant schema via RPC
articles.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = getTenantContext(c);
    const dbType = backendDatabaseService.getActiveDatabaseType();

    console.log(`🗑️ Deleting article ${id} from ${tenant.schema} (DB: ${dbType})`);

    // Use database service to delete from active database
    const result = await backendDatabaseService.executeRPC('delete_article_from_tenant', {
      p_tenant: tenant.schema,
      p_narticle: id
    });
    
    if (!result.success) {
      console.error(`❌ ${dbType} Error deleting article:`, result.error);
      return c.json({ success: false, error: `Failed to delete article: ${result.error}` }, 500);
    }
    
    console.log(`✅ Article deleted from ${dbType}:`, result.data);
    return c.json({ 
      success: true, 
      message: `Article ${id} supprimé avec succès de ${dbType} !`,
      database_type: dbType
    });
    
  } catch (error) {
    console.error('Error deleting article:', error);
    return c.json({ success: false, error: 'Failed to delete article' }, 500);
  }
});

export default articles;