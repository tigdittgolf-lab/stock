import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { databaseRouter } from '../services/databaseRouter.js';
import { PDFService } from '../services/pdfService.js';
import { numberToWords } from '../utils/numberToWords.js';

const pdf = new Hono();

// PDF service will load company info from database dynamically
const pdfService = new PDFService();

// Utility function to fetch BL data consistently
async function fetchBLData(tenant: string, id: string) {
  const requestedId = parseInt(id);
  
  if (isNaN(requestedId)) {
    throw new Error(`Invalid BL ID: ${id}`);
  }

  console.log(`📋 PDF: Fetching REAL BL data ${requestedId} for tenant: ${tenant}`);

  // Utiliser la fonction RPC pour récupérer le BL avec détails
  const { data: blResult, error: blError } = await databaseRouter.rpc('get_bl_with_details', {
    p_tenant: tenant,
    p_nfact: requestedId
  });

  if (blError) {
    console.error('❌ PDF: Failed to fetch REAL BL data:', blError);
    throw new Error(`Failed to fetch BL data: ${blError.message}`);
  }

  if (!blResult || blResult.error) {
    throw new Error(`BL ${requestedId} not found`);
  }

  console.log(`✅ PDF: Found REAL BL data ${requestedId} with ${blResult.details?.length || 0} items`);

  return blResult;
}

// Middleware to extract tenant from header
pdf.use('*', async (c, next) => {
  const tenant = c.req.header('X-Tenant');
  if (tenant) {
    c.set('tenant', tenant);
  }
  await next();
});

// Generate invoice PDF
pdf.get('/invoice/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = c.get('tenant');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📄 Generating invoice PDF for ID: ${id}, Tenant: ${tenant}`);

    // Fetch invoice data using our new RPC function with all details
    const { data: invoiceData, error } = await databaseRouter.rpc('get_fact_for_pdf', {
      p_tenant: tenant,
      p_nfact: parseInt(id)
    });

    if (error || !invoiceData) {
      console.error('Error fetching invoice for PDF:', error);
      return c.json({ success: false, error: 'Invoice not found' }, 404);
    }

    console.log(`✅ Invoice data with details fetched for PDF ID: ${id}`, {
      details_count: invoiceData.details?.length || 0,
      client: invoiceData.raison_sociale
    });

    // Adapter les données RPC au format attendu par le service PDF
    const adaptedData = {
      nfact: invoiceData.nfact,
      date_fact: invoiceData.date_fact,
      client: {
        raison_sociale: invoiceData.raison_sociale || 'Client non spécifié',
        adresse: invoiceData.adresse || '',
        nif: invoiceData.nif || '',
        rc: invoiceData.rc || ''
      },
      detail_fact: (invoiceData.details || []).map(detail => ({
        article: {
          narticle: detail.narticle,
          designation: detail.designation
        },
        qte: detail.qte,
        prix: detail.prix,
        tva: detail.tva,
        total_ligne: detail.total_ligne
      })),
      montant_ht: invoiceData.montant_ht || 0,
      tva: invoiceData.tva || 0,
      timbre: invoiceData.timbre || 0,
      autre_taxe: invoiceData.autre_taxe || 0
    };

    // Generate PDF with tenant info
    const doc = await pdfService.generateInvoice(adaptedData, tenant);
    const pdfBuffer = doc.output('arraybuffer');

    // Set response headers and return PDF
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `inline; filename="facture_${id}.pdf"`);

    return c.body(pdfBuffer as any);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return c.json({ success: false, error: 'Failed to generate invoice PDF' }, 500);
  }
});

// Generate delivery note PDF (format complet)
pdf.get('/delivery-note/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = c.get('tenant');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📄 Generating delivery note PDF for ID: ${id}, Tenant: ${tenant}`);

    // Fetch delivery note data using utility function
    try {
      var blData = await fetchBLData(tenant, id);
      console.log(`✅ Delivery note data fetched successfully for ID: ${id}`);
    } catch (error) {
      console.error('Error fetching delivery note:', error);
      return c.json({ success: false, error: 'Delivery note not found' }, 404);
    }

    // Adapter les données RPC au format attendu par le service PDF
    const adaptedData = {
      nfact: blData.nbl || blData.nfact,
      date_fact: blData.date_fact,
      client: {
        raison_sociale: blData.client_name || 'Client non spécifié',
        adresse: blData.client_address || ''
      },
      detail_bl: (blData.details || []).map(detail => ({
        article: {
          narticle: detail.narticle,
          designation: detail.designation
        },
        qte: detail.qte,
        prix: detail.prix,
        tva: detail.tva,
        total_ligne: detail.total_ligne
      })),
      montant_ht: blData.montant_ht || 0,
      tva: blData.tva || 0,
      timbre: blData.timbre || 0,
      autre_taxe: blData.autre_taxe || 0
    };

    console.log('📋 Adapted data for PDF:', JSON.stringify(adaptedData, null, 2));

    // Generate PDF with tenant info
    const doc = await pdfService.generateDeliveryNote(adaptedData, tenant);
    const pdfBuffer = doc.output('arraybuffer');

    // Set response headers and return PDF
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `inline; filename="bl_${id}.pdf"`);

    return c.body(pdfBuffer as any);
  } catch (error) {
    console.error('Error generating delivery note PDF:', error);
    return c.json({ success: false, error: 'Failed to generate delivery note PDF' }, 500);
  }
});

