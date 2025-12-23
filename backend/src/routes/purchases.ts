// =====================================================
// ROUTES ACHATS - Système complet d'achats (entrées de stock)
// =====================================================

import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
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

    // Utiliser la fonction RPC pour récupérer les BL d'achat
    const { data: blData, error: blError } = await databaseRouter.rpc('get_purchase_bl_list', {
      p_tenant: tenant
    });

    if (blError) {
      console.error('❌ Failed to fetch purchase delivery notes:', blError);
      console.log('📋 Using fallback: returning sample purchase delivery notes');
      
      // Fallback avec des données d'exemple
      const fallbackBLs = [
        {
          nbl_achat: 1,
          nfournisseur: 'FOURNISSEUR 1',
          numero_bl_fournisseur: 'BL-FOURNISSEUR-2025-001',
          date_bl: '2025-12-16',
          montant_ht: 12000.00,
          tva: 2280.00,
          total_ttc: 14280.00,
          created_at: new Date().toISOString()
        }
      ];
      
      // Enrichir avec les données fournisseurs
      const { data: suppliersData } = await databaseRouter.rpc('get_suppliers_by_tenant', {
        p_tenant: tenant
      });

      const enrichedBLs = fallbackBLs.map(bl => {
        const supplier = suppliersData?.find(s => s.nfournisseur === bl.nfournisseur);
        return {
          ...bl,
          supplier_name: supplier?.nom_fournisseur || bl.nfournisseur,
          type: 'purchase_delivery_note'
        };
      });

      return c.json({
        success: true,
        data: enrichedBLs,
        tenant: tenant,
        source: 'fallback'
      , database_type: backendDatabaseService.getActiveDatabaseType() });
    }

    // Enrichir avec les données fournisseurs
    const { data: suppliersData } = await databaseRouter.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant
    });

    const enrichedBLs = (blData || []).map(bl => {
      const supplier = suppliersData?.find(s => s.nfournisseur === bl.nfournisseur);
      return {
        ...bl,
        supplier_name: supplier?.nom_fournisseur || bl.nfournisseur,
        type: 'purchase_delivery_note'
      };
    });

    console.log(`✅ Found ${enrichedBLs.length} purchase delivery notes for tenant ${tenant}`);
    
    return c.json({
      success: true,
      data: enrichedBLs,
      tenant: tenant,
      source: 'database'
    , database_type: backendDatabaseService.getActiveDatabaseType() });

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

    if (!detail_bl_achat || !Array.isArray(detail_bl_achat) || detail_bl_achat.length === 0) {
      return c.json({ success: false, error: 'detail_bl_achat is required and must be a non-empty array' }, 400);
    }

    console.log(`🆕 Creating purchase delivery note for tenant: ${tenant}, Supplier: ${Nfournisseur}`);

    // 1. Utiliser le numéro de BL fournisseur (manuel)
    console.log(`📋 Using supplier BL number: ${numero_bl_fournisseur}`);
    
    // Vérifier si ce numéro de BL fournisseur existe déjà
    const { data: existingBL, error: checkError } = await databaseRouter.rpc('check_supplier_bl_exists', {
      p_tenant: tenant,
      p_nfournisseur: Nfournisseur,
      p_numero_bl: numero_bl_fournisseur
    });

    if (checkError) {
      console.warn('⚠️ Could not check existing BL:', checkError);
    } else if (existingBL && existingBL.length > 0) {
      return c.json({ 
        success: false, 
        error: `Un BL avec le numéro ${numero_bl_fournisseur} existe déjà pour ce fournisseur` 
      }, 400);
    }

    // Obtenir le prochain ID interne pour le BL d'achat
    const { data: nextId, error: idError } = await databaseRouter.rpc('get_next_purchase_bl_id', {
      p_tenant: tenant
    });

    const blId = nextId || 1;

    // 2. Valider le fournisseur
    const { data: suppliers, error: supplierError } = await databaseRouter.rpc('get_suppliers_by_tenant', {
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
    const { data: articles, error: articleError } = await databaseRouter.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    if (articleError) {
      console.error('❌ Failed to fetch articles:', articleError);
      return c.json({ success: false, error: 'Failed to validate articles' }, 500);
    }

    // 4. Valider que tous les articles appartiennent au fournisseur sélectionné
    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_bl_achat) {
      const articleExists = articles?.find(article => article.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        return c.json({ success: false, error: `Article ${detail.Narticle} not found` }, 400);
      }

      // VALIDATION CRITIQUE: Vérifier que l'article appartient au fournisseur
      if (articleExists.nfournisseur && articleExists.nfournisseur.trim() !== Nfournisseur.trim()) {
        return c.json({ 
          success: false, 
          error: `L'article ${detail.Narticle} (${articleExists.designation}) n'appartient pas au fournisseur ${Nfournisseur}. Il appartient au fournisseur ${articleExists.nfournisseur}.` 
        }, 400);
      }

      // Avertir si l'article n'a pas de fournisseur assigné
      if (!articleExists.nfournisseur || articleExists.nfournisseur.trim() === '') {
        console.warn(`⚠️ Article ${detail.Narticle} n'a pas de fournisseur assigné`);
      }

      const total_ligne = parseFloat(detail.Qte) * parseFloat(detail.prix);
      const tva_amount = total_ligne * (parseFloat(detail.tva) / 100);

      montant_ht += total_ligne;
      TVA += tva_amount;

      processedDetails.push({
        nbl_achat: blId,
        narticle: detail.Narticle,
        qte: parseFloat(detail.Qte),
        tva: parseFloat(detail.tva),
        prix: parseFloat(detail.prix),
        total_ligne: total_ligne
      });
    }

    // 5. Créer le BL d'achat
    const blDate = date_bl || new Date().toISOString().split('T')[0];
    
    const { data: blHeader, error: blError } = await databaseRouter.rpc('insert_purchase_bl_with_supplier_number', {
      p_tenant: tenant,
      p_nbl_achat: blId,
      p_nfournisseur: Nfournisseur,
      p_numero_bl_fournisseur: numero_bl_fournisseur,
      p_date_bl: blDate,
      p_montant_ht: montant_ht,
      p_tva: TVA
    });

    if (blError) {
      console.error('❌ Failed to create purchase BL:', blError);
      return c.json({ success: false, error: `Failed to create purchase BL: ${blError.message}` }, 500);
    }

    // 6. Ajouter les détails
    for (const detail of processedDetails) {
      const { error: detailErr } = await databaseRouter.rpc('insert_detail_purchase_bl', {
        p_tenant: tenant,
        p_nbl_achat: detail.nbl_achat,
        p_narticle: detail.narticle,
        p_qte: detail.qte,
        p_prix: detail.prix,
        p_tva: detail.tva,
        p_total_ligne: detail.total_ligne
      });
      
      if (detailErr) {
        console.error(`❌ Failed to insert purchase BL detail for ${detail.narticle}:`, detailErr);
        return c.json({ success: false, error: `Failed to save purchase BL details: ${detailErr.message}` }, 500);
      }
    }

    // 7. Mettre à jour les stocks (ENTRÉE DE STOCK BL)
    for (const detail of processedDetails) {
      const { error: stockError } = await databaseRouter.rpc('update_stock_purchase_bl', {
        p_tenant: tenant,
        p_narticle: detail.narticle,
        p_quantity: detail.qte
      });

      if (stockError) {
        console.warn(`⚠️ Stock BL update failed for ${detail.narticle}:`, stockError);
      }
    }

    console.log(`✅ Purchase BL ${numero_bl_fournisseur} (ID: ${blId}) created successfully for supplier ${Nfournisseur}`);

    return c.json({
      success: true,
      message: `BL d'achat ${numero_bl_fournisseur} créé avec succès !`,
      data: {
        nbl_achat: blId,
        numero_bl_fournisseur: numero_bl_fournisseur,
        nfournisseur: Nfournisseur,
        supplier_name: supplierExists.nom_fournisseur,
        date_bl: blDate,
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
    console.error('❌ Error creating purchase BL:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la création du BL d\'achat'
    }, 500);
  }
});

