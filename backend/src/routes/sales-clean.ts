
// Endpoints sales propres - SANS DONNÉES EN DUR
import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';

const sales = new Hono();

// Middleware pour extraire le tenant
sales.use('*', async (c, next) => {
  const tenant = c.req.header('X-Tenant');
  if (tenant) {
    c.set('tenant', tenant);
  }
  await next();
});

// GET /api/sales/articles - Articles via RPC uniquement
sales.get('/articles', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`🔍 Sales: Fetching articles from schema: ${tenant}`);

    const { data: articlesData, error } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });
    
    if (error) {
      console.error('❌ RPC Error in sales/articles:', error);
      return c.json({ success: true, data: [], message: 'RPC function not available' });
    }
    
    console.log(`✅ Sales articles: ${articlesData?.length || 0} found`);
    
    return c.json({ 
      success: true, 
      data: articlesData || [],
      tenant: tenant,
      source: 'real_database_via_rpc'
    });
    
  } catch (error) {
    console.error('Error in sales/articles:', error);
    return c.json({ success: true, data: [], error: 'RPC not available' });
  }
});

// GET /api/sales/clients - Clients via RPC uniquement
sales.get('/clients', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`🔍 Sales: Fetching clients from schema: ${tenant}`);

    const { data: clientsData, error } = await supabaseAdmin.rpc('get_clients_by_tenant', {
      p_tenant: tenant
    });
    
    if (error) {
      console.error('❌ RPC Error in sales/clients:', error);
      return c.json({ success: true, data: [], message: 'RPC function not available' });
    }
    
    console.log(`✅ Sales clients: ${clientsData?.length || 0} found`);
    
    return c.json({ 
      success: true, 
      data: clientsData || [],
      tenant: tenant,
      source: 'real_database_via_rpc'
    });
    
  } catch (error) {
    console.error('Error in sales/clients:', error);
    return c.json({ success: true, data: [], error: 'RPC not available' });
  }
});

// GET /api/sales/suppliers - Fournisseurs via RPC uniquement
sales.get('/suppliers', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`🔍 Sales: Fetching suppliers from schema: ${tenant}`);

    const { data: suppliersData, error } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant
    });
    
    if (error) {
      console.error('❌ RPC Error in sales/suppliers:', error);
      return c.json({ success: true, data: [], message: 'RPC function not available' });
    }
    
    console.log(`✅ Sales suppliers: ${suppliersData?.length || 0} found`);
    
    return c.json({ 
      success: true, 
      data: suppliersData || [],
      tenant: tenant,
      source: 'real_database_via_rpc'
    });
    
  } catch (error) {
    console.error('Error in sales/suppliers:', error);
    return c.json({ success: true, data: [], error: 'RPC not available' });
  }
});

// GET /api/sales/suppliers/:id - Vérifier un fournisseur spécifique
sales.get('/suppliers/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`🔍 Sales: Checking supplier ${id} in schema: ${tenant}`);

    const { data: suppliersData, error } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant
    });
    
    if (error) {
      console.error('❌ RPC Error in sales/suppliers/:id:', error);
      return c.json({ success: false, error: 'RPC function not available' }, 404);
    }
    
    const supplier = suppliersData?.find((s: any) => s.nfournisseur === id);
    
    if (supplier) {
      return c.json({ success: true, data: supplier });
    } else {
      return c.json({ success: false, error: 'Supplier not found' }, 404);
    }
    
  } catch (error) {
    console.error('Error in sales/suppliers/:id:', error);
    return c.json({ success: false, error: 'Internal error' }, 500);
  }
});

// GET /api/sales/clients/:id - Vérifier un client spécifique
sales.get('/clients/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`🔍 Sales: Checking client ${id} in schema: ${tenant}`);

    const { data: clientsData, error } = await supabaseAdmin.rpc('get_clients_by_tenant', {
      p_tenant: tenant
    });
    
    if (error) {
      console.error('❌ RPC Error in sales/clients/:id:', error);
      return c.json({ success: false, error: 'RPC function not available' }, 404);
    }
    
    const client = clientsData?.find((c: any) => c.nclient === id);
    
    if (client) {
      return c.json({ success: true, data: client });
    } else {
      return c.json({ success: false, error: 'Client not found' }, 404);
    }
    
  } catch (error) {
    console.error('Error in sales/clients/:id:', error);
    return c.json({ success: false, error: 'Internal error' }, 500);
  }
});

