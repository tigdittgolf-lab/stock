
// Endpoints sales propres - SANS DONNÉES EN DUR
import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';

const sales = new Hono();

// Middleware pour extraire le tenant
sales.use('*', async (c, next) => {
  const tenant = c.req.header('X-Tenant');
  if (tenant) {
    c.set('tenant', tenant);
  }
  await next();
});

// GET /api/sales/articles - Articles via RPC uniquement
sales.get('/articles', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`🔍 Sales: Fetching articles from schema: ${tenant}`);

    const { data: articlesData, error } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });
    
    if (error) {
      console.error('❌ RPC Error in sales/articles:', error);
      return c.json({ success: true, data: [], message: 'RPC function not available' });
    }
    
    console.log(`✅ Sales articles: ${articlesData?.length || 0} found`);
    
    return c.json({ 
      success: true, 
      data: articlesData || [],
      tenant: tenant,
      source: 'real_database_via_rpc'
    });
    
  } catch (error) {
    console.error('Error in sales/articles:', error);
    return c.json({ success: true, data: [], error: 'RPC not available' });
  }
});

// GET /api/sales/clients - Clients via RPC uniquement
sales.get('/clients', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`🔍 Sales: Fetching clients from schema: ${tenant}`);

    const { data: clientsData, error } = await supabaseAdmin.rpc('get_clients_by_tenant', {
      p_tenant: tenant
    });
    
    if (error) {
      console.error('❌ RPC Error in sales/clients:', error);
      return c.json({ success: true, data: [], message: 'RPC function not available' });
    }
    
    console.log(`✅ Sales clients: ${clientsData?.length || 0} found`);
    
    return c.json({ 
      success: true, 
      data: clientsData || [],
      tenant: tenant,
      source: 'real_database_via_rpc'
    });
    
  } catch (error) {
    console.error('Error in sales/clients:', error);
    return c.json({ success: true, data: [], error: 'RPC not available' });
  }
});

// GET /api/sales/suppliers - Fournisseurs via RPC uniquement
sales.get('/suppliers', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`🔍 Sales: Fetching suppliers from schema: ${tenant}`);

    const { data: suppliersData, error } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant
    });
    
    if (error) {
      console.error('❌ RPC Error in sales/suppliers:', error);
      return c.json({ success: true, data: [], message: 'RPC function not available' });
    }
    
    console.log(`✅ Sales suppliers: ${suppliersData?.length || 0} found`);
    
    return c.json({ 
      success: true, 
      data: suppliersData || [],
      tenant: tenant,
      source: 'real_database_via_rpc'
    });
    
  } catch (error) {
    console.error('Error in sales/suppliers:', error);
    return c.json({ success: true, data: [], error: 'RPC not available' });
  }
});

// GET /api/sales/suppliers/:id - Vérifier un fournisseur spécifique
sales.get('/suppliers/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`🔍 Sales: Checking supplier ${id} in schema: ${tenant}`);

    const { data: suppliersData, error } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant
    });
    
    if (error) {
      console.error('❌ RPC Error in sales/suppliers/:id:', error);
      return c.json({ success: false, error: 'RPC function not available' }, 404);
    }
    
    const supplier = suppliersData?.find((s: any) => s.nfournisseur === id);
    
    if (supplier) {
      return c.json({ success: true, data: supplier });
    } else {
      return c.json({ success: false, error: 'Supplier not found' }, 404);
    }
    
  } catch (error) {
    console.error('Error in sales/suppliers/:id:', error);
    return c.json({ success: false, error: 'Internal error' }, 500);
  }
});

// POST /api/sales/suppliers - Créer un fournisseur
sales.post('/suppliers', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    console.log(`📝 Sales: Creating supplier in schema: ${tenant}`, body);

    // Utiliser la vraie fonction RPC pour insérer dans la base de données
    const { data, error } = await supabaseAdmin.rpc('insert_supplier_to_tenant', {
      p_tenant: tenant,
      p_nfournisseur: body.nfournisseur || body.code || `F${Date.now()}`,
      p_nom_fournisseur: body.nom_fournisseur || body.name || '',
      p_resp_fournisseur: body.resp_fournisseur || body.responsable || '',
      p_adresse_fourni: body.adresse_fourni || body.adresse || '',
      p_tel: body.tel || body.telephone || '',
      p_tel1: body.tel1 || '',
      p_tel2: body.tel2 || '',
      p_caf: parseFloat(body.caf || '0'),
      p_cabl: parseFloat(body.cabl || '0'),
      p_email: body.email || '',
      p_commentaire: body.commentaire || ''
    });
    
    if (error) {
      console.error('❌ RPC Error creating supplier:', error);
      return c.json({ success: false, error: `Failed to create supplier: ${error.message}` }, 500);
    }
    
    console.log(`✅ Supplier created: ${data}`);
    
    return c.json({ 
      success: true, 
      message: 'Fournisseur créé avec succès !',
      data: { nfournisseur: body.nfournisseur || body.code }
    });
    
  } catch (error) {
    console.error('Error in POST sales/suppliers:', error);
    return c.json({ success: false, error: 'Failed to create supplier' }, 500);
  }
});

export default sales;