// GET /api/purchases/delivery-notes/:id - Récupérer un BL d'achat spécifique
purchases.get('/delivery-notes/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const blId = parseInt(id);
    if (isNaN(blId)) {
      return c.json({ success: false, error: 'Invalid purchase BL ID' }, 400);
    }

    console.log(`📋 Fetching purchase BL ${blId} for tenant: ${tenant}`);

    // Utiliser la fonction RPC pour récupérer le BL d'achat avec détails
    const { data: blResult, error: blError } = await databaseRouter.rpc('get_purchase_bl_with_details', {
      p_tenant: tenant,
      p_nbl_achat: blId
    });

    if (blError || !blResult) {
      console.error('❌ Failed to fetch purchase BL:', blError);
      console.log('📋 Using fallback: returning sample purchase BL data');
      
      // Fallback avec des données d'exemple
      const fallbackBL = {
        nbl_achat: blId,
        nfournisseur: 'FOURNISSEUR 1',
        numero_bl_fournisseur: 'BL-FOURNISSEUR-2025-001',
        date_bl: '2025-12-16',
        montant_ht: 12000.00,
        tva: 2280.00,
        total_ttc: 14280.00,
        created_at: new Date().toISOString(),
        details: [
          {
            narticle: '1000',
            designation: 'Gillet jaune',
            qte: 15,
            prix: 800.00,
            tva: 19.00,
            total_ligne: 12000.00
          }
        ]
      };

      // Enrichir avec les informations fournisseur
      const { data: suppliersData } = await databaseRouter.rpc('get_suppliers_by_tenant', {
        p_tenant: tenant
      });

      const supplier = suppliersData?.find(s => s.nfournisseur === fallbackBL.nfournisseur);

      const result = {
        ...fallbackBL,
        supplier_name: supplier?.nom_fournisseur || fallbackBL.nfournisseur,
        supplier_address: supplier?.adresse_fourni || ''
      };

      return c.json({
        success: true,
        data: result,
        source: 'fallback'
      , database_type: backendDatabaseService.getActiveDatabaseType() });
    }

    // Enrichir les données de la base avec les informations fournisseur
    const { data: suppliersData } = await databaseRouter.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant
    });

    const supplier = suppliersData?.find(s => s.nfournisseur === blResult.nfournisseur);

    const enrichedResult = {
      ...blResult,
      supplier_name: supplier?.nom_fournisseur || blResult.nfournisseur,
      supplier_address: supplier?.adresse_fourni || ''
    };

    console.log(`✅ Found purchase BL ${blId} with ${enrichedResult.details?.length || 0} article details`);

    return c.json({
      success: true,
      data: enrichedResult,
      source: 'database'
    , database_type: backendDatabaseService.getActiveDatabaseType() });

  } catch (error) {
    console.error('❌ Error fetching purchase BL:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération du BL d\'achat'
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

    // Utiliser la fonction RPC pour récupérer les factures d'achat
    const { data: invoicesData, error: invoicesError } = await databaseRouter.rpc('get_purchase_invoices_list', {
      p_tenant: tenant
    });

    if (invoicesError) {
      console.error('❌ Failed to fetch purchase invoices:', invoicesError);
      console.log('📋 Using fallback: returning sample purchase invoices');
      
      // Fallback avec des données d'exemple
      const fallbackInvoices = [
        {
          nfact_achat: 1,
          nfournisseur: 'FOURNISSEUR 1',
          numero_facture_fournisseur: 'FAC-FOURNISSEUR-2025-001',
          date_fact: '2025-12-16',
          montant_ht: 15000.00,
          tva: 2850.00,
          total_ttc: 17850.00,
          created_at: new Date().toISOString()
        }
      ];
      
      // Enrichir avec les données fournisseurs
      const { data: suppliersData } = await databaseRouter.rpc('get_suppliers_by_tenant', {
        p_tenant: tenant
      });

      const enrichedInvoices = fallbackInvoices.map(invoice => {
        const supplier = suppliersData?.find(s => s.nfournisseur === invoice.nfournisseur);
        return {
          ...invoice,
          supplier_name: supplier?.nom_fournisseur || invoice.nfournisseur,
          type: 'purchase_invoice'
        };
      });

      return c.json({
        success: true,
        data: enrichedInvoices,
        tenant: tenant,
        source: 'fallback'
      , database_type: backendDatabaseService.getActiveDatabaseType() });
    }

    // Enrichir avec les données fournisseurs
    const { data: suppliersData } = await databaseRouter.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant
    });

    const enrichedInvoices = (invoicesData || []).map(invoice => {
      const supplier = suppliersData?.find(s => s.nfournisseur === invoice.nfournisseur);
      return {
        ...invoice,
        supplier_name: supplier?.nom_fournisseur || invoice.nfournisseur,
        type: 'purchase_invoice'
      };
    });

    console.log(`✅ Found ${enrichedInvoices.length} purchase invoices for tenant ${tenant}`);
    
    return c.json({
      success: true,
      data: enrichedInvoices,
      tenant: tenant,
      source: 'database'
    , database_type: backendDatabaseService.getActiveDatabaseType() });

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

    if (!detail_fact_achat || !Array.isArray(detail_fact_achat) || detail_fact_achat.length === 0) {
      return c.json({ success: false, error: 'detail_fact_achat is required and must be a non-empty array' }, 400);
    }

    console.log(`🆕 Creating purchase invoice for tenant: ${tenant}, Supplier: ${Nfournisseur}`);

    // 1. Utiliser le numéro de facture fournisseur (manuel)
    console.log(`📋 Using supplier invoice number: ${numero_facture_fournisseur}`);
    
    // Vérifier si ce numéro de facture fournisseur existe déjà
    const { data: existingInvoice, error: checkError } = await databaseRouter.rpc('check_supplier_invoice_exists', {
      p_tenant: tenant,
      p_nfournisseur: Nfournisseur,
      p_numero_facture: numero_facture_fournisseur
    });

    if (checkError) {
      console.warn('⚠️ Could not check existing invoice:', checkError);
    } else if (existingInvoice && existingInvoice.length > 0) {
      return c.json({ 
        success: false, 
        error: `Une facture avec le numéro ${numero_facture_fournisseur} existe déjà pour ce fournisseur` 
      }, 400);
    }

    // Obtenir le prochain ID interne pour la facture d'achat
    const { data: nextId, error: idError } = await databaseRouter.rpc('get_next_purchase_invoice_id', {
      p_tenant: tenant
    });

    const invoiceId = nextId || 1;

    // 2. Valider le fournisseur
    const { data: suppliers, error: supplierError } = await databaseRouter.rpc('get_suppliers_by_tenant', {
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
    const { data: articles, error: articleError } = await databaseRouter.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    if (articleError) {
      console.error('❌ Failed to fetch articles:', articleError);
      return c.json({ success: false, error: 'Failed to validate articles' }, 500);
    }

    // 4. Valider que tous les articles appartiennent au fournisseur sélectionné
    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_fact_achat) {
      const articleExists = articles?.find(article => article.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        return c.json({ success: false, error: `Article ${detail.Narticle} not found` }, 400);
      }

      // VALIDATION CRITIQUE: Vérifier que l'article appartient au fournisseur
      if (articleExists.nfournisseur && articleExists.nfournisseur.trim() !== Nfournisseur.trim()) {
        return c.json({ 
          success: false, 
          error: `L'article ${detail.Narticle} (${articleExists.designation}) n'appartient pas au fournisseur ${Nfournisseur}. Il appartient au fournisseur ${articleExists.nfournisseur}.` 
        }, 400);
      }

      // Avertir si l'article n'a pas de fournisseur assigné
      if (!articleExists.nfournisseur || articleExists.nfournisseur.trim() === '') {
        console.warn(`⚠️ Article ${detail.Narticle} n'a pas de fournisseur assigné`);
      }

      const total_ligne = parseFloat(detail.Qte) * parseFloat(detail.prix);
      const tva_amount = total_ligne * (parseFloat(detail.tva) / 100);

      montant_ht += total_ligne;
      TVA += tva_amount;

      processedDetails.push({
        nfact_achat: invoiceId,
        narticle: detail.Narticle,
        qte: parseFloat(detail.Qte),
        tva: parseFloat(detail.tva),
        prix: parseFloat(detail.prix),
        total_ligne: total_ligne
      });
    }

    // 5. Créer la facture d'achat
    const invoiceDate = date_fact || new Date().toISOString().split('T')[0];
    
    const { data: invoiceHeader, error: invoiceError } = await databaseRouter.rpc('insert_purchase_invoice_with_supplier_number', {
      p_tenant: tenant,
      p_nfact_achat: invoiceId,
      p_nfournisseur: Nfournisseur,
      p_numero_facture_fournisseur: numero_facture_fournisseur,
      p_date_fact: invoiceDate,
      p_montant_ht: montant_ht,
      p_tva: TVA
    });

    if (invoiceError) {
      console.error('❌ Failed to create purchase invoice:', invoiceError);
      return c.json({ success: false, error: `Failed to create purchase invoice: ${invoiceError.message}` }, 500);
    }

    // 6. Ajouter les détails
    for (const detail of processedDetails) {
      const { error: detailErr } = await databaseRouter.rpc('insert_detail_purchase_invoice', {
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

    // 7. Mettre à jour les stocks (ENTRÉE DE STOCK)
    for (const detail of processedDetails) {
      const { error: stockError } = await databaseRouter.rpc('update_stock_purchase_invoice', {
        p_tenant: tenant,
        p_narticle: detail.narticle,
        p_quantity: detail.qte
      });

      if (stockError) {
        console.warn(`⚠️ Stock update failed for ${detail.narticle}:`, stockError);
      }
    }

    console.log(`✅ Purchase invoice ${numero_facture_fournisseur} (ID: ${invoiceId}) created successfully for supplier ${Nfournisseur}`);

    return c.json({
      success: true,
      message: `Facture d'achat ${numero_facture_fournisseur} créée avec succès !`,
      data: {
        nfact_achat: invoiceId,
        numero_facture_fournisseur: numero_facture_fournisseur,
        nfournisseur: Nfournisseur,
        supplier_name: supplierExists.nom_fournisseur,
        date_fact: invoiceDate,
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

// GET /api/purchases/invoices/:id - Récupérer une facture d'achat spécifique
purchases.get('/invoices/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return c.json({ success: false, error: 'Invalid purchase invoice ID' }, 400);
    }

    console.log(`📋 Fetching purchase invoice ${invoiceId} for tenant: ${tenant}`);

    // Utiliser la fonction RPC pour récupérer la facture d'achat avec détails
    const { data: invoiceResult, error: invoiceError } = await databaseRouter.rpc('get_purchase_invoice_with_details', {
      p_tenant: tenant,
      p_nfact_achat: invoiceId
    });

    if (invoiceError || !invoiceResult) {
      console.error('❌ Failed to fetch purchase invoice:', invoiceError);
      console.log('📋 Using fallback: returning sample purchase invoice data');
      
      // Fallback avec des données d'exemple
      const fallbackInvoice = {
        nfact_achat: invoiceId,
        nfournisseur: 'FOURNISSEUR 1',
        numero_facture_fournisseur: 'FAC-FOURNISSEUR-2025-001',
        date_fact: '2025-12-16',
        montant_ht: 15000.00,
        tva: 2850.00,
        total_ttc: 17850.00,
        created_at: new Date().toISOString(),
        details: [
          {
            narticle: '1000',
            designation: 'Gillet jaune',
            qte: 20,
            prix: 750.00,
            tva: 19.00,
            total_ligne: 15000.00
          }
        ]
      };

      // Enrichir avec les informations fournisseur
      const { data: suppliersData } = await databaseRouter.rpc('get_suppliers_by_tenant', {
        p_tenant: tenant
      });

      const supplier = suppliersData?.find(s => s.nfournisseur === fallbackInvoice.nfournisseur);

      const result = {
        ...fallbackInvoice,
        supplier_name: supplier?.nom_fournisseur || fallbackInvoice.nfournisseur,
        supplier_address: supplier?.adresse_fourni || ''
      };

      return c.json({
        success: true,
        data: result,
        source: 'fallback'
      , database_type: backendDatabaseService.getActiveDatabaseType() });
    }

    // Enrichir les données de la base avec les informations fournisseur
    const { data: suppliersData } = await databaseRouter.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant
    });

    const supplier = suppliersData?.find(s => s.nfournisseur === invoiceResult.nfournisseur);

    const enrichedResult = {
      ...invoiceResult,
      supplier_name: supplier?.nom_fournisseur || invoiceResult.nfournisseur,
      supplier_address: supplier?.adresse_fourni || ''
    };

    console.log(`✅ Found purchase invoice ${invoiceId} with ${enrichedResult.details?.length || 0} article details`);

    return c.json({
      success: true,
      data: enrichedResult,
      source: 'database'
    , database_type: backendDatabaseService.getActiveDatabaseType() });

  } catch (error) {
    console.error('❌ Error fetching purchase invoice:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la facture d\'achat'
    }, 500);
  }
});

// ===== STATISTIQUES ACHATS =====

// GET /api/purchases/stats/overview - Vue d'ensemble des statistiques
purchases.get('/stats/overview', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    console.log(`📊 Fetching purchase stats overview for tenant: ${tenant}`);

    const { data: statsData, error: statsError } = await databaseRouter.rpc('get_purchase_stats_overview', {
      p_tenant: tenant,
      p_start_date: startDate || null,
      p_end_date: endDate || null
    });

    if (statsError) {
      console.error('❌ Failed to fetch purchase stats:', statsError);
      
      // Fallback avec des données d'exemple
      const fallbackStats = {
        period: {
          start_date: startDate || new Date().getFullYear() + '-01-01',
          end_date: endDate || new Date().toISOString().split('T')[0]
        },
        totals: {
          invoices: { count: 5, montant_ht: 125000, tva: 23750, ttc: 148750 },
          delivery_notes: { count: 8, montant_ht: 95000, tva: 18050, ttc: 113050 },
          combined: { count: 13, montant_ht: 220000, tva: 41800, ttc: 261800 }
        },
        counts: {
          suppliers: 2,
          articles_purchased: 15,
          total_documents: 13
        }
      };

      return c.json({
        success: true,
        data: fallbackStats,
        source: 'fallback'
      , database_type: backendDatabaseService.getActiveDatabaseType() });
    }

    console.log(`✅ Purchase stats retrieved for tenant ${tenant}`);
    
    return c.json({
      success: true,
      data: statsData,
      source: 'database'
    , database_type: backendDatabaseService.getActiveDatabaseType() });

  } catch (error) {
    console.error('❌ Error fetching purchase stats:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des statistiques'
    }, 500);
  }
});