// POST /api/sales/clients - Créer un client
sales.post('/clients', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    console.log(`📝 Sales: Creating client in schema: ${tenant}`, body);

    // Utiliser la vraie fonction RPC pour insérer dans la base de données
    const { data, error } = await supabaseAdmin.rpc('insert_client_to_tenant', {
      p_tenant: tenant,
      p_nclient: body.nclient,
      p_raison_sociale: body.raison_sociale,
      p_adresse: body.adresse || '',
      p_contact_person: body.contact_person || '',
      p_tel: body.tel || '',
      p_email: body.email || '',
      p_nrc: body.nrc || '',
      p_i_fiscal: body.i_fiscal || '',
      p_c_affaire_fact: parseFloat(body.c_affaire_fact || '0'),
      p_c_affaire_bl: parseFloat(body.c_affaire_bl || '0')
    });
    
    if (error) {
      console.error('❌ RPC Error creating client:', error);
      return c.json({ success: false, error: `Failed to create client: ${error.message}` }, 500);
    }
    
    console.log(`✅ Client created: ${data}`);
    
    return c.json({ 
      success: true, 
      message: 'Client créé avec succès !',
      data: { nclient: body.nclient }
    });
    
  } catch (error) {
    console.error('Error in POST sales/clients:', error);
    return c.json({ success: false, error: 'Failed to create client' }, 500);
  }
});

// PUT /api/sales/clients/:id - Modifier un client
sales.put('/clients/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    console.log(`📝 Sales: Updating client ${id} in schema: ${tenant}`, body);

    // Utiliser la vraie fonction RPC pour modifier dans la base de données
    const { data, error } = await supabaseAdmin.rpc('update_client_in_tenant', {
      p_tenant: tenant,
      p_nclient: id,
      p_raison_sociale: body.raison_sociale,
      p_adresse: body.adresse || '',
      p_contact_person: body.contact_person || '',
      p_tel: body.tel || '',
      p_email: body.email || '',
      p_nrc: body.nrc || '',
      p_i_fiscal: body.i_fiscal || '',
      p_c_affaire_fact: parseFloat(body.c_affaire_fact || '0'),
      p_c_affaire_bl: parseFloat(body.c_affaire_bl || '0')
    });
    
    if (error) {
      console.error('❌ RPC Error updating client:', error);
      return c.json({ success: false, error: `Failed to update client: ${error.message}` }, 500);
    }
    
    console.log(`✅ Client updated: ${data}`);
    
    return c.json({ 
      success: true, 
      message: 'Client modifié avec succès !',
      data: { nclient: id }
    });
    
  } catch (error) {
    console.error('Error in PUT sales/clients/:id:', error);
    return c.json({ success: false, error: 'Failed to update client' }, 500);
  }
});

// POST /api/sales/suppliers - Créer un fournisseur
sales.post('/suppliers', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    console.log(`📝 Sales: Creating supplier in schema: ${tenant}`, body);

    // Utiliser la vraie fonction RPC pour insérer dans la base de données
    const { data, error } = await supabaseAdmin.rpc('insert_supplier_to_tenant', {
      p_tenant: tenant,
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
    console.error('Error in POST sales/suppliers:', error);
    return c.json({ success: false, error: 'Failed to create supplier' }, 500);
  }
});

export default sales;

// ===== BONS DE LIVRAISON (BL) - CORRIGÉ AVEC RPC =====

