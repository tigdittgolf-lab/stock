import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { databaseRouter } from '../services/databaseRouter.js';
import { backendDatabaseService } from '../services/databaseService.js';

const clients = new Hono();

// Middleware to extract tenant from header
clients.use('*', async (c, next) => {
  const tenant = c.req.header('X-Tenant');
  if (tenant) {
    c.set('tenant', tenant);
  }
  await next();
});

// Get all clients for tenant
clients.get('/', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`Fetching clients for tenant: ${tenant}`);

    const { data, error } = await databaseRouter.rpc('exec_sql', {
      sql: `SELECT * FROM "${tenant}".client ORDER BY nclient;`
    });

    console.log('Clients query result:', { data, error });

    if (error) {
      console.error('Error fetching clients:', error);
      return c.json({ success: false, error: `Failed to fetch clients: ${error.message}` }, 500);
    }

    return c.json({ success: true, data: data || [] , database_type: backendDatabaseService.getActiveDatabaseType() });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return c.json({ success: false, error: 'Failed to fetch clients' }, 500);
  }
});

// Get client by ID
clients.get('/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const clientId = c.req.param('id');
    
    const { data, error } = await databaseRouter.rpc('exec_sql', {
      sql: `SELECT * FROM "${tenant}".client WHERE nclient = '${clientId}' LIMIT 1;`
    });

    if (error) {
      console.error('Error fetching client:', error);
      return c.json({ success: false, error: 'Failed to fetch client' }, 500);
    }

    if (!data || data.length === 0) {
      return c.json({ success: false, error: 'Client not found' }, 404);
    }

    return c.json({ success: true, data: data[0] , database_type: backendDatabaseService.getActiveDatabaseType() });
  } catch (error) {
    console.error('Error fetching client:', error);
    return c.json({ success: false, error: 'Failed to fetch client' }, 500);
  }
});

// Create new client
clients.post('/', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const {
      nclient,
      raison_sociale,
      adresse,
      contact_person,
      tel,
      email,
      nrc,
      i_fiscal,
      commentaire
    } = body;

    if (!nclient || !raison_sociale) {
      return c.json({ success: false, error: 'Client code and company name are required' }, 400);
    }

    const { error } = await databaseRouter.rpc('exec_sql', {
      sql: `
        INSERT INTO "${tenant}".client (
          nclient, raison_sociale, adresse, contact_person, tel, email,
          nrc, i_fiscal, commentaire, c_affaire_fact, c_affaire_bl
        ) VALUES (
          '${nclient}', '${raison_sociale}', '${adresse || ''}', '${contact_person || ''}',
          '${tel || ''}', '${email || ''}', '${nrc || ''}', '${i_fiscal || ''}',
          '${commentaire || ''}', 0, 0
        );
      `
    });

    if (error) {
      console.error('Error creating client:', error);
      return c.json({ success: false, error: 'Failed to create client' }, 500);
    }

    return c.json({ success: true, message: 'Client created successfully' });
  } catch (error) {
    console.error('Error creating client:', error);
    return c.json({ success: false, error: 'Failed to create client' }, 500);
  }
});

export default clients;