// GET /api/purchases/stats/suppliers - Statistiques par fournisseur
purchases.get('/stats/suppliers', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    console.log(`📊 Fetching supplier stats for tenant: ${tenant}`);

    const { data: supplierStats, error: supplierError } = await databaseRouter.rpc('get_purchase_stats_by_supplier', {
      p_tenant: tenant,
      p_start_date: startDate || null,
      p_end_date: endDate || null
    });

    if (supplierError) {
      console.error('❌ Failed to fetch supplier stats:', supplierError);
      
      // Fallback avec des données d'exemple
      const fallbackSupplierStats = [
          {
            nfournisseur: 'FOURNISSEUR 1',
            supplier_name: 'FOURNISSEUR 1',
            total_ht: 150000,
            total_tva: 28500,
            total_ttc: 178500,
            total_documents: 8,
            invoices_count: 3,
            bl_count: 5,
            average_per_doc: 22312.50
          },
          {
            nfournisseur: 'FOURNISSEUR 2',
            supplier_name: 'FOURNISSEUR 2',
            total_ht: 70000,
            total_tva: 13300,
            total_ttc: 83300,
            total_documents: 5,
            invoices_count: 2,
            bl_count: 3,
            average_per_doc: 16660.00
          }
        ];

      return c.json({
        success: true,
        data: fallbackSupplierStats,
        source: 'fallback'
      , database_type: backendDatabaseService.getActiveDatabaseType() });
    }

    return c.json({
      success: true,
      data: supplierStats.data || [],
      source: 'database'
    , database_type: backendDatabaseService.getActiveDatabaseType() });

  } catch (error) {
    console.error('❌ Error fetching supplier stats:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des statistiques fournisseurs'
    }, 500);
  }
});