// POST /api/sales/delivery-notes - Créer un bon de livraison
sales.post('/delivery-notes', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const { Nclient, date_fact, detail_bl } = body;

    if (!detail_bl || !Array.isArray(detail_bl) || detail_bl.length === 0) {
      return c.json({ success: false, error: 'detail_bl is required and must be a non-empty array' }, 400);
    }

    console.log(`🆕 Creating delivery note for tenant: ${tenant}, Client: ${Nclient}`);

    // 1. Obtenir le prochain numéro de BL
    const { data: nextNBl, error: numberError } = await supabaseAdmin.rpc('get_next_bl_number_simple', {
      p_tenant: tenant
    });

    if (numberError) {
      console.error('❌ Failed to get next BL number:', numberError);
      return c.json({ success: false, error: 'Failed to generate BL number' }, 500);
    }

    // 2. Valider le client
    const { data: clients, error: clientError } = await supabaseAdmin.rpc('get_clients_by_tenant', {
      p_tenant: tenant
    });

    if (clientError) {
      console.error('❌ Failed to fetch clients:', clientError);
      return c.json({ success: false, error: 'Failed to validate client' }, 500);
    }

    const clientExists = clients?.find(client => client.nclient === Nclient);
    if (!clientExists) {
      return c.json({ success: false, error: `Client ${Nclient} not found` }, 400);
    }

    // 3. Valider les articles
    const { data: articles, error: articleError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    if (articleError) {
      console.error('❌ Failed to fetch articles:', articleError);
      return c.json({ success: false, error: 'Failed to validate articles' }, 500);
    }

    // 4. Calculer les totaux et valider le stock
    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_bl) {
      const articleExists = articles?.find(article => article.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        return c.json({ success: false, error: `Article ${detail.Narticle} not found` }, 400);
      }

      // Vérifier le stock
      const { data: stockInfo, error: stockError } = await supabaseAdmin.rpc('get_article_stock_simple', {
        p_tenant: tenant,
        p_narticle: detail.Narticle
      });

      if (stockError) {
        console.error(`❌ Failed to get stock for ${detail.Narticle}:`, stockError);
        return c.json({ success: false, error: `Failed to check stock for ${detail.Narticle}` }, 500);
      }

      const currentStockBL = parseFloat(stockInfo?.stock_bl || '0');
      const requestedQty = parseFloat(detail.Qte);
      
      if (currentStockBL < requestedQty) {
        return c.json({ 
          success: false, 
          error: `Stock insuffisant pour ${detail.Narticle}. Disponible: ${currentStockBL}, demandé: ${requestedQty}`
        }, 400);
      }

      const total_ligne = requestedQty * parseFloat(detail.prix);
      const tva_amount = total_ligne * (parseFloat(detail.tva) / 100);

      montant_ht += total_ligne;
      TVA += tva_amount;

      processedDetails.push({
        nfact: nextNBl,
        narticle: detail.Narticle,
        qte: requestedQty,
        tva: parseFloat(detail.tva),
        prix: parseFloat(detail.prix),
        total_ligne: total_ligne
      });
    }

    // 5. Créer le BL
    const blDate = date_fact || new Date().toISOString().split('T')[0];
    
    const { data: blHeader, error: blError } = await supabaseAdmin.rpc('insert_bl_simple', {
      p_tenant: tenant,
      p_nfact: nextNBl,
      p_nclient: Nclient,
      p_date_fact: blDate,
      p_montant_ht: montant_ht,
      p_tva: TVA
    });

    if (blError) {
      console.error('❌ Failed to create BL:', blError);
      return c.json({ success: false, error: `Failed to create BL: ${blError.message}` }, 500);
    }

    // 6. Ajouter les détails
    for (const detail of processedDetails) {
      const { error: detailErr } = await supabaseAdmin.rpc('insert_detail_bl_simple', {
        p_tenant: tenant,
        p_nfact: detail.nfact,
        p_narticle: detail.narticle,
        p_qte: detail.qte,
        p_prix: detail.prix,
        p_tva: detail.tva,
        p_total_ligne: detail.total_ligne
      });
      
      if (detailErr) {
        console.error(`❌ Failed to insert detail for ${detail.narticle}:`, detailErr);
        return c.json({ success: false, error: `Failed to save BL details: ${detailErr.message}` }, 500);
      }
    }

    // 7. Mettre à jour les stocks
    for (const detail of processedDetails) {
      const { error: stockError } = await supabaseAdmin.rpc('update_stock_bl_simple', {
        p_tenant: tenant,
        p_narticle: detail.narticle,
        p_quantity: detail.qte
      });

      if (stockError) {
        console.warn(`⚠️ Stock update failed for ${detail.narticle}:`, stockError);
      }
    }

    console.log(`✅ BL ${nextNBl} created successfully for client ${Nclient}`);

    return c.json({
      success: true,
      message: `Bon de livraison ${nextNBl} créé avec succès !`,
      data: {
        nbl: nextNBl,
        nclient: Nclient,
        client_name: clientExists.raison_sociale,
        date_fact: blDate,
        montant_ht: montant_ht,
        tva: TVA,
        montant_ttc: montant_ht + TVA,
        details: processedDetails.map(detail => ({
          narticle: detail.narticle,
          designation: articles?.find(a => a.narticle.trim() === detail.narticle.trim())?.designation || '',
          qte: detail.qte,
          prix: detail.prix,
          tva: detail.tva,
          total_ligne: detail.total_ligne
        })),
        source: 'database'
      }
    });

  } catch (error) {
    console.error('❌ Error creating delivery note:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la création du bon de livraison'
    }, 500);
  }
});

