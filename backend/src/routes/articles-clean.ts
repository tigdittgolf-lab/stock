import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { tenantMiddleware, getTenantContext } from '../middleware/tenantMiddleware.js';

const articles = new Hono();

// Apply tenant middleware to all routes
articles.use('*', tenantMiddleware);

// GET /api/articles - Get all articles from tenant schema via RPC
articles.get('/', async (c) => {
  try {
    const tenant = getTenantContext(c);
    console.log(`🔍 Fetching articles from schema: ${tenant.schema}`);

    const { data: articlesData, error } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: tenant.schema
    });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      return c.json({ 
        success: true, 
        data: [], 
        message: 'RPC function not available. Please run the SQL script first.' 
      });
    }
    
    console.log(`✅ Found ${articlesData?.length || 0} articles in database`);
    
    return c.json({ 
      success: true, 
      data: articlesData || [],
      tenant: tenant.schema,
      source: 'real_database_via_rpc'
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
    console.log(`🔄 Force refresh articles from schema: ${tenant.schema}`);

    const { data: articlesData, error } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: tenant.schema
    });
    
    if (error) {
      console.error('❌ RPC Error in force-refresh:', error);
      return c.json({ success: false, data: [], message: 'RPC function not available' });
    }
    
    console.log(`✅ Force refresh: ${articlesData?.length || 0} articles found`);
    
    return c.json({ 
      success: true, 
      data: articlesData || [],
      tenant: tenant.schema,
      source: 'force_refresh_via_rpc'
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

    console.log(`🔍 Looking for article: ${id} in schema: ${tenant.schema}`);
    
    // Utiliser la fonction RPC spécifique pour récupérer un article par ID
    const { data: articleData, error } = await supabaseAdmin.rpc('get_article_by_id_from_tenant', {
      p_tenant: tenant.schema,
      p_narticle: id
    });
    
    if (error) {
      console.error('❌ RPC Error in GET /:id:', error);
      return c.json({ success: false, error: 'Article not found' }, 404);
    }
    
    if (articleData && articleData.length > 0) {
      const foundArticle = articleData[0];
      console.log(`✅ Found article ${id} in database:`, foundArticle);
      return c.json({ success: true, data: foundArticle });
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
    
    console.log(`🆕 Creating article in ${tenant.schema}:`, body.narticle);
    
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

    // Use RPC function to insert into real database
    const { data, error } = await supabaseAdmin.rpc('insert_article_to_tenant', {
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
    
    if (error) {
      console.error('❌ RPC Error creating article:', error);
      return c.json({ success: false, error: `Failed to create article: ${error.message}` }, 500);
    }
    
    console.log(`✅ Article created: ${data}`);
    
    return c.json({ 
      success: true, 
      message: `Article ${narticle} créé avec succès !`,
      data: { narticle, prix_vente: prix_vente.toFixed(2) }
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
    
    console.log(`🔄 Updating article ${id} in ${tenant.schema}`);
    
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

    // Use RPC function to update in real database
    const { data, error } = await supabaseAdmin.rpc('update_article_in_tenant', {
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
    
    if (error) {
      console.error('❌ RPC Error updating article:', error);
      return c.json({ success: false, error: `Failed to update article: ${error.message}` }, 500);
    }
    
    console.log(`✅ Article updated: ${data}`);
    
    return c.json({ 
      success: true, 
      message: `Article ${id} modifié avec succès !`,
      data: { narticle: id, prix_vente: prix_vente.toFixed(2) }
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

    console.log(`🗑️ Deleting article ${id} from ${tenant.schema}`);

    // Use RPC function to delete from real database
    const { data, error } = await supabaseAdmin.rpc('delete_article_from_tenant', {
      p_tenant: tenant.schema,
      p_narticle: id
    });
    
    if (error) {
      console.error('❌ RPC Error deleting article:', error);
      return c.json({ success: false, error: `Failed to delete article: ${error.message}` }, 500);
    }
    
    console.log(`✅ Article deleted: ${data}`);
    return c.json({ success: true, message: `Article ${id} supprimé avec succès !` });
    
  } catch (error) {
    console.error('Error deleting article:', error);
    return c.json({ success: false, error: 'Failed to delete article' }, 500);
  }
});

export default articles;