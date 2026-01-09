import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { backendDatabaseService } from '../services/databaseService.js';
import { PDFService } from '../services/pdfService.js';
import { numberToWords } from '../utils/numberToWords.js';
import { createdDocumentsCache } from './sales.js';

const pdf = new Hono();

// PDF service will load company info from database dynamically
const pdfService = new PDFService();

// Utility function to fetch BL data consistently with full details
async function fetchBLData(tenant: string, id: string) {
  const requestedId = parseInt(id);
  
  console.log(`📋 PDF: Fetching BL data ${requestedId} for tenant: ${tenant}`);

  // Validation stricte de l'ID - PAS DE FALLBACK
  if (isNaN(requestedId) || requestedId <= 0) {
    console.error(`🚨 ERREUR: ID BL invalide ${id} - Aucun fallback utilisé`);
    throw new Error(`ID BL invalide: ${id}. Veuillez fournir un ID valide.`);
  }

  const actualId = requestedId; // Utiliser l'ID réel demandé

  // Essayer d'abord le cache
  const deliveryNotes = createdDocumentsCache.get(`${tenant}_bl`) || [];
  
  console.log(`📊 Cache contains ${deliveryNotes.length} delivery notes`);
  console.log(`📊 Available cache IDs:`, deliveryNotes.map(bl => bl.nbl || bl.nfact));
  
  // Recherche améliorée dans le cache - essayer plusieurs champs d'ID
  let blData = deliveryNotes.find(bl => 
    bl.nbl === actualId || 
    bl.nfact === actualId || 
    (bl as any).id === actualId
  );
  
  if (blData && blData.details && blData.details.length > 0) {
    console.log(`✅ PDF: Found complete BL data ${actualId} in cache with ${blData.details.length} articles`);
    // Vérifier que c'est bien le bon BL
    const foundId = blData.nbl || blData.nfact || (blData as any).id;
    if (foundId !== actualId) {
      console.error(`🚨 CACHE ERROR: Requested ID ${actualId} but found ID ${foundId}`);
      // Ne pas utiliser ce BL du cache, aller chercher en base
    } else {
      return blData;
    }
  }

  // Si pas dans le cache ou pas de détails, récupérer depuis la base de données
  console.log(`🔍 PDF: BL ${actualId} not in cache or incomplete, fetching from database...`);
  
  try {
    // CORRECTION: Utiliser directement get_bl_by_id qui maintenant inclut les détails
    const blResult = await backendDatabaseService.executeRPC('get_bl_by_id', {
      p_tenant: tenant,
      p_nfact: actualId
    });

    if (!blResult.success || !blResult.data) {
      console.error(`🚨 ERREUR: BL ${actualId} introuvable dans la base de données`);
      console.error(`🚨 Error details:`, blResult.error);
      throw new Error(`BL ${actualId} introuvable. ${blResult.error || 'Vérifiez que ce BL existe.'}`);
    }

    const blInfo = blResult.data;
    console.log(`✅ PDF: Found BL ${actualId} with ${blInfo.details?.length || 0} article details`);

    // Formater les données pour le PDF
    const formattedBL = {
      nfact: blInfo.nfact || blInfo.nbl,
      nbl: blInfo.nbl || blInfo.nfact,
      date_fact: blInfo.date_fact || blInfo.date_bl,
      client: {
        raison_sociale: blInfo.client_name || blInfo.nclient,
        adresse: blInfo.client_address || '',
        tel: blInfo.client_phone || ''
      },
      nclient: blInfo.nclient,
      montant_ht: blInfo.montant_ht || 0,
      tva: blInfo.tva || 0,
      montant_ttc: blInfo.montant_ttc || (blInfo.montant_ht + blInfo.tva) || 0,
      // CORRECTION: Formater les détails pour correspondre à l'interface DeliveryNoteData
      detail_bl: blInfo.details?.map((detail: any) => ({
        article: {
          designation: detail.designation || `Article ${detail.narticle}`,
          narticle: detail.narticle
        },
        qte: detail.qte || 0,
        prix: detail.prix || 0,
        tva: detail.tva || 0,
        total_ligne: detail.total_ligne || 0
      })) || [],
      details: blInfo.details || [], // Garder aussi l'ancien format pour compatibilité
      // Garder les champs originaux pour compatibilité
      ...blInfo
    };

    console.log(`✅ PDF: BL ${actualId} formatted successfully with ${formattedBL.details.length} details`);
    return formattedBL;

  } catch (error) {
    console.error(`❌ PDF: Error fetching BL ${actualId} from database:`, error);
    throw new Error(`Impossible de récupérer le BL ${actualId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
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
    const tenant = c.get('tenant') || '2025_bu01';

    console.log(`📄 Generating invoice PDF for ID: ${id}, Tenant: ${tenant}`);

    // Fetch invoice data
    const { data: invoiceData, error } = await supabaseAdmin.rpc('get_fact_by_id', {
      p_tenant: tenant,
      p_nfact: parseInt(id)
    });

    if (error || !invoiceData) {
      console.error('Error fetching invoice:', error);
      return c.json({ success: false, error: 'Invoice not found' }, 404);
    }

    // Generate PDF
    const pdfDoc = await pdfService.generateInvoice(invoiceData, tenant);
    const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="facture_${id}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return c.json({ success: false, error: 'Failed to generate PDF' }, 500);
  }
});

// Generate delivery note PDF (format complet)
pdf.get('/delivery-note/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = c.get('tenant') || '2025_bu01';

    console.log(`📄 Generating delivery note PDF for REAL ID: ${id}, Tenant: ${tenant}`);

    // Fetch delivery note data using utility function
    try {
      var blData = await fetchBLData(tenant, id);
      console.log(`✅ Delivery note data fetched successfully for REAL ID: ${id}`);
    } catch (error) {
      console.error('Error fetching delivery note:', error);
      return c.json({ success: false, error: error.message }, 404);
    }

    // Generate PDF using the correct method name
    const pdfDoc = await pdfService.generateDeliveryNote(blData, tenant);
    const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="bl_${id}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating delivery note PDF:', error);
    return c.json({ success: false, error: 'Failed to generate PDF' }, 500);
  }
});

// Generate small delivery note PDF (format réduit)
pdf.get('/delivery-note-small/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = c.get('tenant') || '2025_bu01';

    console.log(`📄 Generating small delivery note PDF for ID: ${id}, Tenant: ${tenant}`);

    // Fetch delivery note data using utility function
    try {
      var blData = await fetchBLData(tenant, id);
    } catch (error) {
      console.error('Error fetching delivery note:', error);
      return c.json({ success: false, error: error.message }, 404);
    }

    // Generate PDF using the correct method name
    const pdfDoc = await pdfService.generateSmallDeliveryNote(blData, tenant);
    const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="bl_small_${id}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating small delivery note PDF:', error);
    return c.json({ success: false, error: 'Failed to generate PDF' }, 500);
  }
});

// Generate ticket receipt PDF (format ticket de caisse)
pdf.get('/delivery-note-ticket/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = c.get('tenant') || '2025_bu01';

    console.log(`🎫 Generating ticket PDF for ID: ${id}, Tenant: ${tenant}`);

    // Fetch delivery note data using utility function
    try {
      var blData = await fetchBLData(tenant, id);
    } catch (error) {
      console.error('Error fetching delivery note:', error);
      return c.json({ success: false, error: error.message }, 404);
    }

    // Generate PDF using the correct method name
    const pdfDoc = await pdfService.generateTicketReceipt(blData, tenant);
    const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="ticket_${id}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating ticket PDF:', error);
    return c.json({ success: false, error: 'Failed to generate PDF' }, 500);
  }
});

// Generate proforma invoice PDF
pdf.get('/proforma/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = c.get('tenant') || '2025_bu01';

    console.log(`📄 Generating proforma PDF for ID: ${id}, Tenant: ${tenant}`);

    // Fetch proforma data
    const { data: proformaData, error } = await supabaseAdmin.rpc('get_fprof_by_id', {
      p_tenant: tenant,
      p_nfact: parseInt(id)
    });

    if (error || !proformaData) {
      console.error('Error fetching proforma:', error);
      return c.json({ success: false, error: 'Proforma not found' }, 404);
    }

    // Generate PDF
    const pdfDoc = await pdfService.generateProforma(proformaData, tenant);
    const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="proforma_${id}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating proforma PDF:', error);
    return c.json({ success: false, error: 'Failed to generate PDF' }, 500);
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

export default pdf;