// ===== FACTURES - CORRIGÉ AVEC RPC =====

// POST /api/sales/invoices - Créer une facture
sales.post('/invoices', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const { Nclient, date_fact, detail_fact } = body;

    if (!detail_fact || !Array.isArray(detail_fact) || detail_fact.length === 0) {
      return c.json({ success: false, error: 'detail_fact is required and must be a non-empty array' }, 400);
    }

    console.log(`🆕 Creating invoice for tenant: ${tenant}, Client: ${Nclient}`);

    // 1. Obtenir le prochain numéro de facture
    const { data: nextNumber, error: numberError } = await supabaseAdmin.rpc('get_next_invoice_number', {
      p_tenant: tenant
    });

    if (numberError) {
      console.error('❌ Failed to get next invoice number:', numberError);
      return c.json({ success: false, error: 'Failed to generate invoice number' }, 500);
    }

    // 2. Valider le client
    const { data: clients, error: clientError } = await supabaseAdmin.rpc('get_clients_by_tenant', {
      p_tenant: tenant
    });

    if (clientError) {
      console.error('❌ Failed to fetch clients:', clientError);
      return c.json({ success: false, error: 'Failed to validate client' }, 500);
    }

    const clientExists = clients?.find(client => client.nclient === Nclient);
    if (!clientExists) {
      return c.json({ success: false, error: `Client ${Nclient} not found` }, 400);
    }

    // 3. Valider les articles
    const { data: articles, error: articleError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    if (articleError) {
      console.error('❌ Failed to fetch articles:', articleError);
      return c.json({ success: false, error: 'Failed to validate articles' }, 500);
    }

    // 4. Calculer les totaux et valider le stock
    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_fact) {
      const articleExists = articles?.find(article => article.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        return c.json({ success: false, error: `Article ${detail.Narticle} not found` }, 400);
      }

      // Vérifier le stock facture
      const { data: stockInfo, error: stockError } = await supabaseAdmin.rpc('get_article_stock_simple', {
        p_tenant: tenant,
        p_narticle: detail.Narticle
      });

      if (stockError) {
        console.error(`❌ Failed to get stock for ${detail.Narticle}:`, stockError);
        return c.json({ success: false, error: `Failed to check stock for ${detail.Narticle}` }, 500);
      }

      const currentStockF = parseFloat(stockInfo?.stock_f || '0');
      const requestedQty = parseFloat(detail.Qte);
      
      if (currentStockF < requestedQty) {
        return c.json({ 
          success: false, 
          error: `Stock facture insuffisant pour ${detail.Narticle}. Disponible: ${currentStockF}, demandé: ${requestedQty}`
        }, 400);
      }

      const total_ligne = requestedQty * parseFloat(detail.prix);
      const tva_amount = total_ligne * (parseFloat(detail.tva) / 100);

      montant_ht += total_ligne;
      TVA += tva_amount;

      processedDetails.push({
        nfact: nextNumber,
        narticle: detail.Narticle,
        qte: requestedQty,
        tva: parseFloat(detail.tva),
        prix: parseFloat(detail.prix),
        total_ligne: total_ligne
      });
    }

    // 5. Créer la facture
    const factDate = date_fact || new Date().toISOString().split('T')[0];
    
    const { data: factHeader, error: factError } = await supabaseAdmin.rpc('insert_invoice', {
      p_tenant: tenant,
      p_nfact: nextNumber,
      p_nclient: Nclient,
      p_date_fact: factDate,
      p_montant_ht: montant_ht,
      p_tva: TVA
    });

    if (factError) {
      console.error('❌ Failed to create invoice:', factError);
      return c.json({ success: false, error: `Failed to create invoice: ${factError.message}` }, 500);
    }

    // 6. Ajouter les détails
    for (const detail of processedDetails) {
      const { error: detailErr } = await supabaseAdmin.rpc('insert_detail_invoice', {
        p_tenant: tenant,
        p_nfact: detail.nfact,
        p_narticle: detail.narticle,
        p_qte: detail.qte,
        p_prix: detail.prix,
        p_tva: detail.tva,
        p_total_ligne: detail.total_ligne
      });
      
      if (detailErr) {
        console.error(`❌ Failed to insert invoice detail for ${detail.narticle}:`, detailErr);
        return c.json({ success: false, error: `Failed to save invoice details: ${detailErr.message}` }, 500);
      }
    }

    // 7. Mettre à jour les stocks facture
    for (const detail of processedDetails) {
      const { error: stockError } = await supabaseAdmin.rpc('update_stock_facture', {
        p_tenant: tenant,
        p_narticle: detail.narticle,
        p_quantity: detail.qte
      });

      if (stockError) {
        console.warn(`⚠️ Stock facture update failed for ${detail.narticle}:`, stockError);
      }
    }

    console.log(`✅ Invoice ${nextNumber} created successfully for client ${Nclient}`);

    return c.json({
      success: true,
      message: `Facture ${nextNumber} créée avec succès !`,
      data: {
        nfact: nextNumber,
        nclient: Nclient,
        client_name: clientExists.raison_sociale,
        date_fact: factDate,
        montant_ht: montant_ht,
        tva: TVA,
        montant_ttc: montant_ht + TVA,
        details: processedDetails.map(detail => ({
          narticle: detail.narticle,
          designation: articles?.find(a => a.narticle.trim() === detail.narticle.trim())?.designation || '',
          qte: detail.qte,
          prix: detail.prix,
          tva: detail.tva,
          total_ligne: detail.total_ligne
        })),
        source: 'database'
      }
    });

  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la création de la facture'
    }, 500);
  }
});

