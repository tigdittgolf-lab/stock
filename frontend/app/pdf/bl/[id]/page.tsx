'use client';

import { useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

// Génère et télécharge le PDF côté client avec jsPDF
// Reproduit exactement le même rendu que le backend Bun/Hono

export default function PDFGeneratorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const mode = searchParams.get('mode') || 'complet'; // complet | reduit | ticket
  const tenantParam = searchParams.get('tenant');
  const generated = useRef(false);

  useEffect(() => {
    if (generated.current) return;
    generated.current = true;
    generateAndDownload();
  }, []);

  const getTenant = () => {
    if (tenantParam) return tenantParam;
    const ti = localStorage.getItem('tenant_info');
    if (ti) { try { return JSON.parse(ti).schema; } catch {} }
    return localStorage.getItem('selectedTenant') || '2025_bu01';
  };

  const generateAndDownload = async () => {
    const tenant = getTenant();
    const dbConfig = localStorage.getItem('activeDbConfig');
    const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';

    // Charger les données du BL
    let blData: any = null;
    let companyData: any = null;

    try {
      const [blRes, companyRes] = await Promise.all([
        fetch(`/api/sales/delivery-notes?id=${id}`, {
          headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType }
        }),
        fetch(`/api/settings/activities`, {
          headers: { 'X-Tenant': tenant }
        })
      ]);

      const blJson = await blRes.json();
      if (!blJson.success) {
        document.body.innerHTML = `<div style="padding:40px;color:red;font-family:sans-serif">❌ BL ${id} introuvable: ${blJson.error}</div>`;
        return;
      }
      blData = blJson.data;

      const companyJson = companyRes.ok ? await companyRes.json() : null;
      if (companyJson?.success && companyJson.data?.length > 0) {
        companyData = companyJson.data[0];
      }
    } catch (e: any) {
      document.body.innerHTML = `<div style="padding:40px;color:red;font-family:sans-serif">❌ Erreur: ${e.message}</div>`;
      return;
    }

    // Préparer les données
    const company = {
      name: companyData?.nom_entreprise || 'VOTRE ENTREPRISE',
      address: companyData?.adresse || '',
      phone: companyData?.telephone || companyData?.tel || companyData?.gsm || '',
      email: companyData?.email || '',
      nif: companyData?.nif || companyData?.ident_fiscal || '',
      rc: companyData?.rc || '',
      art: companyData?.art || '',
    };

    const bl = {
      nfact: blData.nfact || blData.nbl || parseInt(id),
      date_fact: blData.date_fact || blData.date_bl || blData.date || '',
      client: {
        raison_sociale: blData.client_name || blData.nclient || '',
        adresse: blData.client?.adresse || '',
      },
      montant_ht: parseFloat(blData.montant_ht?.toString() || '0') || 0,
      tva: parseFloat(blData.tva?.toString() || '0') || 0,
      montant_ttc: parseFloat(blData.montant_ttc?.toString() || '0') || 0,
      timbre: parseFloat(blData.timbre?.toString() || '0') || 0,
      detail_bl: (blData.detail_bl || blData.details || []).map((d: any) => ({
        narticle: d.narticle || d.article?.narticle || '',
        designation: d.designation || d.article?.designation || '',
        qte: parseFloat(d.qte?.toString() || '0') || 0,
        prix: parseFloat(d.prix?.toString() || '0') || 0,
        tva: parseFloat(d.tva?.toString() || '0') || 0,
        total_ligne: parseFloat(d.total_ligne?.toString() || '0') || 0,
      })),
    };

    // Calculer TTC si manquant
    if (!bl.montant_ttc || bl.montant_ttc === 0) {
      bl.montant_ttc = bl.montant_ht + bl.tva + bl.timbre;
    }

    // Importer jsPDF dynamiquement
    const { jsPDF } = await import('jspdf');

    const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '';
    const fmtQty = (n: number) => n % 1 === 0 ? n.toString() : n.toFixed(2);

    let doc: any;
    let filename = '';

    if (mode === 'ticket') {
      // ===== FORMAT TICKET (80mm) =====
      doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 220] });
      let y = 10;

      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text(company.name.substring(0, 30), 40, y, { align: 'center' }); y += 5;
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      if (company.phone) { doc.text(company.phone, 40, y, { align: 'center' }); y += 4; }
      y += 4;

      doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text(`Bon N°: ${bl.nfact}`, 40, y, { align: 'center' }); y += 4;
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${fmtDate(bl.date_fact)}`, 40, y, { align: 'center' }); y += 4;
      doc.text(`Client: ${bl.client.raison_sociale.substring(0, 25)}`, 40, y, { align: 'center' }); y += 6;

      doc.line(5, y, 75, y); y += 4;

      doc.setFontSize(7); doc.setFont('helvetica', 'bold');
      doc.text('Désignation', 5, y);
      doc.text('Qté', 45, y, { align: 'center' });
      doc.text('P.U.', 57, y, { align: 'center' });
      doc.text('Total', 73, y, { align: 'right' });
      y += 3; doc.line(5, y, 75, y); y += 3;

      doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
      bl.detail_bl.forEach((item: any) => {
        doc.text(item.designation.substring(0, 22), 5, y);
        doc.text(fmtQty(item.qte), 45, y, { align: 'center' });
        if (item.prix) doc.text(fmt(item.prix), 57, y, { align: 'center' });
        if (item.total_ligne) doc.text(fmt(item.total_ligne), 73, y, { align: 'right' });
        y += 4;
      });

      y += 2; doc.line(5, y, 75, y); y += 4;
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      if (bl.montant_ht > 0) {
        doc.text('Sous-total HT:', 20, y); doc.text(fmt(bl.montant_ht), 73, y, { align: 'right' }); y += 4;
      }
      if (bl.tva > 0) {
        doc.text('TVA:', 20, y); doc.text(fmt(bl.tva), 73, y, { align: 'right' }); y += 4;
      }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text('TOTAL TTC:', 20, y); doc.text(fmt(bl.montant_ttc), 73, y, { align: 'right' }); y += 8;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text('Merci de votre visite', 40, y, { align: 'center' });

      filename = `ticket_${bl.nfact}.pdf`;

    } else if (mode === 'reduit') {
      // ===== FORMAT RÉDUIT =====
      doc = new jsPDF();
      let y = 20;

      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text(`Bon N°: ${bl.nfact}`, 105, y, { align: 'center' }); y += 15;

      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${fmtDate(bl.date_fact)}`, 20, y);
      doc.text(`Client: ${bl.client.raison_sociale.substring(0, 30)}`, 120, y); y += 20;

      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('Code', 20, y); doc.text('Désignation', 50, y);
      doc.text('Qté', 130, y, { align: 'center' });
      doc.text('P.U.', 155, y, { align: 'center' });
      doc.text('Total', 180, y, { align: 'center' });
      y += 2; doc.line(20, y, 190, y); y += 5;

      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      bl.detail_bl.forEach((item: any) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.text(item.narticle.substring(0, 6), 20, y);
        doc.text(item.designation.substring(0, 20), 50, y);
        doc.text(fmtQty(item.qte), 135, y, { align: 'right' });
        if (item.prix) doc.text(fmt(item.prix), 165, y, { align: 'right' });
        if (item.total_ligne) doc.text(fmt(item.total_ligne), 190, y, { align: 'right' });
        y += 5;
      });

      y += 10;
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      if (bl.montant_ht > 0) {
        doc.text('Sous-total HT:', 120, y); doc.text(fmt(bl.montant_ht), 190, y, { align: 'right' }); y += 5;
      }
      if (bl.tva > 0) {
        doc.text('TVA:', 120, y); doc.text(fmt(bl.tva), 190, y, { align: 'right' }); y += 5;
      }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('TOTAL TTC:', 120, y); doc.text(fmt(bl.montant_ttc), 190, y, { align: 'right' });

      filename = `bl_reduit_${bl.nfact}.pdf`;

    } else {
      // ===== FORMAT COMPLET =====
      doc = new jsPDF();
      let y = 20;

      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text('BON DE LIVRAISON', 105, y, { align: 'center' }); y += 10;
      doc.setLineWidth(0.5); doc.line(20, y, 190, y); y += 15;

      // Côté droit: N° BL + date + client
      let ry = y;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`BL N: ${bl.nfact}`, 140, ry); ry += 5;
      doc.text(`Date: ${fmtDate(bl.date_fact)}`, 140, ry); ry += 10;
      doc.setFont('helvetica', 'bold'); doc.text('Client:', 140, ry); ry += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(bl.client.raison_sociale.substring(0, 25), 140, ry); ry += 5;
      if (bl.client.adresse) { doc.text(bl.client.adresse.substring(0, 25), 140, ry); ry += 5; }

      // Côté gauche: infos entreprise
      y = 45;
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text(company.name.substring(0, 35), 20, y); y += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      if (company.address) { doc.text(company.address.substring(0, 45), 20, y); y += 5; }
      if (company.phone) { doc.text(`Tél: ${company.phone}`, 20, y); y += 5; }
      if (company.email) { doc.text(`Email: ${company.email.substring(0, 35)}`, 20, y); y += 5; }
      if (company.nif) { doc.text(`NIF: ${company.nif}`, 20, y); y += 5; }
      if (company.rc) { doc.text(`RC: ${company.rc}`, 20, y); y += 5; }
      if (company.art) { doc.text(`Art: ${company.art}`, 20, y); y += 5; }

      y = Math.max(y + 15, ry + 10);

      // Tableau articles
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('Code', 20, y); doc.text('Designation', 45, y);
      doc.text('Qte', 105, y, { align: 'center' });
      doc.text('P.U.', 130, y, { align: 'center' });
      doc.text('TVA', 155, y, { align: 'center' });
      doc.text('Total', 180, y, { align: 'center' });
      y += 2; doc.line(20, y, 190, y); y += 5;

      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      bl.detail_bl.forEach((item: any) => {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.text(item.narticle.substring(0, 8), 20, y);
        doc.text(item.designation.substring(0, 25), 45, y);
        doc.text(fmtQty(item.qte), 110, y, { align: 'right' });
        if (item.prix) doc.text(fmt(item.prix), 140, y, { align: 'right' });
        if (item.tva) doc.text(`${item.tva}%`, 165, y, { align: 'right' });
        if (item.total_ligne) doc.text(fmt(item.total_ligne), 190, y, { align: 'right' });
        y += 6;
      });

      // Totaux
      y += 10;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('Sous-total HT:', 120, y); doc.text(fmt(bl.montant_ht), 190, y, { align: 'right' }); y += 6;
      doc.text('TVA:', 120, y); doc.text(fmt(bl.tva), 190, y, { align: 'right' }); y += 6;
      if (bl.timbre > 0) { doc.text('Timbre:', 120, y); doc.text(fmt(bl.timbre), 190, y, { align: 'right' }); y += 6; }
      y += 2;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text('TOTAL TTC:', 120, y); doc.text(fmt(bl.montant_ttc), 190, y, { align: 'right' });

      // Montant en lettres
      y += 15;
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.line(20, y - 5, 190, y - 5);
      doc.text('Arrêté le présent bon de livraison à la somme de :', 20, y); y += 12;
      const words = numberToWordsFr(bl.montant_ttc);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      const bw = Math.min(doc.getTextWidth(words) + 16, 170);
      doc.rect(20, y - 10, bw, 16);
      doc.text(words, 28, y - 2, { maxWidth: 160 }); y += 18;

      // Note + signatures
      y += 10;
      doc.setFontSize(8); doc.setFont('helvetica', 'italic');
      doc.text('Note: Ce bon de livraison ne constitue pas une facture.', 20, y); y += 4;
      doc.text('La facturation sera établie séparément.', 20, y); y += 20;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('Signature Livreur:', 20, y); doc.text('Signature Client:', 130, y); y += 20;
      doc.line(20, y, 80, y); doc.line(130, y, 190, y);

      filename = `bl_${bl.nfact}.pdf`;
    }

    // Ouvrir le PDF dans un nouvel onglet
    doc.output('dataurlnewwindow');
    // Fermer cette page après ouverture
    setTimeout(() => window.close(), 500);
  };

  return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 18, marginBottom: 16 }}>⏳ Génération du PDF en cours...</div>
      <div style={{ color: '#666', fontSize: 14 }}>Le PDF s'ouvrira automatiquement.</div>
    </div>
  );
}