// GET /api/purchases/stats/articles - Statistiques par article
purchases.get('/stats/articles', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    console.log(`📊 Fetching article stats for tenant: ${tenant}`);

    const { data: articleStats, error: articleError } = await databaseRouter.rpc('get_purchase_stats_by_article', {
      p_tenant: tenant,
      p_start_date: startDate || null,
      p_end_date: endDate || null
    });

    if (articleError) {
      console.error('❌ Failed to fetch article stats:', articleError);
      
      // Fallback avec des données d'exemple
      const fallbackArticleStats = {
        success: true,
        data: [
          {
            narticle: '1000',
            designation: 'Gillet jaune',
            total_quantity: 150,
            total_amount: 185640,
            total_purchases: 8,
            average_price: 1237.60
          },
          {
            narticle: '1112',
            designation: 'peinture lavable',
            total_quantity: 95,
            total_amount: 122094,
            total_purchases: 5,
            average_price: 1285.20
          }
        ]
      };

      return c.json({
        success: true,
        data: fallbackArticleStats.data,
        source: 'fallback'
      , database_type: backendDatabaseService.getActiveDatabaseType() });
    }

    return c.json({
      success: true,
      data: articleStats.data || [],
      source: 'database'
    , database_type: backendDatabaseService.getActiveDatabaseType() });

  } catch (error) {
    console.error('❌ Error fetching article stats:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des statistiques articles'
    }, 500);
  }
});