// ===== PROFORMA - CORRIGÉ AVEC RPC =====

// POST /api/sales/proforma - Créer une proforma
sales.post('/proforma', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const { Nclient, date_fact, detail_proforma } = body;

    if (!detail_proforma || !Array.isArray(detail_proforma) || detail_proforma.length === 0) {
      return c.json({ success: false, error: 'detail_proforma is required and must be a non-empty array' }, 400);
    }

    console.log(`🆕 Creating proforma for tenant: ${tenant}, Client: ${Nclient}`);

    // 1. Obtenir le prochain numéro de proforma
    const { data: nextNumber, error: numberError } = await supabaseAdmin.rpc('get_next_proforma_number', {
      p_tenant: tenant
    });

    if (numberError) {
      console.error('❌ Failed to get next proforma number:', numberError);
      return c.json({ success: false, error: 'Failed to generate proforma number' }, 500);
    }

    // 2. Valider le client
    const { data: clients, error: clientError } = await supabaseAdmin.rpc('get_clients_by_tenant', {
      p_tenant: tenant
    });

    if (clientError) {
      console.error('❌ Failed to fetch clients:', clientError);
      return c.json({ success: false, error: 'Failed to validate client' }, 500);
    }

    const clientExists = clients?.find(client => client.nclient === Nclient);
    if (!clientExists) {
      return c.json({ success: false, error: `Client ${Nclient} not found` }, 400);
    }

    // 3. Valider les articles
    const { data: articles, error: articleError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    if (articleError) {
      console.error('❌ Failed to fetch articles:', articleError);
      return c.json({ success: false, error: 'Failed to validate articles' }, 500);
    }

    // 4. Calculer les totaux (pas de vérification de stock pour proforma)
    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_proforma) {
      const articleExists = articles?.find(article => article.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        return c.json({ success: false, error: `Article ${detail.Narticle} not found` }, 400);
      }

      const total_ligne = parseFloat(detail.Qte) * parseFloat(detail.prix);
      const tva_amount = total_ligne * (parseFloat(detail.tva) / 100);

      montant_ht += total_ligne;
      TVA += tva_amount;

      processedDetails.push({
        nfact: nextNumber,
        narticle: detail.Narticle,
        qte: parseFloat(detail.Qte),
        tva: parseFloat(detail.tva),
        prix: parseFloat(detail.prix),
        total_ligne: total_ligne
      });
    }

    // 5. Créer la proforma
    const proformaDate = date_fact || new Date().toISOString().split('T')[0];
    
    const { data: proformaHeader, error: proformaError } = await supabaseAdmin.rpc('insert_proforma', {
      p_tenant: tenant,
      p_nfact: nextNumber,
      p_nclient: Nclient,
      p_date_fact: proformaDate,
      p_montant_ht: montant_ht,
      p_tva: TVA
    });

    if (proformaError) {
      console.error('❌ Failed to create proforma:', proformaError);
      return c.json({ success: false, error: `Failed to create proforma: ${proformaError.message}` }, 500);
    }

    // 6. Ajouter les détails
    for (const detail of processedDetails) {
      const { error: detailErr } = await supabaseAdmin.rpc('insert_detail_proforma', {
        p_tenant: tenant,
        p_nfact: detail.nfact,
        p_narticle: detail.narticle,
        p_qte: detail.qte,
        p_prix: detail.prix,
        p_tva: detail.tva,
        p_total_ligne: detail.total_ligne
      });
      
      if (detailErr) {
        console.error(`❌ Failed to insert proforma detail for ${detail.narticle}:`, detailErr);
        return c.json({ success: false, error: `Failed to save proforma details: ${detailErr.message}` }, 500);
      }
    }

    console.log(`✅ Proforma ${nextNumber} created successfully for client ${Nclient}`);

    return c.json({
      success: true,
      message: `Proforma ${nextNumber} créée avec succès !`,
      data: {
        nproforma: nextNumber,
        nclient: Nclient,
        client_name: clientExists.raison_sociale,
        date_fact: proformaDate,
        montant_ht: montant_ht,
        tva: TVA,
        montant_ttc: montant_ht + TVA,
        details: processedDetails.map(detail => ({
          narticle: detail.narticle,
          designation: articles?.find(a => a.narticle.trim() === detail.narticle.trim())?.designation || '',
          qte: detail.qte,
          prix: detail.prix,
          tva: detail.tva,
          total_ligne: detail.total_ligne
        })),
        source: 'database'
      }
    });

  } catch (error) {
    console.error('❌ Error creating proforma:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la création de la proforma'
    }, 500);
  }
});

