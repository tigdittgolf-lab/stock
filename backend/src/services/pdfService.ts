import { jsPDF } from 'jspdf';
import { numberToWords, amountInWords } from '../utils/numberToWords.js';
import { formatAmount, formatNumber, formatPercentage, formatQuantity } from '../utils/numberFormatter.js';

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email?: string;
  nif?: string;
  rc?: string;
}

interface InvoiceData {
  nfact: number;
  date_fact: string;
  client: {
    raison_sociale: string;
    adresse?: string;
    nif?: string;
    rc?: string;
  };
  detail_fact: Array<{
    article: {
      designation: string;
      narticle: string;
    };
    qte: number;
    prix: number;
    tva: number;
    total_ligne: number;
  }>;
  montant_ht: number;
  tva: number;
  timbre: number;
  autre_taxe: number;
}

interface DeliveryNoteData {
  nfact: number;
  date_fact: string;
  client: {
    raison_sociale: string;
    adresse?: string;
  };
  detail_bl: Array<{
    article: {
      designation: string;
      narticle: string;
    };
    qte: number;
    prix?: number;
    tva?: number;
    total_ligne?: number;
  }>;
  montant_ht?: number;
  tva?: number;
  timbre?: number;
  autre_taxe?: number;
}

export class PDFService {
  private companyInfo: CompanyInfo;

  constructor(companyInfo: CompanyInfo) {
    this.companyInfo = companyInfo;
  }

  /**
   * Generate invoice PDF
   */
  generateInvoice(invoiceData: InvoiceData): jsPDF {
    const doc = new jsPDF();
    let yPos = 20;

    // Header - Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', 105, yPos, { align: 'center' });
    yPos += 10;

    // Line under title
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 15;

    // Company info (left side)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(this.companyInfo.name, 20, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(this.companyInfo.address, 20, yPos);
    yPos += 5;
    doc.text(`Tel: ${this.companyInfo.phone}`, 20, yPos);
    yPos += 5;

    if (this.companyInfo.email) {
      doc.text(`Email: ${this.companyInfo.email}`, 20, yPos);
      yPos += 5;
    }

    if (this.companyInfo.nif) {
      doc.text(`NIF: ${this.companyInfo.nif}`, 20, yPos);
      yPos += 5;
    }

    if (this.companyInfo.rc) {
      doc.text(`RC: ${this.companyInfo.rc}`, 20, yPos);
    }

    // Invoice info (right side)
    yPos = 45;
    doc.setFontSize(10);
    doc.text(`Facture N: ${invoiceData.nfact}`, 140, yPos);
    yPos += 5;
    doc.text(`Date: ${new Date(invoiceData.date_fact).toLocaleDateString('fr-FR')}`, 140, yPos);

    // Client info
    yPos = 80;
    doc.setFont('helvetica', 'bold');
    doc.text('Client:', 20, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceData.client.raison_sociale, 20, yPos);
    yPos += 5;

    if (invoiceData.client.adresse) {
      doc.text(invoiceData.client.adresse, 20, yPos);
      yPos += 5;
    }

    if (invoiceData.client.nif) {
      doc.text(`NIF: ${invoiceData.client.nif}`, 20, yPos);
      yPos += 5;
    }

    // Table header
    yPos = 110;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Code', 20, yPos);
    doc.text('Designation', 45, yPos);
    doc.text('Qte', 105, yPos, { align: 'center' });
    doc.text('P.U.', 130, yPos, { align: 'center' });
    doc.text('TVA', 155, yPos, { align: 'center' });
    doc.text('Total', 180, yPos, { align: 'center' });

    // Line under header
    yPos += 2;
    doc.line(20, yPos, 190, yPos);
    yPos += 5;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    invoiceData.detail_fact.forEach((item) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(item.article.narticle.substring(0, 8), 20, yPos);
      doc.text(item.article.designation.substring(0, 25), 45, yPos);
      doc.text(formatQuantity(item.qte), 110, yPos, { align: 'right' });
      doc.text(formatNumber(item.prix), 140, yPos, { align: 'right' });
      doc.text(formatPercentage(item.tva), 165, yPos, { align: 'right' });
      doc.text(formatNumber(item.total_ligne), 190, yPos, { align: 'right' });

      yPos += 6;
    });