// Generate small delivery note PDF (format réduit)
pdf.get('/delivery-note-small/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = c.get('tenant');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📄 Generating small delivery note PDF for ID: ${id}, Tenant: ${tenant}`);

    // Fetch delivery note data using utility function
    try {
      var blData = await fetchBLData(tenant, id);
    } catch (error) {
      console.error('Error fetching delivery note:', error);
      return c.json({ success: false, error: 'Delivery note not found' }, 404);
    }

    // Adapter les données RPC au format attendu par le service PDF
    const adaptedData = {
      nfact: blData.nbl || blData.nfact,
      date_fact: blData.date_fact,
      client: {
        raison_sociale: blData.client_name || 'Client non spécifié',
        adresse: blData.client_address || ''
      },
      detail_bl: (blData.details || []).map(detail => ({
        article: {
          narticle: detail.narticle,
          designation: detail.designation
        },
        qte: detail.qte,
        prix: detail.prix,
        tva: detail.tva,
        total_ligne: detail.total_ligne
      })),
      montant_ht: blData.montant_ht || 0,
      tva: blData.tva || 0,
      timbre: blData.timbre || 0,
      autre_taxe: blData.autre_taxe || 0
    };

    // Generate small format PDF with tenant info
    const doc = await pdfService.generateSmallDeliveryNote(adaptedData, tenant);
    const pdfBuffer = doc.output('arraybuffer');

    // Set response headers and return PDF
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `inline; filename="bl_reduit_${id}.pdf"`);

    return c.body(pdfBuffer as any);
  } catch (error) {
    console.error('Error generating small delivery note PDF:', error);
    return c.json({ success: false, error: 'Failed to generate small delivery note PDF' }, 500);
  }
});

// Generate ticket receipt PDF (format ticket de caisse)
pdf.get('/delivery-note-ticket/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = c.get('tenant');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`🎫 Generating ticket receipt PDF for ID: ${id}, Tenant: ${tenant}`);

    // Fetch delivery note data using utility function
    try {
      var blData = await fetchBLData(tenant, id);
    } catch (error) {
      console.error('Error fetching delivery note:', error);
      return c.json({ success: false, error: 'Delivery note not found' }, 404);
    }

    // Adapter les données RPC au format attendu par le service PDF
    const adaptedData = {
      nfact: blData.nbl || blData.nfact,
      date_fact: blData.date_fact,
      client: {
        raison_sociale: blData.client_name || 'Client non spécifié',
        adresse: blData.client_address || ''
      },
      detail_bl: (blData.details || []).map(detail => ({
        article: {
          narticle: detail.narticle,
          designation: detail.designation
        },
        qte: detail.qte,
        prix: detail.prix,
        tva: detail.tva,
        total_ligne: detail.total_ligne
      })),
      montant_ht: blData.montant_ht || 0,
      tva: blData.tva || 0,
      timbre: blData.timbre || 0,
      autre_taxe: blData.autre_taxe || 0
    };

    // Generate ticket format PDF with tenant info
    const doc = await pdfService.generateTicketReceipt(adaptedData, tenant);
    const pdfBuffer = doc.output('arraybuffer');

    // Set response headers and return PDF
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `inline; filename="ticket_${id}.pdf"`);

    return c.body(pdfBuffer as any);
  } catch (error) {
    console.error('Error generating ticket receipt PDF:', error);
    return c.json({ success: false, error: 'Failed to generate ticket receipt PDF' }, 500);
  }
});

