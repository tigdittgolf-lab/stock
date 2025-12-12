import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { SchemaManager } from '../utils/schemaManager.js';

const auth = new Hono();

// Create a new user (admin only)
auth.post('/create-user', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, nom, role } = body;

    if (!email || !password) {
      return c.json({ success: false, error: 'Email and password are required' }, 400);
    }

    // Create user with Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nom: nom || '',
        role: role || 'user',
      },
    });

    if (error) {
      console.error('Error creating user:', error);
      return c.json({ success: false, error: error.message }, 400);
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.error('Error in create-user:', error);
    return c.json({ success: false, error: 'Failed to create user' }, 500);
  }
});

// List all users (admin only)
auth.get('/users', async (c) => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Error listing users:', error);
      return c.json({ success: false, error: error.message }, 400);
    }

    return c.json({ success: true, data: data.users });
  } catch (error) {
    console.error('Error in list-users:', error);
    return c.json({ success: false, error: 'Failed to list users' }, 500);
  }
});

// Delete user (admin only)
auth.delete('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');

    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting user:', error);
      return c.json({ success: false, error: error.message }, 400);
    }

    return c.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in delete-user:', error);
    return c.json({ success: false, error: 'Failed to delete user' }, 500);
  }
});

// Update user (admin only)
auth.put('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const body = await c.req.json();
    const { email, password, user_metadata } = body;

    const updateData: any = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (user_metadata) updateData.user_metadata = user_metadata;

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updateData
    );

    if (error) {
      console.error('Error updating user:', error);
      return c.json({ success: false, error: error.message }, 400);
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.error('Error in update-user:', error);
    return c.json({ success: false, error: 'Failed to update user' }, 500);
  }
});

// Get available business units
auth.get('/business-units', async (c) => {
  try {
    // In a real application, this would come from a database
    const businessUnits = [
      { id: 'bu01', name: 'Business Unit 01', description: 'Unité principale' },
      { id: 'bu02', name: 'Business Unit 02', description: 'Unité secondaire' },
      { id: 'bu03', name: 'Business Unit 03', description: 'Unité tertiaire' }
    ];

    return c.json({ success: true, data: businessUnits });
  } catch (error) {
    console.error('Error fetching business units:', error);
    return c.json({ success: false, error: 'Failed to fetch business units' }, 500);
  }
});

// Get available exercises (years)
auth.get('/exercises', async (c) => {
  try {
    const currentYear = new Date().getFullYear();
    const exercises = [
      { year: currentYear, status: 'active' },
      { year: currentYear - 1, status: 'closed' },
      { year: currentYear - 2, status: 'archived' }
    ];

    return c.json({ success: true, data: exercises });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return c.json({ success: false, error: 'Failed to fetch exercises' }, 500);
  }
});

