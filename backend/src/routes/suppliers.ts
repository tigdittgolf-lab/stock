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

    // Données de test statiques pour le moment
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

    return c.json({ success: true, data: testSuppliers , database_type: backendDatabaseService.getActiveDatabaseType() });
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
    
    const { data, error } = await databaseRouter.rpc('exec_sql', {
      sql: `SELECT * FROM "${tenant}".fournisseur WHERE nfournisseur = '${supplierId}' LIMIT 1;`
    });

    if (error) {
      console.error('Error fetching supplier:', error);
      return c.json({ success: false, error: 'Failed to fetch supplier' }, 500);
    }

    if (!data || data.length === 0) {
      return c.json({ success: false, error: 'Supplier not found' }, 404);
    }

    return c.json({ success: true, data: data[0] , database_type: backendDatabaseService.getActiveDatabaseType() });
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

    const { error } = await databaseRouter.rpc('exec_sql', {
      sql: `
        INSERT INTO "${tenant}".fournisseur (
          nfournisseur, nom_fournisseur, resp_fournisseur, adresse_fourni,
          tel, tel1, tel2, email, commentaire, caf, cabl
        ) VALUES (
          '${nfournisseur}', '${nom_fournisseur}', '${resp_fournisseur || ''}',
          '${adresse_fourni || ''}', '${tel || ''}', '${tel1 || ''}', '${tel2 || ''}',
          '${email || ''}', '${commentaire || ''}', 0, 0
        );
      `
    });

    if (error) {
      console.error('Error creating supplier:', error);
      return c.json({ success: false, error: 'Failed to create supplier' }, 500);
    }

    return c.json({ success: true, message: 'Supplier created successfully' });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return c.json({ success: false, error: 'Failed to create supplier' }, 500);
  }
});

export default suppliers;