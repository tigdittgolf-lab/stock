import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';

const activite = new Hono();

// GET /api/activite - Get company information for invoices/documents
activite.get('/', async (c) => {
  try {
    // Get company information from activite table
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT * FROM activite 
        WHERE tenant_id = 'default' OR tenant_id IS NOT NULL
        LIMIT 1;
      `
    });

    if (error) throw error;

    // Default company info if none exists
    const defaultCompanyInfo = {
      tenant_id: 'default',
      nom_entreprise: 'VOTRE ENTREPRISE',
      adresse: '123 Rue Example, Alger, Algérie',
      telephone: '+213 XX XX XX XX',
      email: 'contact@entreprise.dz',
      nif: '000000000000000',
      rc: '00/00-0000000',
      logo_url: null,
      slogan: 'Votre partenaire de confiance'
    };

    const companyInfo = data && data.length > 0 ? data[0] : defaultCompanyInfo;

    return c.json({ 
      success: true, 
      data: companyInfo
    });
  } catch (error) {
    console.error('Error fetching company info:', error);
    return c.json({ success: false, error: 'Failed to fetch company info' }, 500);
  }
});

// PUT /api/activite - Update company information
activite.put('/', async (c) => {
  try {
    const body = await c.req.json();
    
    const {
      nom_entreprise,
      adresse,
      telephone,
      email,
      nif,
      rc,
      logo_url,
      slogan
    } = body;

    // Try to update existing record, or insert if none exists
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        INSERT INTO activite (
          tenant_id, nom_entreprise, adresse, telephone, 
          email, nif, rc, logo_url, slogan
        ) VALUES (
          'default', '${nom_entreprise}', '${adresse}', '${telephone}',
          '${email}', '${nif}', '${rc}', '${logo_url || ''}', '${slogan}'
        )
        ON CONFLICT (tenant_id) DO UPDATE SET
          nom_entreprise = EXCLUDED.nom_entreprise,
          adresse = EXCLUDED.adresse,
          telephone = EXCLUDED.telephone,
          email = EXCLUDED.email,
          nif = EXCLUDED.nif,
          rc = EXCLUDED.rc,
          logo_url = EXCLUDED.logo_url,
          slogan = EXCLUDED.slogan
        RETURNING *;
      `
    });

    if (error) throw error;

    return c.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error updating company info:', error);
    return c.json({ success: false, error: 'Failed to update company info' }, 500);
  }
});

export default activite;