// Set tenant (business unit + year)
auth.post('/set-tenant', async (c) => {
  try {
    const { business_unit, year } = await c.req.json();

    if (!business_unit || !year) {
      return c.json({ success: false, error: 'Business unit and year are required' }, 400);
    }

    // Validate business unit format (bu01, bu02, etc.)
    if (!/^bu\d{2}$/.test(business_unit)) {
      return c.json({ success: false, error: 'Invalid business unit format' }, 400);
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (year < 2020 || year > currentYear + 1) {
      return c.json({ success: false, error: 'Invalid year' }, 400);
    }

    const schema = `${year}_${business_unit}`;

    // Check if schema exists, create if not
    try {
      await supabaseAdmin.rpc('ensure_tenant_schema', {
        schema_name: schema,
        business_unit,
        year
      });

      // Import and use SchemaManager to create tables
      const { SchemaManager } = await import('../utils/schemaManager.js');
      await SchemaManager.createTenantSchema(business_unit, year);
      
    } catch (schemaError) {
      console.warn('Schema creation warning:', schemaError);
      // Continue anyway - schema might already exist
    }

    // Store tenant info in session/response
    return c.json({
      success: true,
      data: {
        business_unit,
        year,
        schema,
        message: `Connected to ${business_unit} - Exercise ${year}`
      }
    });
  } catch (error) {
    console.error('Error setting tenant:', error);
    return c.json({ success: false, error: 'Failed to set tenant' }, 500);
  }
});

// Initialize test data for a tenant
auth.post('/init-test-data', async (c) => {
  try {
    const { business_unit, year } = await c.req.json();

    if (!business_unit || !year) {
      return c.json({ success: false, error: 'Business unit and year are required' }, 400);
    }

    const schema = `${year}_${business_unit}`;

    console.log(`Initializing test data for schema: ${schema}`);

    try {
      // First, ensure the schema exists and create all tables
      console.log(`Creating schema ${schema}...`);
      await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE SCHEMA IF NOT EXISTS "${schema}";`
      });
      console.log(`✅ Schema ${schema} created`);

      // Create required tables directly
      console.log(`Creating tables in schema ${schema}...`);
      
      // Create famille_art table
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS "${schema}".famille_art (
            famille VARCHAR(50) PRIMARY KEY
          );
        `
      });
      
      // Create fournisseur table
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS "${schema}".fournisseur (
            nfournisseur VARCHAR(20) PRIMARY KEY,
            nom_fournisseur VARCHAR(100),
            resp_fournisseur VARCHAR(100),
            adresse_fourni TEXT,
            tel VARCHAR(20),
            tel1 VARCHAR(20),
            tel2 VARCHAR(20),
            caf DECIMAL(15,2) DEFAULT 0,
            cabl DECIMAL(15,2) DEFAULT 0,
            email VARCHAR(100),
            commentaire TEXT
          );
        `
      });
      
      // Create client table
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS "${schema}".client (
            nclient VARCHAR(20) PRIMARY KEY,
            raison_sociale VARCHAR(100),
            adresse TEXT,
            contact_person VARCHAR(100),
            c_affaire_fact DECIMAL(15,2) DEFAULT 0,
            c_affaire_bl DECIMAL(15,2) DEFAULT 0,
            nrc VARCHAR(50),
            date_rc DATE,
            lieu_rc VARCHAR(100),
            i_fiscal VARCHAR(50),
            n_article VARCHAR(50),
            tel VARCHAR(20),
            email VARCHAR(100),
            commentaire TEXT
          );
        `
      });
      
      // Create article table
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS "${schema}".article (
            narticle VARCHAR(20) PRIMARY KEY,
            famille VARCHAR(50),
            designation VARCHAR(200),
            nfournisseur VARCHAR(20),
            prix_unitaire DECIMAL(15,2) DEFAULT 0,
            marge DECIMAL(5,2) DEFAULT 0,
            tva DECIMAL(5,2) DEFAULT 0,
            prix_vente DECIMAL(15,2) DEFAULT 0,
            seuil INTEGER DEFAULT 0,
            stock_f INTEGER DEFAULT 0,
            stock_bl INTEGER DEFAULT 0
          );
        `
      });
      
      console.log(`✅ Tables created in schema ${schema}`);

      // Add test families
      console.log(`Inserting families into ${schema}...`);
      try {
        const familiesResult = await supabaseAdmin.rpc('exec_sql', {
          sql: `
            INSERT INTO "${schema}".famille_art (famille) VALUES 
            ('Droguerie'),
            ('Peinture'),
            ('Outillage'),
            ('Électricité')
            ON CONFLICT (famille) DO NOTHING;
          `
        });
        console.log(`✅ Families inserted:`, familiesResult);
      } catch (familiesError) {
        console.error(`❌ Error inserting families:`, familiesError);
      }

      // Add test suppliers
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          INSERT INTO "${schema}".fournisseur (
            nfournisseur, nom_fournisseur, resp_fournisseur, adresse_fourni, tel, email
          ) VALUES 
          ('F001', 'Fournisseur Droguerie', 'Ahmed Benali', 'Alger Centre', '021-123456', 'contact@droguerie.dz'),
          ('F002', 'Fournisseur Peinture', 'Fatima Kaci', 'Oran', '041-789012', 'info@peinture.dz'),
          ('F003', 'Fournisseur Outillage', 'Mohamed Saidi', 'Constantine', '031-345678', 'vente@outillage.dz')
          ON CONFLICT (nfournisseur) DO NOTHING;
        `
      });

      // Add test clients
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          INSERT INTO "${schema}".client (
            nclient, raison_sociale, adresse, tel, email, c_affaire_fact, c_affaire_bl
          ) VALUES 
          ('C001', 'Client Entreprise A', 'Alger, Hydra', '021-111111', 'contact@entrepriseA.dz', 50000, 30000),
          ('C002', 'Client Entreprise B', 'Oran, Es Senia', '041-222222', 'info@entrepriseB.dz', 75000, 45000),
          ('C003', 'Client Entreprise C', 'Constantine, Zouaghi', '031-333333', 'admin@entrepriseC.dz', 100000, 60000)
          ON CONFLICT (nclient) DO NOTHING;
        `
      });

      // Add test articles
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          INSERT INTO "${schema}".article (
            narticle, famille, designation, nfournisseur, prix_unitaire, marge, tva, prix_vente, seuil, stock_f, stock_bl
          ) VALUES 
          ('ART001', 'Droguerie', 'Produit Nettoyage A', 'F001', 100, 20, 19, 142.8, 10, 50, 0),
          ('ART002', 'Droguerie', 'Produit Nettoyage B', 'F001', 150, 25, 19, 223.125, 15, 30, 0),
          ('ART003', 'Peinture', 'Peinture Blanche 1L', 'F002', 200, 30, 19, 309.4, 20, 25, 0),
          ('ART004', 'Peinture', 'Peinture Rouge 1L', 'F002', 220, 30, 19, 340.34, 20, 15, 0),
          ('ART005', 'Outillage', 'Marteau 500g', 'F003', 80, 40, 19, 133.28, 5, 40, 0),
          ('ART006', 'Outillage', 'Tournevis Set', 'F003', 120, 35, 19, 192.78, 8, 35, 0)
          ON CONFLICT (narticle) DO NOTHING;
        `
      });

      return c.json({
        success: true,
        data: {
          schema,
          message: `Test data initialized for ${schema}`,
          families: 4,
          suppliers: 3,
          clients: 3,
          articles: 6
        }
      });

    } catch (dataError) {
      console.error('Error inserting test data:', dataError);
      return c.json({ 
        success: false, 
        error: `Failed to initialize test data: ${dataError.message || 'Unknown error'}` 
      }, 500);
    }

  } catch (error) {
    console.error('Error initializing test data:', error);
    return c.json({ success: false, error: 'Failed to initialize test data' }, 500);
  }
});

