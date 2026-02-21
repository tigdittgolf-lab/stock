import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { databaseRouter } from '../services/databaseRouter.js';
import { tenantMiddleware, getTenantContext } from '../middleware/tenantMiddleware.js';
import { backendDatabaseService } from '../services/databaseService.js';

const suppliers = new Hono();

// Apply tenant middleware to all routes
suppliers.use('*', tenantMiddleware);

// GET /api/suppliers - Get all suppliers from tenant schema via RPC
suppliers.get('/', async (c) => {
  try {
    const tenant = getTenantContext(c);
    const dbType = backendDatabaseService.getActiveDatabaseType();
    console.log(`🔍 Fetching suppliers from schema: ${tenant.schema} (DB: ${dbType})`);

    const result = await backendDatabaseService.executeRPC('get_suppliers_by_tenant', {
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
    
    console.log(`✅ Found ${result.data?.length || 0} suppliers in ${dbType} database`);
    
    return c.json({ 
      success: true, 
      data: result.data || [],
      tenant: tenant.schema,
      source: `${dbType}_database`,
      database_type: dbType
    });
    
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return c.json({ success: false, error: 'Failed to fetch suppliers' }, 500);
  }
});

// GET /api/suppliers/:id - Get supplier by ID from tenant schema
suppliers.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = getTenantContext(c);
    const dbType = backendDatabaseService.getActiveDatabaseType();

    console.log(`🔍 Looking for supplier: ${id} in schema: ${tenant.schema} (DB: ${dbType})`);
    
    const result = await backendDatabaseService.executeRPC('get_suppliers_by_tenant', {
      p_tenant: tenant.schema
    });
    
    if (!result.success) {
      console.error('❌ Database Error in GET /:id:', result.error);
      return c.json({ success: false, error: 'Supplier not found' }, 404);
    }
    
    const foundSupplier = result.data?.find((supplier: any) => supplier.nfournisseur === id);
    
    if (foundSupplier) {
      console.log(`✅ Found supplier ${id} in ${dbType} database`);
      return c.json({ success: true, data: foundSupplier, database_type: dbType });
    }

    console.log(`❌ Supplier ${id} not found`);
    return c.json({ success: false, error: 'Supplier not found' }, 404);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return c.json({ success: false, error: 'Supplier not found' }, 404);
  }
});

// POST /api/suppliers - Create new supplier in tenant schema via RPC
suppliers.post('/', async (c) => {
  try {
    const tenant = getTenantContext(c);
    const body = await c.req.json();
    const dbType = backendDatabaseService.getActiveDatabaseType();
    
    console.log(`🆕 Creating supplier in ${tenant.schema} (DB: ${dbType}):`, body.nfournisseur);
    
    // Use database service to insert into active database
    const result = await backendDatabaseService.executeRPC('insert_supplier_to_tenant', {
      p_tenant: tenant.schema,
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
    
    if (!result.success) {
      console.error(`❌ ${dbType} Error creating supplier:`, result.error);
      return c.json({ success: false, error: `Failed to create supplier: ${result.error}` }, 500);
    }
    
    console.log(`✅ Supplier created in ${dbType}:`, result.data);
    
    return c.json({ 
      success: true, 
      message: `Fournisseur créé avec succès dans ${dbType} !`,
      data: { nfournisseur: body.nfournisseur || body.code },
      database_type: dbType
    });
    
  } catch (error) {
    console.error('Error creating supplier:', error);
    return c.json({ success: false, error: 'Failed to create supplier' }, 500);
  }
});

// PUT /api/suppliers/:id - Update supplier in tenant schema via RPC
suppliers.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = getTenantContext(c);
    const body = await c.req.json();
    const dbType = backendDatabaseService.getActiveDatabaseType();
    
    console.log(`🔄 Updating supplier ${id} in ${tenant.schema} (DB: ${dbType})`);
    
    const {
      nom_fournisseur,
      resp_fournisseur,
      adresse_fourni,
      tel,
      email,
      caf,
      cabl,
      commentaire
    } = body;

    // Use database service to update in active database
    const result = await backendDatabaseService.executeRPC('update_supplier_in_tenant', {
      p_tenant: tenant.schema,
      p_nfournisseur: id,
      p_nom_fournisseur: nom_fournisseur || '',
      p_resp_fournisseur: resp_fournisseur || '',
      p_adresse_fourni: adresse_fourni || '',
      p_tel: tel || '',
      p_email: email || '',
      p_caf: caf || 0,
      p_cabl: cabl || 0,
      p_commentaire: commentaire || ''
    });
    
    if (!result.success) {
      console.error(`❌ ${dbType} Error updating supplier:`, result.error);
      return c.json({ success: false, error: `Failed to update supplier: ${result.error}` }, 500);
    }
    
    console.log(`✅ Supplier updated in ${dbType}:`, result.data);
    
    return c.json({ 
      success: true, 
      message: `Fournisseur ${id} modifié avec succès dans ${dbType} !`,
      data: { nfournisseur: id },
      database_type: dbType
    });

  } catch (error) {
    console.error('Error updating supplier:', error);
    return c.json({ success: false, error: 'Failed to update supplier' }, 500);
  }
});

// DELETE /api/suppliers/:id - Delete supplier from tenant schema via RPC
suppliers.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = getTenantContext(c);
    const dbType = backendDatabaseService.getActiveDatabaseType();

    console.log(`🗑️ Deleting supplier ${id} from ${tenant.schema} (DB: ${dbType})`);

    // Use database service to delete from active database
    const result = await backendDatabaseService.executeRPC('delete_supplier_from_tenant', {
      p_tenant: tenant.schema,
      p_nfournisseur: id
    });
    
    if (!result.success) {
      console.error(`❌ ${dbType} Error deleting supplier:`, result.error);
      return c.json({ success: false, error: `Failed to delete supplier: ${result.error}` }, 500);
    }
    
    console.log(`✅ Supplier deleted from ${dbType}:`, result.data);
    return c.json({ 
      success: true, 
      message: `Fournisseur ${id} supprimé avec succès de ${dbType} !`,
      database_type: dbType
    });
    
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return c.json({ success: false, error: 'Failed to delete supplier' }, 500);
  }
});

export default suppliers;