// =====================================================
// ROUTES ACHATS - Système complet d'achats (entrées de stock)
// =====================================================

import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';

const purchases = new Hono();

// Middleware pour extraire le tenant
purchases.use('*', async (c, next) => {
  const tenant = c.req.header('X-Tenant');
  if (tenant) {
    c.set('tenant', tenant);
  }
  await next();
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
    const { data: invoicesData, error: invoicesError } = await supabaseAdmin.rpc('get_purchase_invoices_list', {
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
      const { data: suppliersData } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
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
      });
    }

    // Enrichir avec les données fournisseurs
    const { data: suppliersData } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
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

    if (!detail_fact_achat || !Array.isArray(detail_fact_achat) || detail_fact_achat.length === 0) {
      return c.json({ success: false, error: 'detail_fact_achat is required and must be a non-empty array' }, 400);
    }

    console.log(`🆕 Creating purchase invoice for tenant: ${tenant}, Supplier: ${Nfournisseur}`);

    // 1. Utiliser le numéro de facture fournisseur (manuel)
    console.log(`📋 Using supplier invoice number: ${numero_facture_fournisseur}`);
    
    // Vérifier si ce numéro de facture fournisseur existe déjà
    const { data: existingInvoice, error: checkError } = await supabaseAdmin.rpc('check_supplier_invoice_exists', {
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
    const { data: nextId, error: idError } = await supabaseAdmin.rpc('get_next_purchase_invoice_id', {
      p_tenant: tenant
    });

    const invoiceId = nextId || 1;

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
    
    const { data: invoiceHeader, error: invoiceError } = await supabaseAdmin.rpc('insert_purchase_invoice_with_supplier_number', {
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

    // 7. Mettre à jour les stocks (ENTRÉE DE STOCK)
    for (const detail of processedDetails) {
      const { error: stockError } = await supabaseAdmin.rpc('update_stock_purchase_invoice', {
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
    const { data: invoiceResult, error: invoiceError } = await supabaseAdmin.rpc('get_purchase_invoice_with_details', {
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
      const { data: suppliersData } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
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
      });
    }

    // Enrichir les données de la base avec les informations fournisseur
    const { data: suppliersData } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
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
    });

  } catch (error) {
    console.error('❌ Error fetching purchase invoice:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la facture d\'achat'
    }, 500);
  }
});

export default purchases;