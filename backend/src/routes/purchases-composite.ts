// =====================================================
// ROUTES ACHATS - Système avec CLÉ COMPOSITE
// Utilise (numero_facture_fournisseur, nfournisseur) et (numero_bl_fournisseur, nfournisseur)
// =====================================================

import { Hono } from 'hono';
import { databaseRouter } from '../services/databaseRouter.js';
import { backendDatabaseService } from '../services/databaseService.js';

const purchases = new Hono();

// Middleware pour extraire le tenant
purchases.use('*', async (c, next) => {
  const tenant = c.req.header('X-Tenant');
  if (tenant) {
    c.set('tenant', tenant);
  }
  await next();
});

// ===== BONS DE LIVRAISON D'ACHAT (ENTRÉE STOCK BL) =====

// GET /api/purchases/delivery-notes - Liste des BL d'achat
purchases.get('/delivery-notes', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📋 Fetching purchase delivery notes for tenant: ${tenant}`);

    // Utiliser la fonction RPC avec clé composite
    const { data: blData, error: blError } = await databaseRouter.rpc('get_purchase_bl_list_composite', {
      p_tenant: tenant
    });

    if (blError) {
      console.error('❌ Failed to fetch purchase BLs:', blError);
      return c.json({ 
        success: false, 
        error: 'Erreur lors de la récupération des BL d\'achat'
      }, 500);
    }

    console.log(`✅ Found ${blData?.length || 0} purchase delivery notes`);
    
    return c.json({
      success: true,
      data: blData || [],
      tenant: tenant,
      source: 'database',
      database_type: 'supabase_composite_key'
    });

  } catch (error) {
    console.error('❌ Error fetching purchase delivery notes:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des BL d\'achat'
    }, 500);
  }
});

// POST /api/purchases/delivery-notes - Créer un BL d'achat
purchases.post('/delivery-notes', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const { Nfournisseur, numero_bl_fournisseur, date_bl, detail_bl_achat } = body;

    if (!numero_bl_fournisseur || !numero_bl_fournisseur.trim()) {
      return c.json({ success: false, error: 'Le numéro de BL fournisseur est requis' }, 400);
    }

    if (!Nfournisseur || !Nfournisseur.trim()) {
      return c.json({ success: false, error: 'Le code fournisseur est requis' }, 400);
    }

    if (!detail_bl_achat || !Array.isArray(detail_bl_achat) || detail_bl_achat.length === 0) {
      return c.json({ success: false, error: 'Les détails du BL sont requis' }, 400);
    }

    console.log(`🆕 Creating purchase BL ${numero_bl_fournisseur} for supplier: ${Nfournisseur}`);

    // Vérifier si ce BL existe déjà (clé composite)
    const exists = await databaseRouter.rpc('check_supplier_bl_exists_composite', {
      p_tenant: tenant,
      p_nfournisseur: Nfournisseur,
      p_numero_bl: numero_bl_fournisseur
    });

    if (exists.data === true) {
      return c.json({ 
        success: false, 
        error: `Le BL ${numero_bl_fournisseur} existe déjà pour le fournisseur ${Nfournisseur}` 
      }, 400);
    }

    // Valider le fournisseur
    const { data: suppliers } = await databaseRouter.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant
    });

    const supplierExists = suppliers?.find(s => s.nfournisseur === Nfournisseur);
    if (!supplierExists) {
      return c.json({ success: false, error: `Fournisseur ${Nfournisseur} non trouvé` }, 400);
    }

    // Valider les articles
    const { data: articles } = await databaseRouter.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_bl_achat) {
      const articleExists = articles?.find(a => a.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        return c.json({ success: false, error: `Article ${detail.Narticle} non trouvé` }, 400);
      }

      // Validation: article appartient au fournisseur
      if (articleExists.nfournisseur && articleExists.nfournisseur.trim() !== Nfournisseur.trim()) {
        return c.json({ 
          success: false, 
          error: `L'article ${detail.Narticle} n'appartient pas au fournisseur ${Nfournisseur}` 
        }, 400);
      }

      const total_ligne = parseFloat(detail.Qte) * parseFloat(detail.prix);
      const tva_amount = total_ligne * (parseFloat(detail.tva) / 100);

      montant_ht += total_ligne;
      TVA += tva_amount;

      processedDetails.push({
        narticle: detail.Narticle,
        qte: parseFloat(detail.Qte),
        tva: parseFloat(detail.tva),
        prix: parseFloat(detail.prix),
        total_ligne: total_ligne
      });
    }

    // Créer le BL avec clé composite
    const blDate = date_bl || new Date().toISOString().split('T')[0];
    
    const { data: blResult, error: blError } = await databaseRouter.rpc('insert_purchase_bl_composite', {
      p_tenant: tenant,
      p_numero_bl_fournisseur: numero_bl_fournisseur,
      p_nfournisseur: Nfournisseur,
      p_date_bl: blDate,
      p_montant_ht: montant_ht,
      p_tva: TVA
    });

    if (blError) {
      console.error('❌ Failed to create purchase BL:', blError);
      return c.json({ success: false, error: `Erreur: ${blError.message}` }, 500);
    }

    // Ajouter les détails
    for (const detail of processedDetails) {
      const { error: detailErr } = await databaseRouter.rpc('insert_detail_purchase_bl_composite', {
        p_tenant: tenant,
        p_numero_bl_fournisseur: numero_bl_fournisseur,
        p_nfournisseur: Nfournisseur,
        p_narticle: detail.narticle,
        p_qte: detail.qte,
        p_prix: detail.prix,
        p_tva: detail.tva,
        p_total_ligne: detail.total_ligne
      });
      
      if (detailErr) {
        console.error(`❌ Failed to insert BL detail:`, detailErr);
        return c.json({ success: false, error: `Erreur détails: ${detailErr.message}` }, 500);
      }
    }

    // Mettre à jour les stocks
    for (const detail of processedDetails) {
      await databaseRouter.rpc('update_stock_purchase_bl_composite', {
        p_tenant: tenant,
        p_narticle: detail.narticle,
        p_quantity: detail.qte
      });
    }

    console.log(`✅ BL ${numero_bl_fournisseur} créé pour ${Nfournisseur}`);

    return c.json({
      success: true,
      message: `BL d'achat ${numero_bl_fournisseur} créé avec succès !`,
      data: {
        numero_bl_fournisseur: numero_bl_fournisseur,
        nfournisseur: Nfournisseur,
        supplier_name: supplierExists.nom_fournisseur,
        date_bl: blDate,
        montant_ht: montant_ht,
        tva: TVA,
        montant_ttc: montant_ht + TVA,
        details: processedDetails
      }
    });

  } catch (error) {
    console.error('❌ Error creating purchase BL:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la création du BL d\'achat'
    }, 500);
  }
});

