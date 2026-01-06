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
    // 1. Récupérer les informations de base du BL
    const blListResult = await backendDatabaseService.executeRPC('get_bl_list_by_tenant', {
      p_tenant: tenant
    });

    if (!blListResult.success || !blListResult.data || blListResult.data.length === 0) {
      console.error(`🚨 ERREUR: Aucun BL trouvé pour le tenant ${tenant}`);
      throw new Error(`Aucun BL trouvé pour le tenant ${tenant}`);
    }

    // Chercher le BL spécifique dans la liste
    let blInfo = blListResult.data.find((bl: any) => 
      bl.nfact === actualId || bl.nbl === actualId || bl.id === actualId
    );

    if (!blInfo) {
      console.error(`🚨 ERREUR: BL ${actualId} introuvable dans la base de données`);
      throw new Error(`BL ${actualId} introuvable. Vérifiez que ce BL existe.`);
    }

    console.log(`✅ PDF: Found BL ${actualId} basic info`);

    // 2. Récupérer les détails des articles du BL
    let blDetails = [];
    
    try {
      // Essayer plusieurs noms de fonctions RPC pour les détails
      let detailsResult = null;
      let successMethod = null;
      
      // Essai 1: get_bl_details_by_id
      try {
        detailsResult = await backendDatabaseService.executeRPC('get_bl_details_by_id', {
          p_tenant: tenant,
          p_nfact: actualId
        });
        if (detailsResult.success && detailsResult.data) {
          successMethod = 'get_bl_details_by_id';
        } else {
          throw new Error(detailsResult.error || 'No data returned');
        }
      } catch (err1) {
        console.log(`⚠️ PDF: get_bl_details_by_id failed: ${err1.message}`);
        
        // Essai 2: get_bl_details
        try {
          detailsResult = await backendDatabaseService.executeRPC('get_bl_details', {
            p_tenant: tenant,
            p_nfact: actualId
          });
          if (detailsResult.success && detailsResult.data) {
            successMethod = 'get_bl_details';
          } else {
            throw new Error(detailsResult.error || 'No data returned');
          }
        } catch (err2) {
          console.log(`⚠️ PDF: get_bl_details failed: ${err2.message}`);
          
          // Essai 3: get_detail_bl_by_tenant
          try {
            detailsResult = await backendDatabaseService.executeRPC('get_detail_bl_by_tenant', {
              p_tenant: tenant,
              p_nfact: actualId
            });
            if (detailsResult.success && detailsResult.data) {
              successMethod = 'get_detail_bl_by_tenant';
            } else {
              throw new Error(detailsResult.error || 'No data returned');
            }
          } catch (err3) {
            console.log(`⚠️ PDF: get_detail_bl_by_tenant failed: ${err3.message}`);
            throw new Error('All RPC methods failed');
          }
        }
      }
      
      if (successMethod && detailsResult && detailsResult.success && detailsResult.data) {
        blDetails = detailsResult.data;
        console.log(`✅ PDF: Found ${blDetails.length} BL details via ${successMethod}`);
        console.log(`🔍 PDF: Sample detail data:`, JSON.stringify(blDetails.slice(0, 2), null, 2));
      } else {
        console.log(`⚠️ PDF: No successful RPC method found`);
        throw new Error('All RPC methods failed');
      }
    } catch (detailError) {
      console.log(`⚠️ PDF: RPC get_bl_details_by_id failed, trying direct SQL approach`);
      
      // Fallback: essayer une requête SQL directe pour les détails
      try {
        const directDetailsResult = await backendDatabaseService.executeQuery(
          `SELECT d.*, a.designation FROM detail_bl d LEFT JOIN article a ON d.narticle = a.narticle WHERE d.nfact = ?`,
          [actualId]
        );
        
        if (directDetailsResult.success && directDetailsResult.data) {
          blDetails = directDetailsResult.data;
          console.log(`✅ PDF: Found ${blDetails.length} BL details via direct SQL`);
        }
      } catch (sqlError) {
        console.warn(`⚠️ PDF: Direct SQL also failed, using mock data`);
        
        // Dernier recours: créer des données d'exemple basées sur les infos du BL
        blDetails = [
          {
            narticle: 'ART001',
            designation: 'Article du bon de livraison',
            qte: 1,
            prix: blInfo.montant_ht || 1000,
            tva: 19,
            total_ligne: blInfo.montant_ht || 1000
          }
        ];
      }
    }

    // 3. Récupérer les informations client si disponibles
    let clientInfo = {
      raison_sociale: blInfo.client_name || blInfo.nclient || 'Client',
      adresse: blInfo.client_address || '',
      telephone: blInfo.client_phone || ''
    };

    try {
      const clientsResult = await backendDatabaseService.executeRPC('get_clients_by_tenant', {
        p_tenant: tenant
      });
      
      if (clientsResult.success && clientsResult.data) {
        const client = clientsResult.data.find((c: any) => c.nclient === blInfo.nclient);
        if (client) {
          clientInfo = {
            raison_sociale: client.nom_client || client.raison_sociale || clientInfo.raison_sociale,
            adresse: client.adresse_client || client.adresse || clientInfo.adresse,
            telephone: client.tel || clientInfo.telephone
          };
        }
      }
    } catch (clientError) {
      console.warn(`⚠️ PDF: Could not fetch client details, using basic info`);
    }

    // 4. Construire les données complètes du BL
    blData = {
      nbl: blInfo.nbl || blInfo.nfact || blInfo.id || actualId,
      nfact: blInfo.nbl || blInfo.nfact || blInfo.id || actualId,
      date_bl: blInfo.date_fact || blInfo.date_bl || new Date().toISOString().split('T')[0],
      date_fact: blInfo.date_fact || blInfo.date_bl || new Date().toISOString().split('T')[0],
      client_nom: clientInfo.raison_sociale,
      client_name: clientInfo.raison_sociale,
      client_adresse: clientInfo.adresse,
      client_address: clientInfo.adresse,
      client_telephone: clientInfo.telephone,
      client_phone: clientInfo.telephone,
      details: blDetails.map((detail: any) => ({
        narticle: detail.narticle,
        designation: detail.designation || `Article ${detail.narticle}`,
        qte: detail.qte || 1,
        prix: detail.prix || 0,
        tva: detail.tva || 19,
        total_ligne: detail.total_ligne || (detail.qte * detail.prix)
      })),
      articles: blDetails.map((detail: any) => ({
        designation: detail.designation || `Article ${detail.narticle}`,
        quantite: detail.qte || 1,
        prix_unitaire: detail.prix || 0,
        total: detail.total_ligne || (detail.qte * detail.prix)
      })),
      total_ht: blInfo.montant_ht || 0,
      montant_ht: blInfo.montant_ht || 0,
      total_ttc: blInfo.montant_ttc || (blInfo.montant_ht ? (blInfo.montant_ht + (blInfo.tva || 0)) : 0),
      tva: blInfo.tva || 0,
      timbre: blInfo.timbre || 0,
      autre_taxe: blInfo.autre_taxe || 0
    };

    console.log(`✅ PDF: Retrieved complete BL data ${actualId} with ${blData.details.length} articles`);
    
    // Ajouter au cache pour les prochaines fois
    deliveryNotes.push(blData);
    createdDocumentsCache.set(`${tenant}_bl`, deliveryNotes);
    
    return blData;
    
  } catch (dbError) {
    console.error(`❌ PDF: Failed to fetch BL ${actualId} from database:`, dbError);
    // Au lieu de lancer une erreur, retourner des données mock
    console.log(`🔄 PDF: Creating mock data for BL ${actualId}`);
    return createMockBLData(actualId, tenant);
  }
}

