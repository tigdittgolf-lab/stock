import { jsPDF } from 'jspdf';
import { amountToWordsFr } from '../utils/numberToWords.js';

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
  }>;
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
    doc.text('Qte', 110, yPos);
    doc.text('P.U.', 130, yPos);
    doc.text('TVA', 155, yPos);
    doc.text('Total', 175, yPos);

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

      doc.text(item.article.narticle.substring(0, 10), 20, yPos);
      doc.text(item.article.designation.substring(0, 30), 45, yPos);
      doc.text(item.qte.toString(), 110, yPos);
      doc.text(item.prix.toFixed(2), 130, yPos);
      doc.text(`${item.tva}%`, 155, yPos);
      doc.text(item.total_ligne.toFixed(2), 175, yPos);

      yPos += 6;
    });

    // Totals section
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const totalTTC = invoiceData.montant_ht + invoiceData.tva + invoiceData.timbre + invoiceData.autre_taxe;

    doc.text('Sous-total HT:', 130, yPos);
    doc.text(`${invoiceData.montant_ht.toFixed(2)} DA`, 175, yPos, { align: 'right' });
    yPos += 6;

    doc.text('TVA:', 130, yPos);
    doc.text(`${invoiceData.tva.toFixed(2)} DA`, 175, yPos, { align: 'right' });
    yPos += 6;

    if (invoiceData.timbre > 0) {
      doc.text('Timbre:', 130, yPos);
      doc.text(`${invoiceData.timbre.toFixed(2)} DA`, 175, yPos, { align: 'right' });
      yPos += 6;
    }

    if (invoiceData.autre_taxe > 0) {
      doc.text('Autres taxes:', 130, yPos);
      doc.text(`${invoiceData.autre_taxe.toFixed(2)} DA`, 175, yPos, { align: 'right' });
      yPos += 6;
    }

    // Total TTC
    yPos += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL TTC:', 130, yPos);
    doc.text(`${totalTTC.toFixed(2)} DA`, 175, yPos, { align: 'right' });

    // Amount in words
    yPos += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Arrete la presente facture a la somme de:', 20, yPos);
    yPos += 5;

    const amountInWords = amountToWordsFr(totalTTC, 'dinars', 'centimes');
    doc.setFont('helvetica', 'bold');
    doc.text(amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1), 105, yPos, {
      align: 'center',
      maxWidth: 170
    });

    // Signature
    yPos += 20;
    doc.setFont('helvetica', 'normal');
    doc.text('Signature et Cachet', 140, yPos);

    return doc;
  }

  /**
   * Generate delivery note PDF
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
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Code', 20, yPos);
    doc.text('Designation', 60, yPos);
    doc.text('Quantite', 160, yPos);

    // Line under header
    yPos += 2;
    doc.line(20, yPos, 190, yPos);
    yPos += 6;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    deliveryData.detail_bl.forEach((item) => {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(item.article.narticle, 20, yPos);
      doc.text(item.article.designation.substring(0, 50), 60, yPos);
      doc.text(item.qte.toString(), 160, yPos);

      yPos += 7;
    });

    // Signatures
    yPos += 20;
    doc.setFontSize(10);
    doc.text('Signature Livreur:', 20, yPos);
    doc.text('Signature Client:', 130, yPos);

    yPos += 20;
    doc.line(20, yPos, 80, yPos);
    doc.line(130, yPos, 190, yPos);

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