// ===== BONS D'ACHAT - CORRIGÉ AVEC RPC =====

// POST /api/sales/purchase-orders - Créer un bon d'achat
sales.post('/purchase-orders', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const { Nfournisseur, date_bc, detail_bc } = body;

    if (!detail_bc || !Array.isArray(detail_bc) || detail_bc.length === 0) {
      return c.json({ success: false, error: 'detail_bc is required and must be a non-empty array' }, 400);
    }

    console.log(`🆕 Creating purchase order for tenant: ${tenant}, Supplier: ${Nfournisseur}`);

    // 1. Obtenir le prochain numéro de bon d'achat
    const { data: nextNumber, error: numberError } = await supabaseAdmin.rpc('get_next_purchase_order_number', {
      p_tenant: tenant
    });

    if (numberError) {
      console.error('❌ Failed to get next purchase order number:', numberError);
      return c.json({ success: false, error: 'Failed to generate purchase order number' }, 500);
    }

    // 2. Valider le fournisseur
    const { data: suppliers, error: supplierError } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant
    });

    if (supplierError) {
      console.error('❌ Failed to fetch suppliers:', supplierError);
      return c.json({ success: false, error: 'Failed to validate supplier' }, 500);
    }

    const supplierExists = suppliers?.find(supplier => supplier.nfournisseur === Nfournisseur);
    if (!supplierExists) {
      return c.json({ success: false, error: `Supplier ${Nfournisseur} not found` }, 400);
    }

    // 3. Valider les articles
    const { data: articles, error: articleError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    if (articleError) {
      console.error('❌ Failed to fetch articles:', articleError);
      return c.json({ success: false, error: 'Failed to validate articles' }, 500);
    }

    // 4. Calculer les totaux
    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_bc) {
      const articleExists = articles?.find(article => article.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        return c.json({ success: false, error: `Article ${detail.Narticle} not found` }, 400);
      }

      const total_ligne = parseFloat(detail.Qte) * parseFloat(detail.prix);
      const tva_amount = total_ligne * (parseFloat(detail.tva) / 100);

      montant_ht += total_ligne;
      TVA += tva_amount;

      processedDetails.push({
        nbc: nextNumber,
        narticle: detail.Narticle,
        qte: parseFloat(detail.Qte),
        tva: parseFloat(detail.tva),
        prix: parseFloat(detail.prix),
        total_ligne: total_ligne
      });
    }

    // 5. Créer le bon d'achat
    const bcDate = date_bc || new Date().toISOString().split('T')[0];
    
    const { data: bcHeader, error: bcError } = await supabaseAdmin.rpc('insert_purchase_order', {
      p_tenant: tenant,
      p_nbc: nextNumber,
      p_nfournisseur: Nfournisseur,
      p_date_bc: bcDate,
      p_montant_ht: montant_ht,
      p_tva: TVA
    });

    if (bcError) {
      console.error('❌ Failed to create purchase order:', bcError);
      return c.json({ success: false, error: `Failed to create purchase order: ${bcError.message}` }, 500);
    }

    // 6. Ajouter les détails
    for (const detail of processedDetails) {
      const { error: detailErr } = await supabaseAdmin.rpc('insert_detail_purchase_order', {
        p_tenant: tenant,
        p_nbc: detail.nbc,
        p_narticle: detail.narticle,
        p_qte: detail.qte,
        p_prix: detail.prix,
        p_tva: detail.tva,
        p_total_ligne: detail.total_ligne
      });
      
      if (detailErr) {
        console.error(`❌ Failed to insert purchase order detail for ${detail.narticle}:`, detailErr);
        return c.json({ success: false, error: `Failed to save purchase order details: ${detailErr.message}` }, 500);
      }
    }

    console.log(`✅ Purchase order ${nextNumber} created successfully for supplier ${Nfournisseur}`);

    return c.json({
      success: true,
      message: `Bon d'achat ${nextNumber} créé avec succès !`,
      data: {
        nbc: nextNumber,
        nfournisseur: Nfournisseur,
        supplier_name: supplierExists.nom_fournisseur,
        date_bc: bcDate,
        montant_ht: montant_ht,
        tva: TVA,
        montant_ttc: montant_ht + TVA,
        details: processedDetails.map(detail => ({
          narticle: detail.narticle,
          designation: articles?.find(a => a.narticle.trim() === detail.narticle.trim())?.designation || '',
          qte: detail.qte,
          prix: detail.prix,
          tva: detail.tva,
          total_ligne: detail.total_ligne
        })),
        source: 'database'
      }
    });

  } catch (error) {
    console.error('❌ Error creating purchase order:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la création du bon d\'achat'
    }, 500);
  }
});