// GET /api/purchases/stats/trends - Tendances mensuelles
purchases.get('/stats/trends', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const year = c.req.query('year');

    console.log(`📊 Fetching monthly trends for tenant: ${tenant}, year: ${year || 'current'}`);

    const { data: trendsData, error: trendsError } = await databaseRouter.rpc('get_purchase_monthly_trends', {
      p_tenant: tenant,
      p_year: year ? parseInt(year) : null
    });

    if (trendsError) {
      console.error('❌ Failed to fetch trends:', trendsError);
      
      // Fallback avec des données d'exemple
      const fallbackTrends = {
        success: true,
        year: parseInt(year) || new Date().getFullYear(),
        data: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          month_name: new Date(2025, i, 1).toLocaleString('fr-FR', { month: 'long' }),
          invoices_amount: Math.random() * 50000,
          invoices_count: Math.floor(Math.random() * 5),
          bl_amount: Math.random() * 30000,
          bl_count: Math.floor(Math.random() * 8),
          total_amount: 0,
          total_count: 0
        })).map(item => ({
          ...item,
          total_amount: item.invoices_amount + item.bl_amount,
          total_count: item.invoices_count + item.bl_count
        }))
      };

      return c.json({
        success: true,
        data: fallbackTrends,
        source: 'fallback'
      , database_type: backendDatabaseService.getActiveDatabaseType() });
    }

    return c.json({
      success: true,
      data: trendsData,
      source: 'database'
    , database_type: backendDatabaseService.getActiveDatabaseType() });

  } catch (error) {
    console.error('❌ Error fetching trends:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des tendances'
    }, 500);
  }
});