    // Totals section
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const totalTTC = invoiceData.montant_ht + invoiceData.tva + invoiceData.timbre + invoiceData.autre_taxe;

    doc.text('Sous-total HT:', 120, yPos);
    doc.text(formatAmount(invoiceData.montant_ht), 190, yPos, { align: 'right' });
    yPos += 6;

    doc.text('TVA:', 120, yPos);
    doc.text(formatAmount(invoiceData.tva), 190, yPos, { align: 'right' });
    yPos += 6;

    if (invoiceData.timbre > 0) {
      doc.text('Timbre:', 120, yPos);
      doc.text(formatAmount(invoiceData.timbre), 190, yPos, { align: 'right' });
      yPos += 6;
    }

    if (invoiceData.autre_taxe > 0) {
      doc.text('Autres taxes:', 120, yPos);
      doc.text(formatAmount(invoiceData.autre_taxe), 190, yPos, { align: 'right' });
      yPos += 6;
    }

    // Total TTC
    yPos += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL TTC:', 120, yPos);
    doc.text(formatAmount(totalTTC), 190, yPos, { align: 'right' });

    // Amount in words - CONFORME À LA RÉGLEMENTATION
    yPos += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Ligne de séparation avant le montant en lettres
    doc.line(20, yPos - 5, 190, yPos - 5);
    
    doc.text('Arrêté la présente facture à la somme de :', 20, yPos);
    yPos += 12; // ← Plus d'espace (était 8)

    const amountWords = numberToWords(totalTTC);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    // Encadrer le montant en lettres avec plus d'espace
    const textWidth = doc.getTextWidth(amountWords);
    const boxWidth = Math.min(textWidth + 16, 170); // ← Plus de padding (était 10)
    const boxHeight = 16; // ← Plus haut (était 12)
    
    doc.rect(20, yPos - 10, boxWidth, boxHeight); // ← Ajusté pour la nouvelle hauteur
    doc.text(amountWords, 28, yPos - 2, { // ← Plus de marge à gauche (était 25)
      maxWidth: 160
    });
    
    yPos += 18; // ← Plus d'espace après le cadre (était 10)

    // Signature
    yPos += 20;
    doc.setFont('helvetica', 'normal');
    doc.text('Signature et Cachet', 140, yPos);