// GET /api/purchases/delivery-notes/:numero/:fournisseur - Récupérer un BL spécifique
purchases.get('/delivery-notes/:numero/:fournisseur', async (c) => {
  try {
    const tenant = c.get('tenant');
    const numero = c.req.param('numero');
    const fournisseur = c.req.param('fournisseur');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📋 Fetching BL ${numero} for supplier ${fournisseur}`);

    const { data: blData, error: blError } = await databaseRouter.rpc('get_purchase_bl_with_details_composite', {
      p_tenant: tenant,
      p_numero_bl_fournisseur: numero,
      p_nfournisseur: fournisseur
    });

    if (blError || !blData) {
      console.error('❌ Failed to fetch BL:', blError);
      return c.json({ 
        success: false, 
        error: 'BL d\'achat non trouvé'
      }, 404);
    }

    return c.json({
      success: true,
      data: blData,
      source: 'database'
    });

  } catch (error) {
    console.error('❌ Error fetching BL:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération du BL'
    }, 500);
  }
});

// ===== FACTURES D'ACHAT (ENTRÉE STOCK FACTURE) =====

// GET /api/purchases/invoices - Liste des factures d'achat
purchases.get('/invoices', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📋 Fetching purchase invoices for tenant: ${tenant}`);

    const { data: invoicesData, error: invoicesError } = await databaseRouter.rpc('get_purchase_invoices_list_composite', {
      p_tenant: tenant
    });

    if (invoicesError) {
      console.error('❌ Failed to fetch purchase invoices:', invoicesError);
      return c.json({ 
        success: false, 
        error: 'Erreur lors de la récupération des factures d\'achat'
      }, 500);
    }

    console.log(`✅ Found ${invoicesData?.length || 0} purchase invoices`);
    
    return c.json({
      success: true,
      data: invoicesData || [],
      tenant: tenant,
      source: 'database',
      database_type: 'supabase_composite_key'
    });

  } catch (error) {
    console.error('❌ Error fetching purchase invoices:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des factures d\'achat'
    }, 500);
  }
});

