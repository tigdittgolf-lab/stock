/**
 * Helper pour ajouter du texte arabe (RTL) dans un PDF jsPDF.
 * Utilise un canvas HTML pour rendre le texte arabe correctement
 * (reshaping + bidi), puis l'insère comme image dans le PDF.
 *
 * Usage (côté client uniquement) :
 *   await addArabicText(doc, 'فاتورة', x, y, { fontSize: 14, color: '#000' });
 */

interface ArabicTextOptions {
  fontSize?: number;
  color?: string;
  align?: 'right' | 'left' | 'center';
  fontFamily?: string;
}

/**
 * Rend du texte arabe sur un canvas et l'insère dans le PDF jsPDF.
 * @param doc     Instance jsPDF
 * @param text    Texte arabe à afficher
 * @param x       Position X en mm
 * @param y       Position Y en mm
 * @param width   Largeur disponible en mm (pour l'alignement)
 * @param opts    Options de style
 */
export async function addArabicText(
  doc: any,
  text: string,
  x: number,
  y: number,
  width: number = 80,
  opts: ArabicTextOptions = {}
): Promise<void> {
  if (typeof window === 'undefined') return; // Server-side: skip

  const {
    fontSize = 12,
    color = '#000000',
    align = 'right',
    fontFamily = 'Arial, Tahoma, sans-serif'
  } = opts;

  // Scale factor: 3.78 px/mm at 96dpi
  const scale = 3.78;
  const canvasW = Math.round(width * scale);
  const canvasH = Math.round((fontSize + 8) * scale);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvasW, canvasH);

  // Text style
  ctx.font = `${fontSize * scale * 0.4}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';

  const textX = align === 'right' ? canvasW - 4 : align === 'left' ? 4 : canvasW / 2;
  const textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
  ctx.textAlign = textAlign;

  ctx.fillText(text, textX, canvasH / 2);

  const imgData = canvas.toDataURL('image/png');
  doc.addImage(imgData, 'PNG', x, y - (fontSize / 2), width, fontSize + 2);
}

/**
 * Traductions françaises → arabes pour les termes courants des documents commerciaux.
 */
export const AR = {
  // Documents
  facture: 'فاتورة',
  bon_livraison: 'وصل التسليم',
  proforma: 'فاتورة مبدئية',
  avoir: 'إشعار دائن',
  declaration_g50: 'التصريح الجبائي G50',

  // En-têtes tableau
  designation: 'التسمية',
  quantite: 'الكمية',
  prix_unitaire: 'سعر الوحدة',
  tva: 'الرسم على القيمة المضافة',
  total: 'المجموع',
  reference: 'المرجع',

  // Totaux
  montant_ht: 'المبلغ بدون رسم',
  montant_tva: 'مبلغ الرسم',
  montant_ttc: 'المبلغ الإجمالي',
  timbre: 'طابع مالي',
  net_a_payer: 'صافي المبلغ الواجب دفعه',

  // Infos
  client: 'الزبون',
  fournisseur: 'المورد',
  date: 'التاريخ',
  numero: 'الرقم',
  adresse: 'العنوان',
  telephone: 'الهاتف',

  // Fiscal
  nif: 'رقم التعريف الجبائي',
  rc: 'السجل التجاري',
  art: 'رقم المادة',
  tva_collectee: 'الرسم على القيمة المضافة المحصل',
  tva_deductible: 'الرسم على القيمة المضافة القابل للخصم',
  tva_nette: 'صافي الرسم على القيمة المضافة',
  tap: 'الرسم على النشاط المهني',
  ca_ht: 'رقم الأعمال بدون رسم',
};