    return doc;
  }

  /**
   * Generate delivery note PDF (format complet)
   */
  generateDeliveryNote(deliveryData: DeliveryNoteData): jsPDF {
    const doc = new jsPDF();
    let yPos = 20;

    // Header - Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('BON DE LIVRAISON', 105, yPos, { align: 'center' });
    yPos += 10;

    // Line under title
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 15;

    // Company info (left side)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(this.companyInfo.name, 20, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(this.companyInfo.address, 20, yPos);
    yPos += 5;
    doc.text(`Tel: ${this.companyInfo.phone}`, 20, yPos);

    // BL info (right side)
    yPos = 45;
    doc.setFontSize(10);
    doc.text(`BL N: ${deliveryData.nfact}`, 140, yPos);
    yPos += 5;
    doc.text(`Date: ${new Date(deliveryData.date_fact).toLocaleDateString('fr-FR')}`, 140, yPos);

    // Client info
    yPos = 70;
    doc.setFont('helvetica', 'bold');
    doc.text('Client:', 20, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(deliveryData.client.raison_sociale, 20, yPos);
    yPos += 5;

    if (deliveryData.client.adresse) {
      doc.text(deliveryData.client.adresse, 20, yPos);
    }

    // Table header
    yPos = 100;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Code', 20, yPos);
    doc.text('Designation', 45, yPos);
    doc.text('Qte', 105, yPos, { align: 'center' });
    doc.text('P.U.', 130, yPos, { align: 'center' });
    doc.text('TVA', 155, yPos, { align: 'center' });
    doc.text('Total', 180, yPos, { align: 'center' });

    // Line under header
    yPos += 2;
    doc.line(20, yPos, 190, yPos);
    yPos += 5;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    deliveryData.detail_bl.forEach((item) => {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(item.article.narticle.substring(0, 8), 20, yPos);
      doc.text(item.article.designation.substring(0, 25), 45, yPos);
      doc.text(formatQuantity(item.qte), 110, yPos, { align: 'right' });
      
      if (item.prix) {
        doc.text(formatNumber(item.prix), 140, yPos, { align: 'right' });
      }
      
      if (item.tva) {
        doc.text(formatPercentage(item.tva), 165, yPos, { align: 'right' });
      }
      
      if (item.total_ligne) {
        doc.text(formatNumber(item.total_ligne), 190, yPos, { align: 'right' });
      }

      yPos += 6;
    });

    // Totals section (si les montants sont disponibles)
    if (deliveryData.montant_ht !== undefined) {
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const totalTTC = (deliveryData.montant_ht || 0) + (deliveryData.tva || 0) + (deliveryData.timbre || 0) + (deliveryData.autre_taxe || 0);

      doc.text('Sous-total HT:', 120, yPos);
      doc.text(formatAmount(deliveryData.montant_ht || 0), 190, yPos, { align: 'right' });
      yPos += 6;

      doc.text('TVA:', 120, yPos);
      doc.text(formatAmount(deliveryData.tva || 0), 190, yPos, { align: 'right' });
      yPos += 6;

      if (deliveryData.timbre && deliveryData.timbre > 0) {
        doc.text('Timbre:', 120, yPos);
        doc.text(formatAmount(deliveryData.timbre), 190, yPos, { align: 'right' });
        yPos += 6;
      }

      if (deliveryData.autre_taxe && deliveryData.autre_taxe > 0) {
        doc.text('Autres taxes:', 120, yPos);
        doc.text(formatAmount(deliveryData.autre_taxe), 190, yPos, { align: 'right' });
        yPos += 6;
      }

      // Total TTC
      yPos += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TOTAL TTC:', 120, yPos);
      doc.text(formatAmount(totalTTC), 190, yPos, { align: 'right' });

      // Amount in words - AJOUTÉ POUR LES BONS DE LIVRAISON
      yPos += 15;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Ligne de séparation avant le montant en lettres
      doc.line(20, yPos - 5, 190, yPos - 5);
      
      doc.text('Arrêté le présent bon de livraison à la somme de :', 20, yPos);
      yPos += 12; // ← Plus d'espace (était 8)

      const amountWords = numberToWords(totalTTC);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      
      // Encadrer le montant en lettres avec plus d'espace
      const textWidth = doc.getTextWidth(amountWords);
      const boxWidth = Math.min(textWidth + 16, 170); // ← Plus de padding (était 10)
      const boxHeight = 16; // ← Plus haut (était 12)
      
      doc.rect(20, yPos - 10, boxWidth, boxHeight); // ← Ajusté pour la nouvelle hauteur
      doc.text(amountWords, 28, yPos - 2, { // ← Plus de marge à gauche (était 25)
        maxWidth: 160
      });
      
      yPos += 18; // ← Plus d'espace après le cadre (était 15)
    }

    // Note importante pour BL
    yPos += 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Note: Ce bon de livraison ne constitue pas une facture.', 20, yPos);
    doc.text('La facturation sera établie séparément.', 20, yPos + 4);

    // Signatures
    yPos += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Signature Livreur:', 20, yPos);
    doc.text('Signature Client:', 130, yPos);

    yPos += 20;
    doc.line(20, yPos, 80, yPos);
    doc.line(130, yPos, 190, yPos);

    return doc;
  }

  /**
   * Generate small delivery note PDF (format réduit)
   */
  generateSmallDeliveryNote(deliveryData: DeliveryNoteData): jsPDF {
    const doc = new jsPDF();
    let yPos = 20;

    // Title - Plus compact
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Bon N°: ${deliveryData.nfact}`, 105, yPos, { align: 'center' });
    yPos += 15;

    // Date et client sur la même ligne
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date(deliveryData.date_fact).toLocaleDateString('fr-FR')}`, 20, yPos);
    doc.text(`Code client: ${deliveryData.client.raison_sociale}`, 120, yPos);
    yPos += 20;

    // Table header - Plus compact
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Code', 20, yPos);
    doc.text('Désignation', 50, yPos);
    doc.text('Qté', 130, yPos, { align: 'center' });
    doc.text('P.U.', 155, yPos, { align: 'center' });
    doc.text('Total', 180, yPos, { align: 'center' });

    // Line under header
    yPos += 2;
    doc.line(20, yPos, 190, yPos);
    yPos += 5;

    // Table rows - Plus compact
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    deliveryData.detail_bl.forEach((item) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(item.article.narticle.substring(0, 6), 20, yPos);
      doc.text(item.article.designation.substring(0, 20), 50, yPos);
      doc.text(formatQuantity(item.qte), 135, yPos, { align: 'right' });
      
      if (item.prix) {
        doc.text(formatNumber(item.prix), 165, yPos, { align: 'right' });
      }
      
      if (item.total_ligne) {
        doc.text(formatNumber(item.total_ligne), 190, yPos, { align: 'right' });
      }

      yPos += 5;
    });

    // Total - Plus simple
    if (deliveryData.montant_ht !== undefined) {
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Net à payer:', 120, yPos);
      doc.text(formatAmount(deliveryData.montant_ht || 0), 190, yPos, { align: 'right' });
    }

    return doc;
  }

  /**
   * Generate ticket receipt PDF (format ticket de caisse)
   */
  generateTicketReceipt(deliveryData: DeliveryNoteData): jsPDF {
    // Format ticket - plus petit (80mm de large)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // 80mm de large, hauteur variable
    });
    
    let yPos = 10;

    // En-tête entreprise - Centré
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(this.companyInfo.name, 40, yPos, { align: 'center' });
    yPos += 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(this.companyInfo.phone, 40, yPos, { align: 'center' });
    yPos += 10;

    // Numéro de bon et date
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Bon N°: ${deliveryData.nfact}`, 40, yPos, { align: 'center' });
    yPos += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date(deliveryData.date_fact).toLocaleDateString('fr-FR')}`, 40, yPos, { align: 'center' });
    yPos += 4;
    doc.text(`Client: ${deliveryData.client.raison_sociale}`, 40, yPos, { align: 'center' });
    yPos += 8;

    // Ligne de séparation
    doc.line(5, yPos, 75, yPos);
    yPos += 5;

    // En-têtes colonnes - Format ticket
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Désignation', 5, yPos);
    doc.text('Qté', 50, yPos, { align: 'center' });
    doc.text('P.U.', 60, yPos, { align: 'center' });
    doc.text('Total', 70, yPos, { align: 'right' });
    yPos += 3;

    // Ligne sous en-têtes
    doc.line(5, yPos, 75, yPos);
    yPos += 3;

    // Articles - Format très compact
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);

    deliveryData.detail_bl.forEach((item) => {
      // Désignation sur une ligne
      const designation = item.article.designation.substring(0, 25);
      doc.text(designation, 5, yPos);
      yPos += 3;

      // Quantité, prix, total sur la ligne suivante
      doc.text(formatQuantity(item.qte), 50, yPos, { align: 'center' });
      
      if (item.prix) {
        doc.text(formatNumber(item.prix, 2), 60, yPos, { align: 'center' });
      }
      
      if (item.total_ligne) {
        doc.text(formatNumber(item.total_ligne, 2), 70, yPos, { align: 'right' });
      }

      yPos += 4;
    });

    // Ligne de séparation avant total
    yPos += 2;
    doc.line(5, yPos, 75, yPos);
    yPos += 4;

    // Total
    if (deliveryData.montant_ht !== undefined) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Net à payer:', 25, yPos);
      doc.text(formatAmount(deliveryData.montant_ht || 0), 70, yPos, { align: 'right' });
      yPos += 8;
    }

    // Message de remerciement
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Merci de votre visite', 40, yPos, { align: 'center' });

    return doc;
  }

  /**
   * Generate proforma invoice PDF
   */
  generateProforma(invoiceData: InvoiceData): jsPDF {
    const doc = this.generateInvoice(invoiceData);

    // Add "PROFORMA" watermark
    doc.setFontSize(60);
    doc.setTextColor(255, 0, 0);
    doc.setFont('helvetica', 'bold');
    
    // Rotate and add watermark
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.saveGraphicsState();
    doc.text('PROFORMA', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45
    });
    doc.restoreGraphicsState();

    return doc;
  }
}
