// =====================================================
// ROUTES ACHATS - Système avec CLÉ COMPOSITE pour MYSQL
// Utilise (nfact, nfournisseur) directement sur MySQL
// =====================================================

import { Hono } from 'hono';
import { backendDatabaseService } from '../services/databaseService.js';

const purchases = new Hono();

// Middleware pour extraire le tenant
purchases.use('*', async (
  c, next) => {
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

    const bachatResult = await backendDatabaseService.executeQuery(
      'SELECT * FROM bachat ORDER BY date_fact DESC',
      []
    );

    if (!bachatResult.success) {
      console.error('❌ Failed to fetch from bachat:', bachatResult.error);
      return c.json({ 
        success: false, 
        error: 'Erreur lors de la récupération des BL d\'achat'
      }, 500);
    }

    const bachatData = bachatResult.data;
    console.log(`✅ Found ${bachatData?.length || 0} records in bachat table`);

    // Récupérer les fournisseurs
    const suppliersResult = await backendDatabaseService.executeQuery(
      'SELECT * FROM fournisseur',
      []
    );

    const suppliersData = suppliersResult.success ? suppliersResult.data : [];

    // Formater les données
    const enrichedBLs = (bachatData || []).map(bl => {
      const supplier = suppliersData?.find(s => s.nfournisseur === bl.nfournisseur);
      
      const montant_ht = parseFloat(bl.montant_ht) || 0;
      const tva = parseFloat(bl.tva) || 0;
      const timbre = parseFloat(bl.timbre) || 0;
      const autre_taxe = parseFloat(bl.autre_taxe) || 0;
      const total_ttc = montant_ht + tva + timbre + autre_taxe;

      return {
        numero_bl_fournisseur: bl.nfact,
        nfournisseur: bl.nfournisseur,
        supplier_name: supplier?.nom_fournisseur || bl.nfournisseur,
        date_bl: bl.date_fact,
        montant_ht: montant_ht,
        tva: tva,
        total_ttc: total_ttc,
        created_at: bl.date_fact,
        type: 'purchase_delivery_note'
      };
    });

    console.log(`✅ Returning ${enrichedBLs.length} purchase delivery notes`);
    
    return c.json({
      success: true,
      data: enrichedBLs,
      tenant: tenant,
      source: 'mysql',
      database_type: 'mysql_composite_key'
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
    const checkResult = await backendDatabaseService.executeQuery(
      'SELECT * FROM bachat WHERE nfact = ? AND nfournisseur = ?',
      [numero_bl_fournisseur, Nfournisseur]
    );

    if (checkResult.success && checkResult.data && checkResult.data.length > 0) {
      return c.json({ 
        success: false, 
        error: `Le BL ${numero_bl_fournisseur} existe déjà pour le fournisseur ${Nfournisseur}` 
      }, 400);
    }

    // Valider le fournisseur
    const supplierResult = await backendDatabaseService.executeQuery(
      'SELECT * FROM fournisseur WHERE nfournisseur = ?',
      [Nfournisseur]
    );

    if (!supplierResult.success || !supplierResult.data || supplierResult.data.length === 0) {
      return c.json({ success: false, error: `Fournisseur ${Nfournisseur} non trouvé` }, 400);
    }

    const supplier = supplierResult.data[0];

    // Valider les articles
    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_bl_achat) {
      const articleResult = await backendDatabaseService.executeQuery(
        'SELECT * FROM article WHERE narticle = ?',
        [detail.Narticle]
      );

      if (!articleResult.success || !articleResult.data || articleResult.data.length === 0) {
        return c.json({ success: false, error: `Article ${detail.Narticle} non trouvé` }, 400);
      }

      const article = articleResult.data[0];

      // Validation: article appartient au fournisseur
      if (article.nfournisseur && article.nfournisseur.trim() !== Nfournisseur.trim()) {
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

    const blDate = date_bl || new Date().toISOString().split('T')[0];

    // Insérer le BL dans bachat
    const insertBLResult = await backendDatabaseService.executeQuery(
      `INSERT INTO bachat (nfact, date_fact, nfournisseur, montant_ht, ncheque, banque, tva, timbre, autre_taxe) 
       VALUES (?, ?, ?, ?, '', '', ?, 0, 0)`,
      [numero_bl_fournisseur, blDate, Nfournisseur, montant_ht, TVA]
    );

    if (!insertBLResult.success) {
      console.error('❌ Failed to create BL:', insertBLResult.error);
      return c.json({ success: false, error: `Erreur: ${insertBLResult.error}` }, 500);
    }

    // Insérer les détails dans bachat_detail
    for (const detail of processedDetails) {
      const insertDetailResult = await backendDatabaseService.executeQuery(
        `INSERT INTO bachat_detail (NFact, nfournisseur, Narticle, Qte, tva, prix, total_ligne) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [numero_bl_fournisseur, Nfournisseur, detail.narticle, detail.qte, detail.tva, detail.prix, detail.total_ligne]
      );

      if (!insertDetailResult.success) {
        console.error('❌ Failed to insert detail:', insertDetailResult.error);
        return c.json({ success: false, error: `Erreur détails: ${insertDetailResult.error}` }, 500);
      }

      // Mettre à jour le stock_bl
      await backendDatabaseService.executeQuery(
        'UPDATE article SET stock_bl = COALESCE(stock_bl, 0) + ? WHERE narticle = ?',
        [detail.qte, detail.narticle]
      );
    }

    console.log(`✅ BL ${numero_bl_fournisseur} créé pour ${Nfournisseur}`);

    return c.json({
      success: true,
      message: `BL d'achat ${numero_bl_fournisseur} créé avec succès !`,
      data: {
        numero_bl_fournisseur: numero_bl_fournisseur,
        nfournisseur: Nfournisseur,
        supplier_name: supplier.nom_fournisseur,
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
    const fournisseur = decodeURIComponent(c.req.param('fournisseur'));
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📋 Fetching BL ${numero} for supplier ${fournisseur}`);

    // Récupérer le BL
    const blResult = await backendDatabaseService.executeQuery(
      'SELECT * FROM bachat WHERE nfact = ? AND nfournisseur = ?',
      [numero, fournisseur]
    );

    if (!blResult.success || !blResult.data || blResult.data.length === 0) {
      return c.json({ 
        success: false, 
        error: 'BL d\'achat non trouvé'
      }, 404);
    }

    const bl = blResult.data[0];

    // Récupérer les détails
    const detailsResult = await backendDatabaseService.executeQuery(
      `SELECT d.*, a.designation 
       FROM bachat_detail d
       LEFT JOIN article a ON d.Narticle = a.narticle
       WHERE d.NFact = ? AND d.nfournisseur = ?`,
      [numero, fournisseur]
    );

    const details = (detailsResult.data || []).map(d => ({
      narticle: d.Narticle,
      designation: d.designation || d.Narticle,
      qte: parseFloat(d.Qte) || 0,
      prix: parseFloat(d.prix) || 0,
      tva: parseFloat(d.tva) || 0,
      total_ligne: parseFloat(d.total_ligne) || 0
    }));

    // Récupérer le fournisseur
    const supplierResult = await backendDatabaseService.executeQuery(
      'SELECT * FROM fournisseur WHERE nfournisseur = ?',
      [fournisseur]
    );

    const supplier = supplierResult.data?.[0];

    const montant_ht = parseFloat(bl.montant_ht) || 0;
    const tva = parseFloat(bl.tva) || 0;
    const timbre = parseFloat(bl.timbre) || 0;
    const autre_taxe = parseFloat(bl.autre_taxe) || 0;

    return c.json({
      success: true,
      data: {
        numero_bl_fournisseur: bl.nfact,
        nfournisseur: bl.nfournisseur,
        supplier_name: supplier?.nom_fournisseur || bl.nfournisseur,
        date_bl: bl.date_fact,
        montant_ht: montant_ht,
        tva: tva,
        timbre: timbre,
        autre_taxe: autre_taxe,
        total_ttc: montant_ht + tva + timbre + autre_taxe,
        details: details
      },
      source: 'mysql'
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

    const fachatResult = await backendDatabaseService.executeQuery(
      'SELECT * FROM fachat ORDER BY date_fact DESC',
      []
    );

    if (!fachatResult.success) {
      console.error('❌ Failed to fetch from fachat:', fachatResult.error);
      return c.json({ 
        success: false, 
        error: 'Erreur lors de la récupération des factures d\'achat'
      }, 500);
    }

    const fachatData = fachatResult.data;

    // Récupérer les fournisseurs
    const suppliersResult = await backendDatabaseService.executeQuery(
      'SELECT * FROM fournisseur',
      []
    );

    const suppliersData = suppliersResult.success ? suppliersResult.data : [];

    // Formater les données
    const enrichedInvoices = (fachatData || []).map(invoice => {
      const supplier = suppliersData?.find(s => s.nfournisseur === invoice.nfournisseur);
      
      const montant_ht = parseFloat(invoice.montant_ht) || 0;
      const tva = parseFloat(invoice.tva) || 0;
      const timbre = parseFloat(invoice.timbre) || 0;
      const autre_taxe = parseFloat(invoice.autre_taxe) || 0;
      const total_ttc = montant_ht + tva + timbre + autre_taxe;

      return {
        numero_facture_fournisseur: invoice.nfact,
        nfournisseur: invoice.nfournisseur,
        supplier_name: supplier?.nom_fournisseur || invoice.nfournisseur,
        date_fact: invoice.date_fact,
        montant_ht: montant_ht,
        tva: tva,
        total_ttc: total_ttc,
        payer: false,
        created_at: invoice.date_fact,
        type: 'purchase_invoice'
      };
    });

    console.log(`✅ Found ${enrichedInvoices.length} purchase invoices`);
    
    return c.json({
      success: true,
      data: enrichedInvoices,
      tenant: tenant,
      source: 'mysql',
      database_type: 'mysql_composite_key'
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

    // Vérifier si cette facture existe déjà
    const checkResult = await backendDatabaseService.executeQuery(
      'SELECT * FROM fachat WHERE nfact = ? AND nfournisseur = ?',
      [numero_facture_fournisseur, Nfournisseur]
    );

    if (checkResult.success && checkResult.data && checkResult.data.length > 0) {
      return c.json({ 
        success: false, 
        error: `La facture ${numero_facture_fournisseur} existe déjà pour le fournisseur ${Nfournisseur}` 
      }, 400);
    }

    // Valider le fournisseur
    const supplierResult = await backendDatabaseService.executeQuery(
      'SELECT * FROM fournisseur WHERE nfournisseur = ?',
      [Nfournisseur]
    );

    if (!supplierResult.success || !supplierResult.data || supplierResult.data.length === 0) {
      return c.json({ success: false, error: `Fournisseur ${Nfournisseur} non trouvé` }, 400);
    }

    const supplier = supplierResult.data[0];

    // Valider les articles et calculer les totaux
    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_fact_achat) {
      const articleResult = await backendDatabaseService.executeQuery(
        'SELECT * FROM article WHERE narticle = ?',
        [detail.Narticle]
      );

      if (!articleResult.success || !articleResult.data || articleResult.data.length === 0) {
        return c.json({ success: false, error: `Article ${detail.Narticle} non trouvé` }, 400);
      }

      const article = articleResult.data[0];

      // Validation: article appartient au fournisseur
      if (article.nfournisseur && article.nfournisseur.trim() !== Nfournisseur.trim()) {
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

    const invoiceDate = date_fact || new Date().toISOString().split('T')[0];

    // Insérer la facture dans fachat (sans ncheque et banque car ils existent déjà)
    const insertInvoiceResult = await backendDatabaseService.executeQuery(
      `INSERT INTO fachat (nfact, date_fact, nfournisseur, montant_ht, tva, timbre, autre_taxe, ncheque, banque) 
       VALUES (?, ?, ?, ?, ?, 0, 0, '', '')`,
      [numero_facture_fournisseur, invoiceDate, Nfournisseur, montant_ht, TVA]
    );

    if (!insertInvoiceResult.success) {
      console.error('❌ Failed to create invoice:', insertInvoiceResult.error);
      return c.json({ success: false, error: `Erreur: ${insertInvoiceResult.error}` }, 500);
    }

    // Insérer les détails dans fachat_detail
    for (const detail of processedDetails) {
      const insertDetailResult = await backendDatabaseService.executeQuery(
        `INSERT INTO fachat_detail (NFact, nfournisseur, Narticle, Qte, tva, prix, total_ligne) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [numero_facture_fournisseur, Nfournisseur, detail.narticle, detail.qte, detail.tva, detail.prix, detail.total_ligne]
      );

      if (!insertDetailResult.success) {
        console.error('❌ Failed to insert detail:', insertDetailResult.error);
        return c.json({ success: false, error: `Erreur détails: ${insertDetailResult.error}` }, 500);
      }

      // Mettre à jour le stock_f
      await backendDatabaseService.executeQuery(
        'UPDATE article SET stock_f = COALESCE(stock_f, 0) + ? WHERE narticle = ?',
        [detail.qte, detail.narticle]
      );
    }

    console.log(`✅ Facture ${numero_facture_fournisseur} créée pour ${Nfournisseur}`);

    return c.json({
      success: true,
      message: `Facture d'achat ${numero_facture_fournisseur} créée avec succès !`,
      data: {
        numero_facture_fournisseur: numero_facture_fournisseur,
        nfournisseur: Nfournisseur,
        supplier_name: supplier.nom_fournisseur,
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
    const fournisseur = decodeURIComponent(c.req.param('fournisseur'));
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📋 Fetching invoice ${numero} for supplier ${fournisseur}`);

    // Récupérer la facture
    const invoiceResult = await backendDatabaseService.executeQuery(
      'SELECT * FROM fachat WHERE nfact = ? AND nfournisseur = ?',
      [numero, fournisseur]
    );

    if (!invoiceResult.success || !invoiceResult.data || invoiceResult.data.length === 0) {
      return c.json({ 
        success: false, 
        error: 'Facture d\'achat non trouvée'
      }, 404);
    }

    const invoice = invoiceResult.data[0];

    // Récupérer les détails
    const detailsResult = await backendDatabaseService.executeQuery(
      `SELECT d.*, a.designation 
       FROM fachat_detail d
       LEFT JOIN article a ON d.Narticle = a.narticle
       WHERE d.NFact = ? AND d.nfournisseur = ?`,
      [numero, fournisseur]
    );

    const details = (detailsResult.data || []).map(d => ({
      narticle: d.Narticle,
      designation: d.designation || d.Narticle,
      qte: parseFloat(d.Qte) || 0,
      prix: parseFloat(d.prix) || 0,
      tva: parseFloat(d.tva) || 0,
      total_ligne: parseFloat(d.total_ligne) || 0
    }));

    // Récupérer le fournisseur
    const supplierResult = await backendDatabaseService.executeQuery(
      'SELECT * FROM fournisseur WHERE nfournisseur = ?',
      [fournisseur]
    );

    const supplier = supplierResult.data?.[0];

    const montant_ht = parseFloat(invoice.montant_ht) || 0;
    const tva = parseFloat(invoice.tva) || 0;
    const timbre = parseFloat(invoice.timbre) || 0;
    const autre_taxe = parseFloat(invoice.autre_taxe) || 0;

    return c.json({
      success: true,
      data: {
        numero_facture_fournisseur: invoice.nfact,
        nfournisseur: invoice.nfournisseur,
        supplier_name: supplier?.nom_fournisseur || invoice.nfournisseur,
        date_fact: invoice.date_fact,
        montant_ht: montant_ht,
        tva: tva,
        timbre: timbre,
        autre_taxe: autre_taxe,
        total_ttc: montant_ht + tva + timbre + autre_taxe,
        payer: false,
        details: details
      },
      source: 'mysql'
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