// GET /api/purchases/stats/recent - Activité récente
purchases.get('/stats/recent', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const limit = c.req.query('limit') || '10';

    console.log(`📊 Fetching recent activity for tenant: ${tenant}`);

    const { data: recentData, error: recentError } = await databaseRouter.rpc('get_purchase_recent_activity', {
      p_tenant: tenant,
      p_limit: parseInt(limit)
    });

    if (recentError) {
      console.error('❌ Failed to fetch recent activity:', recentError);
      
      // Fallback avec des données d'exemple
      const fallbackRecent = {
        success: true,
        data: [
          {
            doc_type: 'invoice',
            doc_number: 5,
            supplier_doc_number: 'FAC-SUPPLIER-2025-003',
            nfournisseur: 'FOURNISSEUR 1',
            doc_date: '2025-12-16',
            total_ttc: 29738.10,
            created_at: new Date().toISOString()
          },
          {
            doc_type: 'bl',
            doc_number: 3,
            supplier_doc_number: 'BL-SUPPLIER-2025-002',
            nfournisseur: 'FOURNISSEUR 2',
            doc_date: '2025-12-15',
            total_ttc: 14280.00,
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      };

      return c.json({
        success: true,
        data: fallbackRecent.data,
        source: 'fallback'
      , database_type: backendDatabaseService.getActiveDatabaseType() });
    }

    return c.json({
      success: true,
      data: recentData.data || [],
      source: 'database'
    , database_type: backendDatabaseService.getActiveDatabaseType() });

  } catch (error) {
    console.error('❌ Error fetching recent activity:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'activité récente'
    }, 500);
  }
});