// Create new exercise (copy data from current year)
auth.post('/create-new-exercise', async (c) => {
  try {
    const { business_unit, current_year, new_year } = await c.req.json();

    if (!business_unit || !current_year || !new_year) {
      return c.json({ 
        success: false, 
        error: 'Business unit, current year and new year are required' 
      }, 400);
    }

    // Validate business unit format
    if (!/^bu\d{2}$/.test(business_unit)) {
      return c.json({ success: false, error: 'Invalid business unit format' }, 400);
    }

    // Validate years
    if (new_year <= current_year) {
      return c.json({ success: false, error: 'New year must be greater than current year' }, 400);
    }

    const currentSchema = `${current_year}_${business_unit}`;
    const newSchema = `${new_year}_${business_unit}`;

    console.log(`Attempting to create new exercise: ${newSchema} from ${currentSchema}`);

    try {
      // Create new schema and copy data
      const { SchemaManager } = await import('../utils/schemaManager.js');
      await SchemaManager.createNewExercise(business_unit, current_year, new_year);

      return c.json({
        success: true,
        data: {
          business_unit,
          current_year,
          new_year,
          current_schema: currentSchema,
          new_schema: newSchema,
          message: `New exercise ${new_year} created successfully for ${business_unit}`
        }
      });

    } catch (createError) {
      console.error('Error in createNewExercise:', createError);
      return c.json({ 
        success: false, 
        error: `Failed to create new exercise: ${createError.message}` 
      }, 500);
    }

  } catch (error) {
    console.error('Error creating new exercise:', error);
    return c.json({ success: false, error: 'Failed to create new exercise' }, 500);
  }
});

export default auth;
