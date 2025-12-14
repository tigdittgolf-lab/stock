import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { tenantMiddleware, getTenantContext } from '../middleware/tenantMiddleware.js';

const suppliers = new Hono();

// Apply tenant middleware to all routes
suppliers.use('*', tenantMiddleware);

// GET /api/suppliers - Get all suppliers from tenant schema via RPC
suppliers.get('/', async (c) => {
  try {
    const tenant = getTenantContext(c);
    console.log(`🔍 Fetching suppliers from schema: ${tenant.schema}`);

    const { data: suppliersData, error } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
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
    
    console.log(`✅ Found ${suppliersData?.length || 0} suppliers in database`);
    
    return c.json({ 
      success: true, 
      data: suppliersData || [],
      tenant: tenant.schema,
      source: 'real_database_via_rpc'
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

    console.log(`🔍 Looking for supplier: ${id} in schema: ${tenant.schema}`);
    
    const { data: suppliersData, error } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant.schema
    });
    
    if (error) {
      console.error('❌ RPC Error in GET /:id:', error);
      return c.json({ success: false, error: 'Supplier not found' }, 404);
    }
    
    const foundSupplier = suppliersData?.find((supplier: any) => supplier.nfournisseur === id);
    
    if (foundSupplier) {
      console.log(`✅ Found supplier ${id} in database`);
      return c.json({ success: true, data: foundSupplier });
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
    
    console.log(`🆕 Creating supplier in ${tenant.schema}:`, body.nfournisseur);
    
    // Use RPC function to insert into real database
    const { data, error } = await supabaseAdmin.rpc('insert_supplier_to_tenant', {
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
    
    console.log(`🔄 Updating supplier ${id} in ${tenant.schema}`);
    
    const {
      nom_fournisseur,
      resp_fournisseur,
      adresse_fourni,
      tel,
      email,
      commentaire
    } = body;

    // Use RPC function to update in real database
    const { data, error } = await supabaseAdmin.rpc('update_supplier_in_tenant', {
      p_tenant: tenant.schema,
      p_nfournisseur: id,
      p_nom_fournisseur: nom_fournisseur,
      p_resp_fournisseur: resp_fournisseur,
      p_adresse_fourni: adresse_fourni,
      p_tel: tel || '',
      p_email: email || '',
      p_commentaire: commentaire || ''
    });
    
    if (error) {
      console.error('❌ RPC Error updating supplier:', error);
      return c.json({ success: false, error: `Failed to update supplier: ${error.message}` }, 500);
    }
    
    console.log(`✅ Supplier updated: ${data}`);
    
    return c.json({ 
      success: true, 
      message: `Fournisseur ${id} modifié avec succès !`,
      data: { nfournisseur: id }
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

    console.log(`🗑️ Deleting supplier ${id} from ${tenant.schema}`);

    // Use RPC function to delete from real database
    const { data, error } = await supabaseAdmin.rpc('delete_supplier_from_tenant', {
      p_tenant: tenant.schema,
      p_nfournisseur: id
    });
    
    if (error) {
      console.error('❌ RPC Error deleting supplier:', error);
      return c.json({ success: false, error: `Failed to delete supplier: ${error.message}` }, 500);
    }
    
    console.log(`✅ Supplier deleted: ${data}`);
    return c.json({ success: true, message: `Fournisseur ${id} supprimé avec succès !` });
    
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return c.json({ success: false, error: 'Failed to delete supplier' }, 500);
  }
});

export default suppliers;