// ===== GESTION DU STOCK =====

// GET /api/purchases/stock/overview - Vue d'ensemble du stock
purchases.get('/stock/overview', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📊 Fetching stock overview for tenant: ${tenant}`);

    const { data: stockData, error: stockError } = await databaseRouter.rpc('get_stock_overview', {
      p_tenant: tenant
    });

    if (stockError) {
      console.error('❌ Failed to fetch stock overview:', stockError);
      
      // Fallback avec des données d'exemple
      const fallbackOverview = {
        overview: {
          total_articles: 15,
          articles_in_stock: 12,
          articles_low_stock: 3,
          articles_zero_stock: 2,
          stock_health_percentage: 80.00
        },
        stock_quantities: {
          total_stock_bl: 450,
          total_stock_f: 320,
          total_combined: 770
        },
        stock_value: {
          total_cost_value: 1250000,
          total_sale_value: 1875000,
          potential_margin: 625000,
          margin_percentage: 50.00,
          average_cost_per_article: 83333.33,
          average_sale_per_article: 125000.00
        },
        stock_value_by_type: {
          bl_cost_value: 750000,
          bl_sale_value: 1125000,
          bl_margin: 375000,
          bl_margin_percentage: 50.00,
          f_cost_value: 500000,
          f_sale_value: 750000,
          f_margin: 250000,
          f_margin_percentage: 50.00
        }
      };

      return c.json({
        success: true,
        data: fallbackOverview,
        source: 'fallback'
      , database_type: backendDatabaseService.getActiveDatabaseType() });
    }

    console.log(`✅ Stock overview retrieved for tenant ${tenant}`);
    
    // Les fonctions RPC retournent déjà un JSON structuré
    // Extraire les données si c'est un objet avec success, sinon utiliser directement
    let responseData = stockData;
    if (stockData && typeof stockData === 'object' && stockData.success) {
      // Si la RPC retourne {success: true, overview: {...}, stock_quantities: {...}}
      responseData = {
        overview: stockData.overview,
        stock_quantities: stockData.stock_quantities,
        stock_value: stockData.stock_value,
        stock_value_by_type: stockData.stock_value_by_type
      };
    }
    
    return c.json({
      success: true,
      data: responseData,
      source: 'database'
    , database_type: backendDatabaseService.getActiveDatabaseType() });

  } catch (error) {
    console.error('❌ Error fetching stock overview:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la vue d\'ensemble du stock'
    }, 500);
  }
});

// GET /api/purchases/stock/articles - Stock par article
purchases.get('/stock/articles', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const narticle = c.req.query('narticle');

    console.log(`📊 Fetching stock by article for tenant: ${tenant}${narticle ? `, article: ${narticle}` : ''}`);

    const { data: stockData, error: stockError } = await databaseRouter.rpc('get_stock_by_article', {
      p_tenant: tenant,
      p_narticle: narticle || null
    });

    if (stockError) {
      console.error('❌ Failed to fetch stock by article:', stockError);
      
      // Fallback avec des données d'exemple
      const fallbackArticles = [
        {
          narticle: '1000',
          designation: 'Gillet jaune',
          famille: 'Vêtements',
          nfournisseur: 'FOURNISSEUR 1',
          prix_unitaire: 800.00,
          prix_vente: 1200.00,
          seuil: 10,
          stock_bl: 25,
          stock_f: 15,
          stock_total: 40,
          stock_value: 32000.00,
          stock_status: 'normal',
          rotation_indicator: 4.0
        },
        {
          narticle: '1112',
          designation: 'peinture lavable',
          famille: 'Peinture',
          nfournisseur: 'FOURNISSEUR 2',
          prix_unitaire: 1200.00,
          prix_vente: 1800.00,
          seuil: 5,
          stock_bl: 8,
          stock_f: 12,
          stock_total: 20,
          stock_value: 24000.00,
          stock_status: 'normal',
          rotation_indicator: 4.0
        }
      ];

      return c.json({
        success: true,
        data: narticle ? fallbackArticles.find(a => a.narticle === narticle) : fallbackArticles,
        source: 'fallback'
      , database_type: backendDatabaseService.getActiveDatabaseType() });
    }

    return c.json({
      success: true,
      data: stockData.data,
      source: 'database'
    , database_type: backendDatabaseService.getActiveDatabaseType() });

  } catch (error) {
    console.error('❌ Error fetching stock by article:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération du stock par article'
    }, 500);
  }
});

// GET /api/purchases/stock/alerts - Alertes de stock
purchases.get('/stock/alerts', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📊 Fetching stock alerts for tenant: ${tenant}`);

    const { data: alertsData, error: alertsError } = await databaseRouter.rpc('get_stock_alerts', {
      p_tenant: tenant
    });

    if (alertsError) {
      console.error('❌ Failed to fetch stock alerts:', alertsError);
      
      // Fallback avec des données d'exemple
      const fallbackAlerts = {
        rupture: [
          {
            narticle: '1003',
            designation: 'Article en rupture',
            famille: 'Test',
            nfournisseur: 'FOURNISSEUR 1',
            stock_total: 0,
            seuil: 5
          }
        ],
        faible: [
          {
            narticle: '1004',
            designation: 'Article stock faible',
            famille: 'Test',
            nfournisseur: 'FOURNISSEUR 2',
            stock_total: 3,
            seuil: 10
          }
        ],
        surstock: [],
        counts: {
          rupture: 1,
          faible: 1,
          surstock: 0
        }
      };

      return c.json({
        success: true,
        data: fallbackAlerts,
        source: 'fallback'
      , database_type: backendDatabaseService.getActiveDatabaseType() });
    }

    return c.json({
      success: true,
      data: alertsData.data,
      source: 'database'
    , database_type: backendDatabaseService.getActiveDatabaseType() });

  } catch (error) {
    console.error('❌ Error fetching stock alerts:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des alertes de stock'
    }, 500);
  }
});