// POST /api/purchases/invoices - Créer une facture d'achat
purchases.post('/invoices', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const { Nfournisseur, numero_facture_fournisseur, date_fact, detail_fact_achat } = body;

    if (!numero_facture_fournisseur || !numero_facture_fournisseur.trim()) {
      return c.json({ success: false, error: 'Le numéro de facture fournisseur est requis' }, 400);
    }

    if (!Nfournisseur || !Nfournisseur.trim()) {
      return c.json({ success: false, error: 'Le code fournisseur est requis' }, 400);
    }

    if (!detail_fact_achat || !Array.isArray(detail_fact_achat) || detail_fact_achat.length === 0) {
      return c.json({ success: false, error: 'Les détails de la facture sont requis' }, 400);
    }

    console.log(`🆕 Creating purchase invoice ${numero_facture_fournisseur} for supplier: ${Nfournisseur}`);

    // Vérifier si cette facture existe déjà (clé composite)
    const exists = await databaseRouter.rpc('check_supplier_invoice_exists_composite', {
      p_tenant: tenant,
      p_nfournisseur: Nfournisseur,
      p_numero_facture: numero_facture_fournisseur
    });

    if (exists.data === true) {
      return c.json({ 
        success: false, 
        error: `La facture ${numero_facture_fournisseur} existe déjà pour le fournisseur ${Nfournisseur}` 
      }, 400);
    }

    // Valider le fournisseur
    const { data: suppliers } = await databaseRouter.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant
    });

    const supplierExists = suppliers?.find(s => s.nfournisseur === Nfournisseur);
    if (!supplierExists) {
      return c.json({ success: false, error: `Fournisseur ${Nfournisseur} non trouvé` }, 400);
    }

    // Valider les articles
    const { data: articles } = await databaseRouter.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_fact_achat) {
      const articleExists = articles?.find(a => a.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        return c.json({ success: false, error: `Article ${detail.Narticle} non trouvé` }, 400);
      }

      // Validation: article appartient au fournisseur
      if (articleExists.nfournisseur && articleExists.nfournisseur.trim() !== Nfournisseur.trim()) {
        return c.json({ 
          success: false, 
          error: `L'article ${detail.Narticle} n'appartient pas au fournisseur ${Nfournisseur}` 
        }, 400);
      }

      const total_ligne = parseFloat(detail.Qte) * parseFloat(detail.prix);
      const tva_amount = total_ligne * (parseFloat(detail.tva) / 100);

      montant_ht += total_ligne;
      TVA += tva_amount;

      processedDetails.push({
        narticle: detail.Narticle,
        qte: parseFloat(detail.Qte),
        tva: parseFloat(detail.tva),
        prix: parseFloat(detail.prix),
        total_ligne: total_ligne
      });
    }

    // Créer la facture avec clé composite
    const invoiceDate = date_fact || new Date().toISOString().split('T')[0];
    
    const { data: invoiceResult, error: invoiceError } = await databaseRouter.rpc('insert_purchase_invoice_composite', {
      p_tenant: tenant,
      p_numero_facture_fournisseur: numero_facture_fournisseur,
      p_nfournisseur: Nfournisseur,
      p_date_fact: invoiceDate,
      p_montant_ht: montant_ht,
      p_tva: TVA
    });

    if (invoiceError) {
      console.error('❌ Failed to create purchase invoice:', invoiceError);
      return c.json({ success: false, error: `Erreur: ${invoiceError.message}` }, 500);
    }

    // Ajouter les détails
    for (const detail of processedDetails) {
      const { error: detailErr } = await databaseRouter.rpc('insert_detail_purchase_invoice_composite', {
        p_tenant: tenant,
        p_numero_facture_fournisseur: numero_facture_fournisseur,
        p_nfournisseur: Nfournisseur,
        p_narticle: detail.narticle,
        p_qte: detail.qte,
        p_prix: detail.prix,
        p_tva: detail.tva,
        p_total_ligne: detail.total_ligne
      });
      
      if (detailErr) {
        console.error(`❌ Failed to insert invoice detail:`, detailErr);
        return c.json({ success: false, error: `Erreur détails: ${detailErr.message}` }, 500);
      }
    }

    // Mettre à jour les stocks
    for (const detail of processedDetails) {
      await databaseRouter.rpc('update_stock_purchase_invoice_composite', {
        p_tenant: tenant,
        p_narticle: detail.narticle,
        p_quantity: detail.qte
      });
    }

    console.log(`✅ Facture ${numero_facture_fournisseur} créée pour ${Nfournisseur}`);

    return c.json({
      success: true,
      message: `Facture d'achat ${numero_facture_fournisseur} créée avec succès !`,
      data: {
        numero_facture_fournisseur: numero_facture_fournisseur,
        nfournisseur: Nfournisseur,
        supplier_name: supplierExists.nom_fournisseur,
        date_fact: invoiceDate,
        montant_ht: montant_ht,
        tva: TVA,
        montant_ttc: montant_ht + TVA,
        details: processedDetails
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

// GET /api/purchases/invoices/:numero/:fournisseur - Récupérer une facture spécifique
purchases.get('/invoices/:numero/:fournisseur', async (c) => {
  try {
    const tenant = c.get('tenant');
    const numero = c.req.param('numero');
    const fournisseur = c.req.param('fournisseur');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📋 Fetching invoice ${numero} for supplier ${fournisseur}`);

    const { data: invoiceData, error: invoiceError } = await databaseRouter.rpc('get_purchase_invoice_with_details_composite', {
      p_tenant: tenant,
      p_numero_facture_fournisseur: numero,
      p_nfournisseur: fournisseur
    });

    if (invoiceError || !invoiceData) {
      console.error('❌ Failed to fetch invoice:', invoiceError);
      return c.json({ 
        success: false, 
        error: 'Facture d\'achat non trouvée'
      }, 404);
    }

    return c.json({
      success: true,
      data: invoiceData,
      source: 'database'
    });

  } catch (error) {
    console.error('❌ Error fetching invoice:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la facture'
    }, 500);
  }
});

export default purchases;
