import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { tenantMiddleware, getTenantContext } from '../middleware/tenantMiddleware.js';

const families = new Hono();

// Apply tenant middleware to all routes
families.use('*', tenantMiddleware);

// GET /api/families - Get all families from tenant schema
families.get('/', async (c) => {
  try {
    const tenant = getTenantContext(c);
    console.log(`Fetching families from schema: ${tenant.schema}`);

    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT famille FROM "${tenant.schema}".famille_art
        ORDER BY famille;
      `
    });

    if (error) throw error;

    return c.json({ 
      success: true, 
      data: data || [],
      tenant: tenant.schema
    });
  } catch (error) {
    console.error('Error fetching families:', error);
    return c.json({ success: false, error: 'Failed to fetch families' }, 500);
  }
});

// POST /api/families - Create new family in tenant schema
families.post('/', async (c) => {
  try {
    const tenant = getTenantContext(c);
    const body = await c.req.json();
    
    const { famille } = body;

    if (!famille) {
      return c.json({ success: false, error: 'Family name is required' }, 400);
    }

    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        INSERT INTO "${tenant.schema}".famille_art (famille)
        VALUES ('${famille}')
        RETURNING *;
      `
    });

    if (error) throw error;

    return c.json({ 
      success: true, 
      data: data && data.length > 0 ? data[0] : { famille }
    });
  } catch (error) {
    console.error('Error creating family:', error);
    return c.json({ success: false, error: 'Failed to create family' }, 500);
  }
});

// DELETE /api/families/:name - Delete family from tenant schema
families.delete('/:name', async (c) => {
  try {
    const name = c.req.param('name');
    const tenant = getTenantContext(c);

    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DELETE FROM "${tenant.schema}".famille_art 
        WHERE famille = '${name}'
        RETURNING *;
      `
    });

    if (error) throw error;
    if (!data || data.length === 0) {
      return c.json({ success: false, error: 'Family not found' }, 404);
    }

    return c.json({ success: true, message: 'Family deleted successfully' });
  } catch (error) {
    console.error('Error deleting family:', error);
    return c.json({ success: false, error: 'Failed to delete family' }, 500);
  }
});

export default families;