import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { databaseRouter } from '../services/databaseRouter.js';
import { tenantMiddleware, getTenantContext } from '../middleware/tenantMiddleware.js';
import { backendDatabaseService } from '../services/databaseService.js';

const clients = new Hono();

// Apply tenant middleware to all routes
clients.use('*', tenantMiddleware);

// GET /api/clients - Get all clients from tenant schema via RPC
clients.get('/', async (c) => {
  try {
    const tenant = getTenantContext(c);
    const dbType = backendDatabaseService.getActiveDatabaseType();
    console.log(`🔍 Fetching clients from schema: ${tenant.schema} (DB: ${dbType})`);

    const result = await backendDatabaseService.executeRPC('get_clients_by_tenant', {
      p_tenant: tenant.schema
    });
    
    if (!result.success) {
      console.error('❌ Database Error:', result.error);
      return c.json({ 
        success: true, 
        data: [], 
        message: `Database function not available (${dbType}). Please check configuration.`,
        database_type: backendDatabaseService.getActiveDatabaseType()
      });
    }
    
    console.log(`✅ Found ${result.data?.length || 0} clients in ${dbType} database`);
    
    return c.json({ 
      success: true, 
      data: result.data || [],
      tenant: tenant.schema,
      source: `${dbType}_database`,
      database_type: dbType
    });
    
  } catch (error) {
    console.error('Error fetching clients:', error);
    return c.json({ success: false, error: 'Failed to fetch clients' }, 500);
  }
});

// GET /api/clients/:id - Get client by ID from tenant schema
clients.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = getTenantContext(c);

    console.log(`🔍 Looking for client: ${id} in schema: ${tenant.schema}`);
    
    const { data: clientsData, error } = await databaseRouter.rpc('get_clients_by_tenant', {
      p_tenant: tenant.schema
    });
    
    if (error) {
      console.error('❌ RPC Error in GET /:id:', error);
      return c.json({ success: false, error: 'Client not found' }, 404);
    }
    
    const foundClient = clientsData?.find((client: any) => client.nclient === id);
    
    if (foundClient) {
      console.log(`✅ Found client ${id} in database`);
      return c.json({ success: true, data: foundClient , database_type: backendDatabaseService.getActiveDatabaseType() });
    }

    console.log(`❌ Client ${id} not found`);
    return c.json({ success: false, error: 'Client not found' }, 404);
  } catch (error) {
    console.error('Error fetching client:', error);
    return c.json({ success: false, error: 'Client not found' }, 404);
  }
});

// POST /api/clients - Create new client in tenant schema via RPC
clients.post('/', async (c) => {
  try {
    const tenant = getTenantContext(c);
    const body = await c.req.json();
    
    console.log(`🆕 Creating client in ${tenant.schema}:`, body.nclient);
    
    const {
      nclient,
      raison_sociale,
      adresse,
      contact_person,
      c_affaire_fact,
      c_affaire_bl,
      nrc,
      date_rc,
      lieu_rc,
      i_fiscal,
      n_article,
      tel,
      email,
      commentaire
    } = body;

    // Use RPC function to insert into real database
    const { data, error } = await databaseRouter.rpc('insert_client_to_tenant', {
      p_tenant: tenant.schema,
      p_nclient: nclient,
      p_raison_sociale: raison_sociale,
      p_adresse: adresse,
      p_contact_person: contact_person,
      p_c_affaire_fact: c_affaire_fact || 0,
      p_c_affaire_bl: c_affaire_bl || 0,
      p_nrc: nrc || '',
      p_date_rc: date_rc || null,
      p_lieu_rc: lieu_rc || '',
      p_i_fiscal: i_fiscal || '',
      p_n_article: n_article || '',
      p_tel: tel || '',
      p_email: email || '',
      p_commentaire: commentaire || ''
    });
    
    if (error) {
      console.error('❌ RPC Error creating client:', error);
      return c.json({ success: false, error: `Failed to create client: ${error.message}` }, 500);
    }
    
    console.log(`✅ Client created: ${data}`);
    
    return c.json({ 
      success: true, 
      message: `Client ${nclient} créé avec succès !`,
      data: { nclient }
    });
    
  } catch (error) {
    console.error('Error creating client:', error);
    return c.json({ success: false, error: 'Failed to create client' }, 500);
  }
});

// PUT /api/clients/:id - Update client in tenant schema via RPC
clients.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = getTenantContext(c);
    const body = await c.req.json();
    
    console.log(`🔄 Updating client ${id} in ${tenant.schema}`);
    
    const {
      raison_sociale,
      adresse,
      contact_person,
      tel,
      email,
      commentaire
    } = body;

    // Use RPC function to update in real database
    const { data, error } = await databaseRouter.rpc('update_client_in_tenant', {
      p_tenant: tenant.schema,
      p_nclient: id,
      p_raison_sociale: raison_sociale,
      p_adresse: adresse,
      p_contact_person: contact_person,
      p_tel: tel || '',
      p_email: email || '',
      p_commentaire: commentaire || ''
    });
    
    if (error) {
      console.error('❌ RPC Error updating client:', error);
      return c.json({ success: false, error: `Failed to update client: ${error.message}` }, 500);
    }
    
    console.log(`✅ Client updated: ${data}`);
    
    return c.json({ 
      success: true, 
      message: `Client ${id} modifié avec succès !`,
      data: { nclient: id }
    });

  } catch (error) {
    console.error('Error updating client:', error);
    return c.json({ success: false, error: 'Failed to update client' }, 500);
  }
});

// DELETE /api/clients/:id - Delete client from tenant schema via RPC
clients.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = getTenantContext(c);

    console.log(`🗑️ Deleting client ${id} from ${tenant.schema}`);

    // Use RPC function to delete from real database
    const { data, error } = await databaseRouter.rpc('delete_client_from_tenant', {
      p_tenant: tenant.schema,
      p_nclient: id
    });
    
    if (error) {
      console.error('❌ RPC Error deleting client:', error);
      return c.json({ success: false, error: `Failed to delete client: ${error.message}` }, 500);
    }
    
    console.log(`✅ Client deleted: ${data}`);
    return c.json({ success: true, message: `Client ${id} supprimé avec succès !` });
    
  } catch (error) {
    console.error('Error deleting client:', error);
    return c.json({ success: false, error: 'Failed to delete client' }, 500);
  }
});

export default clients;