// Generate proforma invoice PDF
pdf.get('/proforma/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = c.get('tenant');
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📄 Generating proforma PDF for ID: ${id}, Tenant: ${tenant}`);

    // Fetch proforma data using the correct RPC function
    const { data: proformaResult, error } = await databaseRouter.rpc('get_proforma_by_id', {
      p_tenant: tenant,
      p_nfact: parseInt(id)
    });

    if (error || !proformaResult || !proformaResult.success) {
      console.error('Error fetching proforma:', error);
      return c.json({ success: false, error: 'Proforma not found' }, 404);
    }

    console.log(`✅ Proforma data fetched successfully for ID: ${id}`);

    // Get client and article data for enrichment
    const { data: clientsData } = await databaseRouter.rpc('get_clients_by_tenant', {
      p_tenant: tenant
    });

    const { data: articlesData } = await databaseRouter.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    const proforma = proformaResult.data;
    const client = clientsData?.find(c => c.nclient === proforma.nclient);

    // Adapter les données RPC au format attendu par le service PDF
    const adaptedData = {
      nfact: proforma.nfact,
      date_fact: proforma.date_fact,
      client: {
        raison_sociale: client?.raison_sociale || 'Client non spécifié',
        adresse: client?.adresse || '',
        nif: client?.nif || client?.i_fiscal || '',
        rc: client?.nrc || ''
      },
      detail_fact: (proforma.details || []).map(detail => {
        const article = articlesData?.find(a => a.narticle.trim() === detail.narticle.trim());
        return {
          article: {
            narticle: detail.narticle,
            designation: article?.designation || `Article ${detail.narticle}`
          },
          qte: detail.qte,
          prix: detail.prix,
          tva: detail.tva,
          total_ligne: detail.total_ligne
        };
      }),
      montant_ht: proforma.montant_ht || 0,
      tva: proforma.tva || 0,
      timbre: 0,
      autre_taxe: 0
    };

    // Generate PDF with PROFORMA watermark and tenant info
    const doc = await pdfService.generateProforma(adaptedData, tenant);
    const pdfBuffer = doc.output('arraybuffer');

    // Set response headers and return PDF
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `inline; filename="proforma_${id}.pdf"`);

    return c.body(pdfBuffer as any);
  } catch (error) {
    console.error('Error generating proforma PDF:', error);
    return c.json({ success: false, error: 'Failed to generate proforma PDF' }, 500);
  }
});

// Generate purchase invoice PDF
pdf.get('/purchase-invoice/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Fetch purchase invoice data
    const { data: invoiceData, error } = await supabaseAdmin
      .from('fachat')
      .select(`
        *,
        fournisseur!fk_fachat_fournisseur(nfournisseur, nom_fournisseur, adresse, nif, rc),
        fachat_detail:fachat_detail(
          id,
          narticle,
          qte,
          tva,
          prix,
          total_ligne,
          article:article(narticle, designation)
        )
      `)
      .eq('nfact', id)
      .single();

    if (error) {
      console.error('Error fetching purchase invoice:', error);
      throw error;
    }

    if (!invoiceData) {
      return c.json({ success: false, error: 'Purchase invoice not found' }, 404);
    }

    // Map supplier to client format and fachat_detail to detail_fact
    const mappedData = {
      ...invoiceData,
      client: {
        raison_sociale: invoiceData.fournisseur.nom_fournisseur,
        adresse: invoiceData.fournisseur.adresse,
        nif: invoiceData.fournisseur.nif,
        rc: invoiceData.fournisseur.rc
      },
      detail_fact: invoiceData.fachat_detail
    };

    // Generate PDF
    const doc = await pdfService.generateInvoice(mappedData);
    const pdfBuffer = doc.output('arraybuffer');

    // Set response headers and return PDF
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `inline; filename="facture_achat_${id}.pdf"`);

    return c.body(pdfBuffer as any);
  } catch (error) {
    console.error('Error generating purchase invoice PDF:', error);
    return c.json({ success: false, error: 'Failed to generate purchase invoice PDF' }, 500);
  }
});

// Generate purchase delivery note PDF
pdf.get('/purchase-delivery-note/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Fetch purchase delivery note data
    const { data: blData, error } = await supabaseAdmin
      .from('bachat')
      .select(`
        *,
        fournisseur!fk_bachat_fournisseur(nfournisseur, nom_fournisseur, adresse),
        bachat_detail:bachat_detail(
          id,
          narticle,
          qte,
          article:article(narticle, designation)
        )
      `)
      .eq('nfact', id)
      .single();

    if (error) {
      console.error('Error fetching purchase delivery note:', error);
      throw error;
    }

    if (!blData) {
      return c.json({ success: false, error: 'Purchase delivery note not found' }, 404);
    }

    // Map supplier to client format and bachat_detail to detail_bl
    const mappedData = {
      ...blData,
      client: {
        raison_sociale: blData.fournisseur.nom_fournisseur,
        adresse: blData.fournisseur.adresse
      },
      detail_bl: blData.bachat_detail
    };

    // Generate PDF
    const doc = await pdfService.generateDeliveryNote(mappedData);
    const pdfBuffer = doc.output('arraybuffer');

    // Set response headers and return PDF
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `inline; filename="bl_achat_${id}.pdf"`);

    return c.body(pdfBuffer as any);
  } catch (error) {
    console.error('Error generating purchase delivery note PDF:', error);
    return c.json({ success: false, error: 'Failed to generate purchase delivery note PDF' }, 500);
  }
});

export default pdf;

// Test endpoint for number to words conversion
pdf.get('/test-amount-words/:amount', async (c) => {
  try {
    const amount = parseFloat(c.req.param('amount'));
    
    if (isNaN(amount)) {
      return c.json({ success: false, error: 'Invalid amount' }, 400);
    }

    const words = numberToWords(amount);
    
    return c.json({
      success: true,
      amount: amount,
      words: words,
      formatted: `${amount.toFixed(2).replace('.', ',')} DA`,
      example: `Arrêté la présente facture à la somme de : ${words}`
    });
  } catch (error) {
    console.error('Error converting amount to words:', error);
    return c.json({ success: false, error: 'Failed to convert amount' }, 500);
  }
});

// Test endpoint for PDF generation with sample data
pdf.get('/test-invoice-pdf', async (c) => {
  try {
    const sampleInvoiceData = {
      nfact: 1,
      date_fact: new Date().toISOString(),
      client: {
        raison_sociale: 'CLIENT TEST',
        adresse: 'Adresse Test, Alger',
        nif: '123456789012345',
        rc: '12/34-5678901'
      },
      detail_fact: [
        {
          article: {
            designation: 'Article Test 1',
            narticle: 'ART001'
          },
          qte: 2,
          prix: 1500.00,
          tva: 19,
          total_ligne: 3570.00
        },
        {
          article: {
            designation: 'Article Test 2',
            narticle: 'ART002'
          },
          qte: 1,
          prix: 2500.00,
          tva: 19,
          total_ligne: 2975.00
        }
      ],
      montant_ht: 4000.00,
      tva: 760.00,
      timbre: 25.00,
      autre_taxe: 0.00
    };

    // Generate PDF
    const doc = await pdfService.generateInvoice(sampleInvoiceData);
    const pdfBuffer = doc.output('arraybuffer');

    // Set response headers and return PDF
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', 'inline; filename="test_facture.pdf"');

    return c.body(pdfBuffer as any);
  } catch (error) {
    console.error('Error generating test PDF:', error);
    return c.json({ success: false, error: 'Failed to generate test PDF' }, 500);
  }
});

// Debug endpoint to check RPC data format
pdf.get('/debug-bl/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = c.get('tenant') || '2025_bu01';

    console.log(`🔍 Debug BL data for ID: ${id}, Tenant: ${tenant}`);

    // Fetch delivery note data using utility function
    let blData = null;
    let error = null;
    
    try {
      blData = await fetchBLData(tenant, id);
    } catch (err) {
      error = err;
    }

    return c.json({
      success: true,
      tenant: tenant,
      id: id,
      data: blData,
      error: error,
      dataType: typeof blData,
      dataKeys: blData ? Object.keys(blData) : null
    });
  } catch (error) {
    console.error('Error debugging BL data:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});
// Test endpoint for delivery note PDF with amounts
pdf.get('/test-delivery-note-pdf', async (c) => {
  try {
    const sampleDeliveryData = {
      nfact: 7,
      date_fact: new Date().toISOString(),
      client: {
        raison_sociale: 'CLIENT TEST BL',
        adresse: 'Adresse Test BL, Alger'
      },
      detail_bl: [
        {
          article: {
            designation: 'drog1',
            narticle: '121'
          },
          qte: 2,
          prix: 285.60,
          tva: 19,
          total_ligne: 680.33
        },
        {
          article: {
            designation: 'lampe 12volts',
            narticle: '112'
          },
          qte: 1,
          prix: 77.35,
          tva: 19,
          total_ligne: 92.05
        }
      ],
      montant_ht: 649.90,
      tva: 123.48,
      timbre: 0,
      autre_taxe: 0
    };

    // Generate PDF
    const doc = await pdfService.generateDeliveryNote(sampleDeliveryData);
    const pdfBuffer = doc.output('arraybuffer');

    // Set response headers and return PDF
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', 'inline; filename="test_bl_avec_montant.pdf"');

    return c.body(pdfBuffer as any);
  } catch (error) {
    console.error('Error generating test delivery note PDF:', error);
    return c.json({ success: false, error: 'Failed to generate test delivery note PDF' }, 500);
  }
});