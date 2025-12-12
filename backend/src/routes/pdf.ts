import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { PDFService } from '../services/pdfService.js';

const pdf = new Hono();

// Company information - should be loaded from database or config
const companyInfo = {
  name: 'VOTRE ENTREPRISE',
  address: '123 Rue Example, Alger, Algérie',
  phone: '+213 XX XX XX XX',
  email: 'contact@entreprise.dz',
  nif: '000000000000000',
  rc: '00/00-0000000'
};

const pdfService = new PDFService(companyInfo);

// Generate invoice PDF
pdf.get('/invoice/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Fetch invoice data with all details
    const { data: invoiceData, error } = await supabaseAdmin
      .from('fact')
      .select(`
        *,
        client:client(nclient, raison_sociale, adresse, nif, rc),
        detail_fact:detail_fact(
          id,
          narticle,
          qte,
          tva,
          pr_achat,
          prix,
          total_ligne,
          article:article(narticle, designation)
        )
      `)
      .eq('nfact', id)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }

    if (!invoiceData) {
      return c.json({ success: false, error: 'Invoice not found' }, 404);
    }

    // Generate PDF
    const doc = pdfService.generateInvoice(invoiceData);
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

// Generate delivery note PDF
pdf.get('/delivery-note/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Fetch delivery note data
    const { data: blData, error } = await supabaseAdmin
      .from('bl')
      .select(`
        *,
        client:client(nclient, raison_sociale, adresse),
        detail_bl:detail_bl(
          id,
          narticle,
          qte,
          article:article(narticle, designation)
        )
      `)
      .eq('nfact', id)
      .single();

    if (error) {
      console.error('Error fetching delivery note:', error);
      throw error;
    }

    if (!blData) {
      return c.json({ success: false, error: 'Delivery note not found' }, 404);
    }

    // Generate PDF
    const doc = pdfService.generateDeliveryNote(blData);
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

// Generate proforma invoice PDF
pdf.get('/proforma/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Fetch proforma data
    const { data: profData, error } = await supabaseAdmin
      .from('fprof')
      .select(`
        *,
        client:client(nclient, raison_sociale, adresse, nif, rc),
        detail_fprof:detail_fprof(
          id,
          narticle,
          qte,
          tva,
          pr_achat,
          prix,
          total_ligne,
          article:article(narticle, designation)
        )
      `)
      .eq('nfact', id)
      .single();

    if (error) {
      console.error('Error fetching proforma:', error);
      throw error;
    }

    if (!profData) {
      return c.json({ success: false, error: 'Proforma not found' }, 404);
    }

    // Map detail_fprof to detail_fact for PDF generation
    const invoiceData = {
      ...profData,
      detail_fact: profData.detail_fprof
    };

    // Generate PDF
    const doc = pdfService.generateProforma(invoiceData);
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
    const doc = pdfService.generateInvoice(mappedData);
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
    const doc = pdfService.generateDeliveryNote(mappedData);
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