// ===== FACTURES D'ACHAT - CORRIGÉ AVEC RPC =====

// POST /api/sales/purchase-invoices - Créer une facture d'achat
sales.post('/purchase-invoices', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const { Nfournisseur, date_fact, detail_facture_achat } = body;

    if (!detail_facture_achat || !Array.isArray(detail_facture_achat) || detail_facture_achat.length === 0) {
      return c.json({ success: false, error: 'detail_facture_achat is required and must be a non-empty array' }, 400);
    }

    console.log(`🆕 Creating purchase invoice for tenant: ${tenant}, Supplier: ${Nfournisseur}`);

    // 1. Obtenir le prochain numéro de facture d'achat
    const { data: nextNumber, error: numberError } = await supabaseAdmin.rpc('get_next_purchase_invoice_number', {
      p_tenant: tenant
    });

    if (numberError) {
      console.error('❌ Failed to get next purchase invoice number:', numberError);
      return c.json({ success: false, error: 'Failed to generate purchase invoice number' }, 500);
    }

    // 2. Valider le fournisseur
    const { data: suppliers, error: supplierError } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant
    });

    if (supplierError) {
      console.error('❌ Failed to fetch suppliers:', supplierError);
      return c.json({ success: false, error: 'Failed to validate supplier' }, 500);
    }

    const supplierExists = suppliers?.find(supplier => supplier.nfournisseur === Nfournisseur);
    if (!supplierExists) {
      return c.json({ success: false, error: `Supplier ${Nfournisseur} not found` }, 400);
    }

    // 3. Valider les articles
    const { data: articles, error: articleError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    if (articleError) {
      console.error('❌ Failed to fetch articles:', articleError);
      return c.json({ success: false, error: 'Failed to validate articles' }, 500);
    }

    // 4. Calculer les totaux
    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_facture_achat) {
      const articleExists = articles?.find(article => article.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        return c.json({ success: false, error: `Article ${detail.Narticle} not found` }, 400);
      }

      const total_ligne = parseFloat(detail.Qte) * parseFloat(detail.prix);
      const tva_amount = total_ligne * (parseFloat(detail.tva) / 100);

      montant_ht += total_ligne;
      TVA += tva_amount;

      processedDetails.push({
        nfact_achat: nextNumber,
        narticle: detail.Narticle,
        qte: parseFloat(detail.Qte),
        tva: parseFloat(detail.tva),
        prix: parseFloat(detail.prix),
        total_ligne: total_ligne
      });
    }

    // 5. Créer la facture d'achat
    const factDate = date_fact || new Date().toISOString().split('T')[0];
    
    const { data: factHeader, error: factError } = await supabaseAdmin.rpc('insert_purchase_invoice', {
      p_tenant: tenant,
      p_nfact_achat: nextNumber,
      p_nfournisseur: Nfournisseur,
      p_date_fact: factDate,
      p_montant_ht: montant_ht,
      p_tva: TVA
    });

    if (factError) {
      console.error('❌ Failed to create purchase invoice:', factError);
      return c.json({ success: false, error: `Failed to create purchase invoice: ${factError.message}` }, 500);
    }

    // 6. Ajouter les détails
    for (const detail of processedDetails) {
      const { error: detailErr } = await supabaseAdmin.rpc('insert_detail_purchase_invoice', {
        p_tenant: tenant,
        p_nfact_achat: detail.nfact_achat,
        p_narticle: detail.narticle,
        p_qte: detail.qte,
        p_prix: detail.prix,
        p_tva: detail.tva,
        p_total_ligne: detail.total_ligne
      });
      
      if (detailErr) {
        console.error(`❌ Failed to insert purchase invoice detail for ${detail.narticle}:`, detailErr);
        return c.json({ success: false, error: `Failed to save purchase invoice details: ${detailErr.message}` }, 500);
      }
    }

    // 7. Augmenter le stock (achat = entrée de stock)
    for (const detail of processedDetails) {
      const { error: stockError } = await supabaseAdmin.rpc('increase_stock_purchase', {
        p_tenant: tenant,
        p_narticle: detail.narticle,
        p_quantity: detail.qte
      });

      if (stockError) {
        console.warn(`⚠️ Stock increase failed for ${detail.narticle}:`, stockError);
      }
    }

    console.log(`✅ Purchase invoice ${nextNumber} created successfully for supplier ${Nfournisseur}`);

    return c.json({
      success: true,
      message: `Facture d'achat ${nextNumber} créée avec succès !`,
      data: {
        nfact_achat: nextNumber,
        nfournisseur: Nfournisseur,
        supplier_name: supplierExists.nom_fournisseur,
        date_fact: factDate,
        montant_ht: montant_ht,
        tva: TVA,
        montant_ttc: montant_ht + TVA,
        details: processedDetails.map(detail => ({
          narticle: detail.narticle,
          designation: articles?.find(a => a.narticle.trim() === detail.narticle.trim())?.designation || '',
          qte: detail.qte,
          prix: detail.prix,
          tva: detail.tva,
          total_ligne: detail.total_ligne
        })),
        source: 'database'
      }
    });

  } catch (error) {
    console.error('❌ Error creating purchase invoice:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la création de la facture d\'achat'
    }, 500);
  }
});