// Conversion nombre en lettres (français)
function numberToWordsFr(n: number): string {
  if (n === 0) return 'Zéro Dinars';
  const units = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf',
    'Dix', 'Onze', 'Douze', 'Treize', 'Quatorze', 'Quinze', 'Seize', 'Dix-Sept', 'Dix-Huit', 'Dix-Neuf'];
  const tens = ['', '', 'Vingt', 'Trente', 'Quarante', 'Cinquante', 'Soixante', 'Soixante', 'Quatre-Vingt', 'Quatre-Vingt'];

  function convertHundreds(num: number): string {
    if (num === 0) return '';
    if (num < 20) return units[num];
    if (num < 100) {
      const t = Math.floor(num / 10), u = num % 10;
      if (t === 7 || t === 9) return tens[t] + (u > 0 ? '-' + units[10 + u] : (t === 8 ? 's' : ''));
      return tens[t] + (u > 0 ? '-' + units[u] : (t === 8 ? 's' : ''));
    }
    const h = Math.floor(num / 100), r = num % 100;
    return (h > 1 ? units[h] + ' ' : '') + 'Cent' + (r > 0 ? ' ' + convertHundreds(r) : (h > 1 ? 's' : ''));
  }

  const intPart = Math.floor(n);
  const decPart = Math.round((n - intPart) * 100);
  let result = '';

  if (intPart >= 1000000) {
    result += convertHundreds(Math.floor(intPart / 1000000)) + ' Million' + (Math.floor(intPart / 1000000) > 1 ? 's' : '') + ' ';
  }
  if (intPart >= 1000) {
    const thousands = Math.floor((intPart % 1000000) / 1000);
    if (thousands === 1) result += 'Mille ';
    else if (thousands > 1) result += convertHundreds(thousands) + ' Mille ';
  }
  result += convertHundreds(intPart % 1000);
  result = result.trim() + ' Dinars';
  if (decPart > 0) result += ' et ' + convertHundreds(decPart) + ' Centimes';
  return result;
}
