import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { databaseRouter } from '../services/databaseRouter.js';
import { backendDatabaseService } from '../services/databaseService.js';

const suppliers = new Hono();

// Middleware to extract tenant from header
suppliers.use('*', async (c, next) => {
  const tenant = c.req.header('X-Tenant');
  if (tenant) {
    c.set('tenant', tenant);
  }
  await next();
});

// Get all suppliers for tenant
suppliers.get('/', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`Fetching suppliers for tenant: ${tenant}`);

    const dbType = backendDatabaseService.getActiveDatabaseType();
    console.log(`🔍 Fetching suppliers from ${dbType} database`);

    const result = await backendDatabaseService.executeRPC('get_suppliers_by_tenant', {
      p_tenant: tenant
    });
    
    if (!result.success) {
      console.error('❌ RPC Error:', result.error);
      // Fallback to test data if RPC not available
      const testSuppliers = [
        {
          nfournisseur: 'F001',
          nom_fournisseur: 'Fournisseur Droguerie',
          resp_fournisseur: 'Ahmed Benali',
          adresse_fourni: 'Alger Centre',
          tel: '021-123456',
          tel1: '',
          tel2: '',
          email: 'contact@droguerie.dz',
          caf: 0,
          cabl: 0,
          commentaire: ''
        },
        {
          nfournisseur: 'F002',
          nom_fournisseur: 'Fournisseur Peinture',
          resp_fournisseur: 'Fatima Kaci',
          adresse_fourni: 'Oran',
          tel: '041-789012',
          tel1: '',
          tel2: '',
          email: 'info@peinture.dz',
          caf: 0,
          cabl: 0,
          commentaire: ''
        },
        {
          nfournisseur: 'F003',
          nom_fournisseur: 'Fournisseur Outillage',
          resp_fournisseur: 'Mohamed Saidi',
          adresse_fourni: 'Constantine',
          tel: '031-345678',
          tel1: '',
          tel2: '',
          email: 'vente@outillage.dz',
          caf: 0,
          cabl: 0,
          commentaire: ''
        }
      ];
      
      return c.json({ 
        success: true, 
        data: testSuppliers,
        message: 'Using fallback data (RPC not available)',
        database_type: dbType
      });
    }
    
    console.log(`✅ Found ${result.data?.length || 0} suppliers from ${dbType} database`);
    
    return c.json({ 
      success: true, 
      data: result.data || [],
      tenant: tenant,
      source: `${dbType}_database`,
      database_type: dbType
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return c.json({ success: false, error: 'Failed to fetch suppliers' }, 500);
  }
});

// Get supplier by ID
suppliers.get('/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const supplierId = c.req.param('id');
    
    const dbType = backendDatabaseService.getActiveDatabaseType();
    console.log(`🔍 Fetching supplier ${supplierId} from ${dbType} database`);

    const result = await backendDatabaseService.executeRPC('get_supplier_by_id', {
      p_tenant: tenant,
      p_nfournisseur: supplierId
    });

    if (!result.success) {
      console.error('❌ RPC Error:', result.error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch supplier',
        database_type: dbType
      }, 500);
    }

    if (!result.data || result.data.length === 0) {
      return c.json({ 
        success: false, 
        error: 'Supplier not found',
        database_type: dbType
      }, 404);
    }

    return c.json({ 
      success: true, 
      data: result.data[0],
      database_type: dbType
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return c.json({ success: false, error: 'Failed to fetch supplier' }, 500);
  }
});

// Create new supplier
suppliers.post('/', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const {
      nfournisseur,
      nom_fournisseur,
      resp_fournisseur,
      adresse_fourni,
      tel,
      tel1,
      tel2,
      email,
      commentaire
    } = body;

    if (!nfournisseur || !nom_fournisseur) {
      return c.json({ success: false, error: 'Supplier code and name are required' }, 400);
    }

    const dbType = backendDatabaseService.getActiveDatabaseType();
    console.log(`🆕 Creating supplier in ${dbType} database`);

    const result = await backendDatabaseService.executeRPC('insert_supplier', {
      p_tenant: tenant,
      p_nfournisseur: nfournisseur,
      p_nom_fournisseur: nom_fournisseur,
      p_resp_fournisseur: resp_fournisseur || '',
      p_adresse_fourni: adresse_fourni || '',
      p_tel: tel || '',
      p_tel1: tel1 || '',
      p_tel2: tel2 || '',
      p_email: email || '',
      p_commentaire: commentaire || ''
    });

    if (!result.success) {
      console.error('❌ RPC Error:', result.error);
      return c.json({ 
        success: false, 
        error: 'Failed to create supplier',
        database_type: dbType
      }, 500);
    }

    return c.json({ 
      success: true, 
      message: 'Supplier created successfully',
      data: result.data,
      database_type: dbType
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return c.json({ success: false, error: 'Failed to create supplier' }, 500);
  }
});

export default suppliers;