import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { tenantMiddleware, getTenantContext } from '../middleware/tenantMiddleware.js';

const settings = new Hono();

// Apply tenant middleware to all routes
settings.use('*', tenantMiddleware);

// ==================== FAMILLES D'ARTICLES ====================

// GET /api/settings/families - Get all families
settings.get('/families', async (c) => {
  try {
    const tenant = getTenantContext(c);
    console.log(`🔍 Fetching families from schema: ${tenant.schema}`);

    const { data, error } = await supabaseAdmin.rpc('get_families_by_tenant', {
      p_tenant: tenant.schema
    });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      return c.json({ 
        success: true, 
        data: [], 
        message: 'RPC function not available' 
      });
    }
    
    console.log(`✅ Found ${data?.length || 0} families`);
    
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

// POST /api/settings/families - Create new family
settings.post('/families', async (c) => {
  try {
    const tenant = getTenantContext(c);
    const body = await c.req.json();
    
    console.log(`🆕 Creating family in ${tenant.schema}:`, body.famille);
    
    const { famille } = body;

    if (!famille || famille.trim() === '') {
      return c.json({ success: false, error: 'Nom de famille requis' }, 400);
    }

    const { data, error } = await supabaseAdmin.rpc('insert_family_to_tenant', {
      p_tenant: tenant.schema,
      p_famille: famille.trim()
    });
    
    if (error) {
      console.error('❌ RPC Error creating family:', error);
      return c.json({ success: false, error: `Failed to create family: ${error.message}` }, 500);
    }
    
    console.log(`✅ Family created: ${data}`);
    
    return c.json({ 
      success: true, 
      message: `Famille "${famille}" créée avec succès !`,
      data: { famille }
    });
    
  } catch (error) {
    console.error('Error creating family:', error);
    return c.json({ success: false, error: 'Failed to create family' }, 500);
  }
});

// PUT /api/settings/families/:id - Update family
settings.put('/families/:id', async (c) => {
  try {
    const oldFamille = c.req.param('id');
    const tenant = getTenantContext(c);
    const body = await c.req.json();
    
    console.log(`🔄 Updating family ${oldFamille} in ${tenant.schema}`);
    
    const { famille } = body;

    if (!famille || famille.trim() === '') {
      return c.json({ success: false, error: 'Nom de famille requis' }, 400);
    }

    const { data, error } = await supabaseAdmin.rpc('update_family_in_tenant', {
      p_tenant: tenant.schema,
      p_old_famille: oldFamille,
      p_new_famille: famille.trim()
    });
    
    if (error) {
      console.error('❌ RPC Error updating family:', error);
      return c.json({ success: false, error: `Failed to update family: ${error.message}` }, 500);
    }
    
    console.log(`✅ Family updated: ${data}`);
    
    return c.json({ 
      success: true, 
      message: `Famille modifiée avec succès !`,
      data: { famille: famille.trim() }
    });

  } catch (error) {
    console.error('Error updating family:', error);
    return c.json({ success: false, error: 'Failed to update family' }, 500);
  }
});

// DELETE /api/settings/families/:id - Delete family
settings.delete('/families/:id', async (c) => {
  try {
    const famille = c.req.param('id');
    const tenant = getTenantContext(c);

    console.log(`🗑️ Deleting family ${famille} from ${tenant.schema}`);

    const { data, error } = await supabaseAdmin.rpc('delete_family_from_tenant', {
      p_tenant: tenant.schema,
      p_famille: famille
    });
    
    if (error) {
      console.error('❌ RPC Error deleting family:', error);
      return c.json({ success: false, error: `Failed to delete family: ${error.message}` }, 500);
    }
    
    console.log(`✅ Family deleted: ${data}`);
    return c.json({ success: true, message: `Famille "${famille}" supprimée avec succès !` });
    
  } catch (error) {
    console.error('Error deleting family:', error);
    return c.json({ success: false, error: 'Failed to delete family' }, 500);
  }
});

// ==================== INFORMATIONS ENTREPRISE ====================

// GET /api/settings/company - Get company info
settings.get('/company', async (c) => {
  try {
    const tenant = getTenantContext(c);
    console.log(`🔍 Fetching company info from schema: ${tenant.schema}`);

    const { data, error } = await supabaseAdmin.rpc('get_company_info', {
      p_tenant: tenant.schema
    });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch company info' 
      }, 500);
    }
    
    console.log(`✅ Company info retrieved`);
    
    return c.json({ 
      success: true, 
      data: data || {},
      tenant: tenant.schema
    });
    
  } catch (error) {
    console.error('Error fetching company info:', error);
    return c.json({ success: false, error: 'Failed to fetch company info' }, 500);
  }
});

