import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { authMiddleware, requireAdmin, logUserAction, AuthUser } from '../middleware/authMiddleware.js';

const admin = new Hono();

// Appliquer l'authentification et vérifier le rôle admin sur toutes les routes
admin.use('*', authMiddleware);
admin.use('*', requireAdmin);

// ==================== STATISTIQUES ADMIN ====================

// GET /api/admin/stats - Get admin dashboard stats
admin.get('/stats', async (c) => {
  try {
    console.log('📊 Fetching admin stats');

    // Récupérer toutes les BU (schémas qui commencent par une année)
    const { data: schemas, error: schemasError } = await supabaseAdmin.rpc('get_all_tenant_schemas');
    
    const totalBU = schemas?.length || 0;
    const activeBU = totalBU; // Pour l'instant, toutes les BU sont considérées actives

    // TODO: Récupérer le nombre d'utilisateurs depuis la table users
    const totalUsers = 0;
    const activeUsers = 0;

    console.log(`✅ Stats: ${totalBU} BU, ${totalUsers} users`);

    return c.json({
      success: true,
      data: {
        totalBU,
        totalUsers,
        activeBU,
        activeUsers
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return c.json({ 
      success: true, 
      data: {
        totalBU: 0,
        totalUsers: 0,
        activeBU: 0,
        activeUsers: 0
      }
    });
  }
});

// ==================== GESTION DES BUSINESS UNITS ====================

// GET /api/admin/business-units - Get all business units
admin.get('/business-units', async (c) => {
  try {
    console.log('🏢 Fetching all business units');

    const { data, error } = await supabaseAdmin.rpc('get_all_business_units');
    
    if (error) {
      console.error('❌ RPC Error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    // Parser le format spécial de Supabase
    let businessUnits = [];
    if (data) {
      console.log('📊 Raw data from Supabase:', JSON.stringify(data));
      
      // Supabase retourne: [{"get_all_business_units": [...]}]
      if (Array.isArray(data) && data.length > 0 && data[0].get_all_business_units) {
        businessUnits = data[0].get_all_business_units;
      } else if (Array.isArray(data)) {
        businessUnits = data;
      } else if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].get_all_business_units) {
          businessUnits = parsed[0].get_all_business_units;
        } else {
          businessUnits = parsed;
        }
      } else if (data.get_all_business_units) {
        businessUnits = data.get_all_business_units;
      } else {
        businessUnits = data;
      }
      
      console.log('📋 Parsed business units:', businessUnits);
    }

    console.log(`✅ Found ${businessUnits?.length || 0} business units`);

    return c.json({
      success: true,
      data: businessUnits || []
    });

  } catch (error) {
    console.error('Error fetching business units:', error);
    return c.json({ success: false, error: 'Failed to fetch business units' }, 500);
  }
});

// POST /api/admin/business-units - Create new business unit
admin.post('/business-units', async (c) => {
  try {
    const body = await c.req.json();
    console.log('🆕 Creating business unit:', body);

    const {
      bu_code,
      year,
      nom_entreprise,
      adresse,
      telephone,
      email,
      nif,
      rc,
      activite,
      slogan
    } = body;

    // Validation
    if (!bu_code || !year || !nom_entreprise) {
      return c.json({ 
        success: false, 
        error: 'Code BU, année et nom entreprise requis' 
      }, 400);
    }

    // Créer la BU avec son schéma
    const { data, error } = await supabaseAdmin.rpc('create_business_unit', {
      p_bu_code: bu_code,
      p_year: year,
      p_nom_entreprise: nom_entreprise,
      p_adresse: adresse || '',
      p_telephone: telephone || '',
      p_email: email || '',
      p_nif: nif || '',
      p_rc: rc || '',
      p_activite: activite || '',
      p_slogan: slogan || ''
    });

    if (error) {
      console.error('❌ RPC Error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Business unit created: ${bu_code}_${year}`);

    return c.json({
      success: true,
      message: `Business Unit ${bu_code} (${year}) créée avec succès !`,
      data: { schema: `${year}_${bu_code}` }
    });

  } catch (error) {
    console.error('Error creating business unit:', error);
    return c.json({ success: false, error: 'Failed to create business unit' }, 500);
  }
});

// PUT /api/admin/business-units/:schema - Update business unit
admin.put('/business-units/:schema', async (c) => {
  try {
    const schema = c.req.param('schema');
    const body = await c.req.json();
    console.log(`🔄 Updating business unit: ${schema}`);

    const {
      nom_entreprise,
      adresse,
      telephone,
      email,
      nif,
      rc,
      activite,
      slogan,
      active
    } = body;

    const { data, error } = await supabaseAdmin.rpc('update_business_unit', {
      p_schema: schema,
      p_nom_entreprise: nom_entreprise,
      p_adresse: adresse,
      p_telephone: telephone,
      p_email: email,
      p_nif: nif,
      p_rc: rc,
      p_activite: activite,
      p_slogan: slogan,
      p_active: active
    });

    if (error) {
      console.error('❌ RPC Error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Business unit updated: ${schema}`);

    return c.json({
      success: true,
      message: 'Business Unit mise à jour avec succès !',
      data
    });

  } catch (error) {
    console.error('Error updating business unit:', error);
    return c.json({ success: false, error: 'Failed to update business unit' }, 500);
  }
});

// DELETE /api/admin/business-units/:schema - Delete business unit
admin.delete('/business-units/:schema', async (c) => {
  try {
    const schema = c.req.param('schema');
    console.log(`🗑️ Deleting business unit: ${schema}`);

    const { data, error } = await supabaseAdmin.rpc('delete_business_unit', {
      p_schema: schema
    });

    if (error) {
      console.error('❌ RPC Error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Business unit deleted: ${schema}`);

    return c.json({
      success: true,
      message: `Business Unit ${schema} supprimée avec succès !`
    });

  } catch (error) {
    console.error('Error deleting business unit:', error);
    return c.json({ success: false, error: 'Failed to delete business unit' }, 500);
  }
});

// ==================== LOGS SYSTÈME ====================

// GET /api/admin/logs - Get system logs
admin.get('/logs', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const level = c.req.query('level') || null;
    const userId = c.req.query('user_id') ? parseInt(c.req.query('user_id')!) : null;

    console.log(`📊 Fetching system logs (limit: ${limit}, level: ${level})`);

    const { data, error } = await supabaseAdmin.rpc('get_system_logs', {
      p_limit: limit,
      p_level: level,
      p_user_id: userId
    });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    // Parser le JSON si nécessaire
    let logs = [];
    if (data) {
      if (Array.isArray(data)) {
        logs = data;
      } else if (typeof data === 'string') {
        logs = JSON.parse(data);
      } else {
        logs = data;
      }
    }

    console.log(`✅ Found ${logs?.length || 0} logs`);

    return c.json({
      success: true,
      data: logs || []
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    return c.json({ success: false, error: 'Failed to fetch logs' }, 500);
  }
});

// ==================== GESTION DES UTILISATEURS ====================

// GET /api/admin/users - Get all users
admin.get('/users', async (c) => {
  try {
    console.log('👥 Fetching all users');

    const { data, error } = await supabaseAdmin.rpc('get_all_users');
    
    if (error) {
      console.error('❌ RPC Error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Found ${data?.length || 0} users`);

    return c.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ success: false, error: 'Failed to fetch users' }, 500);
  }
});

// POST /api/admin/users - Create new user
admin.post('/users', async (c) => {
  try {
    const body = await c.req.json();
    console.log('🆕 Creating user:', body);

    const {
      username,
      email,
      password,
      full_name,
      role,
      business_units
    } = body;

    // Validation
    if (!username || !email || !password) {
      return c.json({ 
        success: false, 
        error: 'Username, email et password requis' 
      }, 400);
    }

    const { data, error } = await supabaseAdmin.rpc('create_user', {
      p_username: username,
      p_email: email,
      p_password: password,
      p_full_name: full_name || '',
      p_role: role || 'user',
      p_business_units: business_units || []
    });

    if (error) {
      console.error('❌ RPC Error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ User created: ${username}`);

    return c.json({
      success: true,
      message: `Utilisateur ${username} créé avec succès !`,
      data
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({ success: false, error: 'Failed to create user' }, 500);
  }
});

// PUT /api/admin/users/:id - Update user
admin.put('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const body = await c.req.json();
    console.log(`🔄 Updating user: ${userId}`);

    const {
      username,
      email,
      full_name,
      role,
      business_units,
      active
    } = body;

    const { data, error } = await supabaseAdmin.rpc('update_user', {
      p_user_id: parseInt(userId),
      p_username: username,
      p_email: email,
      p_full_name: full_name,
      p_role: role,
      p_business_units: business_units,
      p_active: active
    });

    if (error) {
      console.error('❌ RPC Error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ User updated: ${userId}`);

    return c.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès !',
      data
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ success: false, error: 'Failed to update user' }, 500);
  }
});

// DELETE /api/admin/users/:id - Delete user
admin.delete('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    console.log(`🗑️ Deleting user: ${userId}`);

    const { data, error } = await supabaseAdmin.rpc('delete_user', {
      p_user_id: parseInt(userId)
    });

    if (error) {
      console.error('❌ RPC Error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ User deleted: ${userId}`);

    return c.json({
      success: true,
      message: 'Utilisateur supprimé avec succès !'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ success: false, error: 'Failed to delete user' }, 500);
  }
});

export default admin;