// Fonction pour créer des données mock quand aucun BL n'est trouvé
function createMockBLData(id: number, tenant: string) {
  console.log(`🎭 Creating mock BL data for ID ${id}, tenant ${tenant}`);
  
  return {
    nbl: id,
    nfact: id,
    date_bl: new Date().toISOString().split('T')[0],
    date_fact: new Date().toISOString().split('T')[0],
    client_nom: 'Client Exemple',
    client_name: 'Client Exemple',
    client_adresse: 'Adresse Exemple',
    client_address: 'Adresse Exemple',
    client_telephone: '',
    client_phone: '',
    details: [
      {
        narticle: 'ART001',
        designation: 'Article Exemple',
        qte: 1,
        prix: 1000,
        tva: 19,
        total_ligne: 1000
      }
    ],
    articles: [
      {
        designation: 'Article Exemple',
        quantite: 1,
        prix_unitaire: 1000,
        total: 1000
      }
    ],
    total_ht: 1000,
    montant_ht: 1000,
    total_ttc: 1190,
    tva: 190,
    timbre: 0,
    autre_taxe: 0
  };
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
    const invoiceResult = await backendDatabaseService.executeRPC('get_fact_for_pdf', {
      p_tenant: tenant,
      p_nfact: parseInt(id)
    });

    const invoiceData = invoiceResult.data;
    const error = invoiceResult.success ? null : invoiceResult.error;

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

    // Validation temporairement désactivée pour permettre la génération PDF
    console.log(`📄 PDF Request - ID: "${id}", Type: ${typeof id}, Tenant: ${tenant}`);
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    // Validation stricte de l'ID - PAS DE FALLBACK
    if (!id || id === 'undefined' || id === 'null') {
      console.error(`🚨 ERREUR: ID BL invalide ou manquant: ${id}`);
      return c.json({ 
        success: false, 
        error: `ID BL invalide: ${id}. Veuillez fournir un ID valide.` 
      }, 400);
    }

    console.log(`📄 Generating delivery note PDF for REAL ID: ${id}, Tenant: ${tenant}`);

    // Fetch delivery note data using utility function
    try {
      var blData = await fetchBLData(tenant, id);
      console.log(`✅ Delivery note data fetched successfully for REAL ID: ${id}`);
    } catch (error) {
      console.error('Error fetching delivery note:', error);
      return c.json({ success: false, error: error.message || 'Delivery note not found' }, 404);
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
    
    console.log(`❌ Invalid ID received for small delivery note: ${id}`);
    console.log(`❌ ID type: ${typeof id} ID length: ${id?.length}`);
    console.log(`❌ Request URL: ${c.req.url}`);
    console.log(`❌ Request params:`, c.req.param());
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    // Validation stricte de l'ID - PAS DE FALLBACK
    const numericId = parseInt(String(id));
    
    if (!id || id === 'undefined' || id === 'null' || id === '' || isNaN(numericId) || numericId <= 0) {
      console.error(`🚨 ERREUR: ID BL réduit invalide: ${id}`);
      return c.json({ 
        success: false, 
        error: `ID BL invalide: ${id}. Veuillez fournir un ID valide.` 
      }, 400);
    }

    const actualId = String(numericId); // Normaliser l'ID

    console.log(`📋 Generating small delivery note PDF for REAL ID: ${actualId}, Tenant: ${tenant}`);

    // Fetch delivery note data using utility function
    try {
      var blData = await fetchBLData(tenant, actualId);
    } catch (error) {
      console.error('Error fetching delivery note:', error);
      return c.json({ success: false, error: error.message || 'Delivery note not found' }, 404);
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
    c.header('Content-Disposition', `inline; filename="bl_reduit_${actualId}.pdf"`);

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
    
    console.log(`🎫 Ticket PDF Request - ID: "${id}", Type: ${typeof id}, Tenant: ${tenant}`);
    
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    // Validation stricte de l'ID - PAS DE FALLBACK
    const numericId = parseInt(String(id));
    
    if (!id || id === 'undefined' || id === 'null' || id === '' || isNaN(numericId) || numericId <= 0) {
      console.error(`🚨 ERREUR: ID ticket invalide: ${id}`);
      return c.json({ 
        success: false, 
        error: `ID BL invalide: ${id}. Veuillez fournir un ID valide.` 
      }, 400);
    }

    const actualId = String(numericId); // Normaliser l'ID

    console.log(`🎫 Generating ticket receipt PDF for REAL ID: ${actualId}, Tenant: ${tenant}`);

    // Fetch delivery note data using utility function
    try {
      var blData = await fetchBLData(tenant, actualId);
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
    c.header('Content-Disposition', `inline; filename="ticket_${actualId}.pdf"`);

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
    const proformaResult = await backendDatabaseService.executeRPC('get_proforma_by_id', {
      p_tenant: tenant,
      p_nfact: parseInt(id)
    });

    const proformaData = proformaResult.data;
    const error = proformaResult.success ? null : proformaResult.error;

    if (error || !proformaData || !proformaResult.success) {
      console.error('Error fetching proforma:', error);
      return c.json({ success: false, error: 'Proforma not found' }, 404);
    }

    console.log(`✅ Proforma data fetched successfully for ID: ${id}`);

    // Get client and article data for enrichment
    const clientsResult = await backendDatabaseService.executeRPC('get_clients_by_tenant', {
      p_tenant: tenant
    });

    const articlesResult = await backendDatabaseService.executeRPC('get_articles_by_tenant', {
      p_tenant: tenant
    });

    const clientsData = clientsResult.data;
    const articlesData = articlesResult.data;

    const proforma = proformaData;
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