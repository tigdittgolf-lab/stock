
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

// GET /api/sales/clients/:id - Vérifier un client spécifique
sales.get('/clients/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`🔍 Sales: Checking client ${id} in schema: ${tenant}`);

    const { data: clientsData, error } = await supabaseAdmin.rpc('get_clients_by_tenant', {
      p_tenant: tenant
    });
    
    if (error) {
      console.error('❌ RPC Error in sales/clients/:id:', error);
      return c.json({ success: false, error: 'RPC function not available' }, 404);
    }
    
    const client = clientsData?.find((c: any) => c.nclient === id);
    
    if (client) {
      return c.json({ success: true, data: client });
    } else {
      return c.json({ success: false, error: 'Client not found' }, 404);
    }
    
  } catch (error) {
    console.error('Error in sales/clients/:id:', error);
    return c.json({ success: false, error: 'Internal error' }, 500);
  }
});

// POST /api/sales/clients - Créer un client
sales.post('/clients', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    console.log(`📝 Sales: Creating client in schema: ${tenant}`, body);

    // Utiliser la vraie fonction RPC pour insérer dans la base de données
    const { data, error } = await supabaseAdmin.rpc('insert_client_to_tenant', {
      p_tenant: tenant,
      p_nclient: body.nclient,
      p_raison_sociale: body.raison_sociale,
      p_adresse: body.adresse || '',
      p_contact_person: body.contact_person || '',
      p_tel: body.tel || '',
      p_email: body.email || '',
      p_nrc: body.nrc || '',
      p_i_fiscal: body.i_fiscal || '',
      p_c_affaire_fact: parseFloat(body.c_affaire_fact || '0'),
      p_c_affaire_bl: parseFloat(body.c_affaire_bl || '0')
    });
    
    if (error) {
      console.error('❌ RPC Error creating client:', error);
      return c.json({ success: false, error: `Failed to create client: ${error.message}` }, 500);
    }
    
    console.log(`✅ Client created: ${data}`);
    
    return c.json({ 
      success: true, 
      message: 'Client créé avec succès !',
      data: { nclient: body.nclient }
    });
    
  } catch (error) {
    console.error('Error in POST sales/clients:', error);
    return c.json({ success: false, error: 'Failed to create client' }, 500);
  }
});

// PUT /api/sales/clients/:id - Modifier un client
sales.put('/clients/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    console.log(`📝 Sales: Updating client ${id} in schema: ${tenant}`, body);

    // Utiliser la vraie fonction RPC pour modifier dans la base de données
    const { data, error } = await supabaseAdmin.rpc('update_client_in_tenant', {
      p_tenant: tenant,
      p_nclient: id,
      p_raison_sociale: body.raison_sociale,
      p_adresse: body.adresse || '',
      p_contact_person: body.contact_person || '',
      p_tel: body.tel || '',
      p_email: body.email || '',
      p_nrc: body.nrc || '',
      p_i_fiscal: body.i_fiscal || '',
      p_c_affaire_fact: parseFloat(body.c_affaire_fact || '0'),
      p_c_affaire_bl: parseFloat(body.c_affaire_bl || '0')
    });
    
    if (error) {
      console.error('❌ RPC Error updating client:', error);
      return c.json({ success: false, error: `Failed to update client: ${error.message}` }, 500);
    }
    
    console.log(`✅ Client updated: ${data}`);
    
    return c.json({ 
      success: true, 
      message: 'Client modifié avec succès !',
      data: { nclient: id }
    });
    
  } catch (error) {
    console.error('Error in PUT sales/clients/:id:', error);
    return c.json({ success: false, error: 'Failed to update client' }, 500);
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