// PUT /api/settings/company - Update company info
settings.put('/company', async (c) => {
  try {
    const tenant = getTenantContext(c);
    const body = await c.req.json();
    
    console.log(`🔄 Updating company info in ${tenant.schema}`);
    
    const {
      nom_entreprise,
      adresse,
      telephone,
      email,
      nif,
      rc,
      activite,
      slogan
    } = body;

    const { data, error } = await supabaseAdmin.rpc('update_company_info', {
      p_tenant: tenant.schema,
      p_nom_entreprise: nom_entreprise,
      p_adresse: adresse,
      p_telephone: telephone,
      p_email: email,
      p_nif: nif,
      p_rc: rc,
      p_activite: activite,
      p_slogan: slogan
    });
    
    if (error) {
      console.error('❌ RPC Error updating company:', error);
      return c.json({ success: false, error: `Failed to update company: ${error.message}` }, 500);
    }
    
    console.log(`✅ Company info updated: ${data}`);
    
    return c.json({ 
      success: true, 
      message: 'Informations entreprise mises à jour avec succès !',
      data: body
    });

  } catch (error) {
    console.error('Error updating company info:', error);
    return c.json({ success: false, error: 'Failed to update company info' }, 500);
  }
});

// ==================== UNITÉS DE MESURE ====================

// GET /api/settings/units - Get all units
settings.get('/units', async (c) => {
  try {
    const tenant = getTenantContext(c);
    console.log(`🔍 Fetching units from schema: ${tenant.schema}`);

    const { data, error } = await supabaseAdmin.rpc('get_units_by_tenant', {
      p_tenant: tenant.schema
    });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      // Retourner des unités par défaut si la table n'existe pas encore
      const defaultUnits = [
        { unite: 'pièce', description: 'Pièce' },
        { unite: 'kg', description: 'Kilogramme' },
        { unite: 'm', description: 'Mètre' },
        { unite: 'litre', description: 'Litre' },
        { unite: 'm²', description: 'Mètre carré' },
        { unite: 'boîte', description: 'Boîte' }
      ];
      return c.json({ 
        success: true, 
        data: defaultUnits,
        message: 'Default units (table not created yet)'
      });
    }
    
    console.log(`✅ Found ${data?.length || 0} units`);
    
    return c.json({ 
      success: true, 
      data: data || [],
      tenant: tenant.schema
    });
    
  } catch (error) {
    console.error('Error fetching units:', error);
    return c.json({ success: false, error: 'Failed to fetch units' }, 500);
  }
});

// ==================== TAUX DE TVA ====================

// GET /api/settings/tva-rates - Get all TVA rates
settings.get('/tva-rates', async (c) => {
  try {
    const tenant = getTenantContext(c);
    console.log(`🔍 Fetching TVA rates from schema: ${tenant.schema}`);

    // Retourner les taux de TVA algériens par défaut
    const defaultTvaRates = [
      { taux: 0, description: 'Exonéré (0%)' },
      { taux: 9, description: 'Taux réduit (9%)' },
      { taux: 19, description: 'Taux normal (19%)' }
    ];
    
    return c.json({ 
      success: true, 
      data: defaultTvaRates,
      tenant: tenant.schema,
      message: 'Taux de TVA algériens'
    });
    
  } catch (error) {
    console.error('Error fetching TVA rates:', error);
    return c.json({ success: false, error: 'Failed to fetch TVA rates' }, 500);
  }
});

export default settings;