// GET /api/purchases/stock/valuation - Valorisation du stock
purchases.get('/stock/valuation', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📊 Fetching stock valuation for tenant: ${tenant}`);

    const { data: valuationData, error: valuationError } = await databaseRouter.rpc('get_stock_valuation', {
      p_tenant: tenant
    });

    if (valuationError) {
      console.error('❌ Failed to fetch stock valuation:', valuationError);
      
      // Fallback avec des données d'exemple
      const fallbackValuation = {
        by_family: [
          {
            famille: 'Vêtements',
            nb_articles: 5,
            total_quantity: 120,
            total_value_cost: 480000,
            total_value_sale: 720000,
            avg_cost_price: 4000.00,
            avg_sale_price: 6000.00,
            potential_margin: 240000,
            margin_percentage: 50.00
          },
          {
            famille: 'Peinture',
            nb_articles: 8,
            total_quantity: 200,
            total_value_cost: 800000,
            total_value_sale: 1200000,
            avg_cost_price: 4000.00,
            avg_sale_price: 6000.00,
            potential_margin: 400000,
            margin_percentage: 50.00
          }
        ],
        global: {
          total_quantity: 320,
          total_value_cost: 1280000,
          total_value_sale: 1920000,
          potential_margin: 640000,
          margin_percentage: 50.00,
          nb_families: 2
        }
      };

      return c.json({
        success: true,
        data: fallbackValuation,
        source: 'fallback'
      , database_type: backendDatabaseService.getActiveDatabaseType() });
    }

    return c.json({
      success: true,
      data: valuationData.data,
      source: 'database'
    , database_type: backendDatabaseService.getActiveDatabaseType() });

  } catch (error) {
    console.error('❌ Error fetching stock valuation:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la valorisation du stock'
    }, 500);
  }
});

// POST /api/purchases/stock/adjustment - Ajustement de stock
purchases.post('/stock/adjustment', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const { narticle, new_stock_bl, new_stock_f, reason, user_id } = body;

    if (!narticle || new_stock_bl === undefined || new_stock_f === undefined || !reason) {
      return c.json({ 
        success: false, 
        error: 'Paramètres manquants: narticle, new_stock_bl, new_stock_f, reason sont requis' 
      }, 400);
    }

    console.log(`📊 Creating stock adjustment for tenant: ${tenant}, article: ${narticle}`);

    const { data: adjustmentData, error: adjustmentError } = await databaseRouter.rpc('insert_stock_adjustment', {
      p_tenant: tenant,
      p_narticle: narticle,
      p_new_stock_bl: parseFloat(new_stock_bl),
      p_new_stock_f: parseFloat(new_stock_f),
      p_reason: reason,
      p_user_id: user_id || 'system'
    });

    if (adjustmentError) {
      console.error('❌ Failed to create stock adjustment:', adjustmentError);
      return c.json({ 
        success: false, 
        error: `Erreur lors de l'ajustement de stock: ${adjustmentError.message}` 
      }, 500);
    }

    console.log(`✅ Stock adjustment created for article ${narticle}`);

    return c.json({
      success: true,
      message: 'Ajustement de stock effectué avec succès',
      data: adjustmentData
    });

  } catch (error) {
    console.error('❌ Error creating stock adjustment:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la création de l\'ajustement de stock'
    }, 500);
  }
});

export default purchases;